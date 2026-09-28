# subtrack — Diseño v1

- **Fecha:** 2026-09-28
- **Estado:** aprobado en conversación, pendiente de revisión escrita

## 1. Objetivo

App web para ver y gestionar las suscripciones activas: cuánto se gasta al mes y al año, qué se cobra pronto y cuánto va a cada categoría.

- **Para qué:** proyecto de portfolio (repo público en GitHub desde el principio) y uso propio, autoalojado en el servidor de casa.
- **Criterio de éxito de v1:** una sola persona puede entrar, apuntar sus suscripciones (incluidas las compartidas) y ver en el panel su gasto real y los próximos cobros; todo arranca con `docker compose up` y los tests pasan en CI.
- **Fuera de v1:** avisos por Telegram, importar CSV del banco, reparto completo de gastos compartidos (quién debe qué), varias monedas, varios usuarios, tests E2E.

## 2. Arquitectura

- **Monorepo:** `backend/` (Spring Boot) + `frontend/` (React).
- **Producción:** Spring Boot sirve el build estático de React → **una sola imagen** (Dockerfile multi-stage: build de Node → build de Maven → JRE). `docker-compose.yml` con dos servicios: `app` + `postgres` (volumen persistente).
- **Desarrollo:** Vite con proxy de `/api` al backend en local.
- **Rutas del frontend:** Spring reenvía a `index.html` cualquier ruta que no sea `/api/**` ni un fichero estático, para que funcione React Router al recargar.

### Stack

| Capa | Elección |
| :--- | :--- |
| Backend | Java 25, Spring Boot (Maven), Spring Web, Spring Data JPA, Spring Security, Bean Validation, Flyway |
| Base de datos | PostgreSQL |
| Frontend | Vite + React + TypeScript, React Router, TanStack Query, react-i18next, Tailwind CSS + shadcn/ui (Sonner para avisos) |
| Tests | JUnit 5, AssertJ, MockMvc, Testcontainers · Vitest, React Testing Library, MSW |
| CI | GitHub Actions |

Las versiones exactas se confirman con la documentación oficial al escribir el plan de implementación.

### Configuración (variables de entorno)

| Variable | Uso |
| :--- | :--- |
| `SUBTRACK_USERNAME` | Usuario de la única cuenta |
| `SUBTRACK_PASSWORD_HASH` | Hash BCrypt de la contraseña (el README explica cómo generarlo) |
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | Conexión a Postgres |

## 3. Modelo de datos

Migraciones con Flyway. Solo EUR, sin campo de moneda. Sin `user_id` (una sola cuenta).

| Tabla | Campos |
| :--- | :--- |
| `subscription` | `id`, `name`, `price` (**total**, `numeric(10,2)`, `CHECK > 0`), `interval_count` (`CHECK >= 1`), `interval_unit` (`DAY`/`WEEK`/`MONTH`/`YEAR`), `anchor_date`, `shared_with` (`CHECK >= 1`, def. 1), `category_id` (opc.), `payment_method_id` (opc.), `notes`, `active`, `created_at`, `updated_at` |
| `category` | `id`, `name` (único) |
| `payment_method` | `id`, `name` (único) |

- Las FK de `subscription` a `category` y `payment_method` son `ON DELETE SET NULL`.
- La primera migración crea categorías de ejemplo: Streaming, Música, Software, Gaming, Otros. Métodos de pago: ninguno.

## 4. Lógica de negocio

Dos componentes puros, sin dependencias de Spring ni de la BD; reciben "hoy" como parámetro (en Spring sale de un `Clock` inyectable).

### Próximo cobro (`NextChargeCalculator`)

- `anchor_date` es una fecha de cobro conocida (pasada o futura).
- Próximo cobro = la primera fecha `anchor + k × intervalo` (k ≥ 0 entero) que sea ≥ hoy. Si el ancla es futura, es el ancla.
- Se calcula siempre desde el ancla (no encadenando cobros), así que no hay deriva de fin de mes: si el ancla es el 31 y el intervalo mensual, en febrero es el 28 (o 29) y en marzo vuelve a ser el 31.
- No se guarda y no hay tarea programada.
- Una suscripción inactiva no tiene próximo cobro (`null`).

### Gasto (`CostCalculator`)

- `tu parte = price / shared_with`
- `cobros por año`: días → 365/N, semanas → 52/N, meses → 12/N, años → 1/N (N = `interval_count`)
- `anual = tu parte × cobros por año`
- `mensual = anual / 12`
- Todo en `BigDecimal` con precisión suficiente; se redondea a 2 decimales (`HALF_UP`) solo en la respuesta de la API. Los totales se suman antes de redondear.
- Las inactivas aparecen en la lista, pero no cuentan en totales, próximos cobros ni gasto por categoría.

## 5. API REST

Todo bajo `/api`, JSON en camelCase, fechas `YYYY-MM-DD`, importes redondeados a 2 decimales. Sin paginación.

### Sesión

| Método | Ruta | Respuesta |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Usuario y contraseña → 204 y cookie de sesión / 401 |
| `POST` | `/api/auth/logout` | 204 |
| `GET` | `/api/auth/me` | `{ "username": "..." }` / 401 |

- Sesión con cookie `HttpOnly`, `SameSite=Lax` (Spring Security).
- Sin sesión, cualquier otra ruta de `/api/**` devuelve **401** (sin redirección).
- **CSRF:** `CookieCsrfTokenRepository` → cookie `XSRF-TOKEN` legible por JS; el frontend la envía en la cabecera `X-XSRF-TOKEN` en todo `POST`/`PUT`/`DELETE`, incluido el login.

### Suscripciones

| Método | Ruta | Respuesta |
| :--- | :--- | :--- |
| `GET` | `/api/subscriptions` | Lista completa, incluidas inactivas |
| `GET` | `/api/subscriptions/{id}` | Una |
| `POST` | `/api/subscriptions` | 201 + la creada |
| `PUT` | `/api/subscriptions/{id}` | Reemplazo completo (cancelar = `active: false`) |
| `DELETE` | `/api/subscriptions/{id}` | 204 |

Cuerpo de entrada: `name`, `price`, `intervalCount`, `intervalUnit`, `anchorDate`, `sharedWith`, `categoryId`, `paymentMethodId`, `notes`, `active`.

Salida: esos campos, con `category` y `paymentMethod` como `{ id, name }` o `null` (en lugar de los ids), más `createdAt`, `updatedAt` y los calculados `yourShare`, `monthlyCost`, `yearlyCost`, `nextChargeDate` (`null` si inactiva).

### Categorías y métodos de pago

`/api/categories` y `/api/payment-methods`, iguales:

| Método | Ruta | Respuesta |
| :--- | :--- | :--- |
| `GET` | `/api/categories` | Lista `{ id, name }`, ordenada por nombre |
| `POST` | `/api/categories` | 201 |
| `PUT` | `/api/categories/{id}` | Renombrar |
| `DELETE` | `/api/categories/{id}` | 204 (las suscripciones quedan sin categoría) |

### Panel

`GET /api/dashboard`:

```json
{
  "monthlyTotal": 42.17,
  "yearlyTotal": 506.04,
  "upcoming": [{ "id": 3, "name": "Spotify", "date": "2026-10-02", "yourShare": 5.99 }],
  "byCategory": [{ "categoryId": 1, "name": "Streaming", "monthly": 20.50 }]
}
```

- `upcoming`: cobros de suscripciones activas en los **próximos 30 días** (de hoy a hoy + 30, ambos incluidos), ordenados por fecha. Si una suscripción se cobra varias veces en ese plazo (p. ej. semanal), aparece una vez por cobro.
- `byCategory`: gasto mensual por categoría, de mayor a menor; las sin categoría van con `categoryId: null` (el frontend pone el nombre traducido).

## 6. Errores y validación

### Reglas (Bean Validation en los DTO de entrada)

| Campo | Regla |
| :--- | :--- |
| `name` (suscripción) | Obligatorio, 1–100 caracteres |
| `price` | Obligatorio, > 0, máx. 2 decimales, cabe en `numeric(10,2)` |
| `intervalCount` | Obligatorio, 1–1000 (el tope evita fechas fuera de rango → 500) |
| `intervalUnit` | Obligatorio |
| `anchorDate` | Obligatoria |
| `sharedWith` | Obligatorio, ≥ 1 |
| `notes` | Opcional, máx. 1000 caracteres |
| `categoryId` / `paymentMethodId` | Opcionales; si vienen, deben existir (si no → 400 en ese campo) |
| `active` | Obligatorio |
| `name` (categoría / método) | Obligatorio, 1–50 caracteres, único |

Las restricciones `CHECK` de la BD son el último seguro.

### Formato

Problem Details (RFC 9457, `ProblemDetail` de Spring) desde un único `@RestControllerAdvice`. Los errores de campo van en la extensión `errors` con **códigos**, no textos, para que el frontend los traduzca:

```json
{ "status": 400, "title": "Validation failed",
  "errors": [{ "field": "price", "code": "positive" }] }
```

| HTTP | Cuándo |
| :--- | :--- |
| 400 | Validación (con `errors`) o JSON mal formado |
| 401 | Sin sesión o login fallido |
| 403 | Token CSRF ausente o inválido |
| 404 | `id` inexistente |
| 409 | Nombre de categoría/método duplicado |
| 500 | Cualquier otro error: mensaje genérico; la traza solo va al log |

## 7. Frontend

- React Router para las rutas; TanStack Query para los datos (se invalidan las consultas afectadas al guardar).
- Cualquier 401 → pantalla de login.
- Barra superior: *Panel · Suscripciones · Ajustes*, selector de idioma ES/EN y botón de salir.
- Idioma: el del navegador la primera vez, luego se recuerda en `localStorage`. Todos los textos, incluidos los códigos de error, pasan por react-i18next. Importes con formato `Intl.NumberFormat` en EUR según el idioma.

| Ruta | Pantalla | Contenido |
| :--- | :--- | :--- |
| `/login` | Login | Usuario, contraseña, error si fallan, selector de idioma |
| `/` | Panel | Tarjetas de gasto mensual y anual · próximos cobros (fecha, nombre, tu parte) · gasto por categoría como lista con barra proporcional en CSS (sin librería de gráficos) |
| `/subscriptions` | Lista | Nombre, categoría, tu parte (+ "total X € ÷ N" si es compartida), periodicidad ("cada 2 meses"), próximo cobro, estado. Inactivas al final en gris. Botón *Nueva* |
| `/subscriptions/new`, `/subscriptions/:id` | Formulario | Página propia (no modal) con todos los campos; categoría y método en desplegables. Al editar: interruptor activa/cancelada y *Borrar* con confirmación. Si el `id` no existe: mensaje + enlace a la lista |
| `/settings` | Ajustes | Categorías y métodos de pago: añadir, renombrar y borrar desde la fila; al borrar, confirmación avisando de que las suscripciones quedarán sin categoría/método |

- Listas vacías: mensaje con enlace para crear el primer elemento.
- Validación en el navegador solo con atributos HTML (`required`, `min`, `maxLength`); el servidor manda y cada `errors[].code` se muestra traducido bajo su campo.
- Errores generales (500, sin red, 403 de CSRF): toast (Sonner) con mensaje traducido y opción de reintentar o recargar.

## 8. Tests

### Backend

- **Unitarios** (JUnit 5 + AssertJ, con TDD):
  - `NextChargeCalculator`: ancla pasada, futura y hoy; las cuatro unidades con N > 1; fin de mes (31 → 28/29 feb → 31 mar); 29 de febrero con periodicidad anual; inactiva → `null`.
  - `CostCalculator`: división entre N; cobros por año de cada unidad; redondeo solo al final.
- **Integración** (`@SpringBootTest` + MockMvc + Testcontainers con Postgres real y migraciones de Flyway):
  - CRUD de suscripciones, categorías y métodos.
  - Formato de 400 (con `errors`), 404 y 409.
  - Login correcto e incorrecto, 401 sin sesión, 403 sin CSRF.
  - Borrar una categoría en uso → suscripciones con `category: null`.
  - Panel (totales, próximos cobros, por categoría) con un `Clock` fijo.

### Frontend

Vitest + React Testing Library + MSW:

- Login correcto y fallido.
- Un 401 lleva al login.
- El formulario muestra los `errors[].code` traducidos bajo cada campo.
- El panel pinta totales, próximos cobros y categorías.

### CI

GitHub Actions en cada push y PR: tests del backend (Maven, Testcontainers) y del frontend (lint, Vitest, build). Badge en el README.

## 9. Entregables de v1

- [ ] Login con la cuenta única
- [ ] CRUD de suscripciones, categorías y métodos de pago
- [ ] Panel: gasto mensual/anual, próximos cobros, gasto por categoría
- [ ] Cálculo automático del próximo cobro
- [ ] Interfaz ES/EN
- [ ] Dockerfile multi-stage + `docker-compose.yml`
- [ ] Tests + CI en GitHub Actions
- [ ] README en inglés y español, con capturas e instrucciones de despliegue
