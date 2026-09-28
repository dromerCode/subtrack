package dev.picha.subtrack;

import org.springframework.boot.SpringApplication;

public class TestSubtrackApplication {

	public static void main(String[] args) {
		SpringApplication.from(SubtrackApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
