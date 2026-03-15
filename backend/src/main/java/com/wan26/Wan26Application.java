package com.wan26;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class Wan26Application {
    public static void main(String[] args) {
        SpringApplication.run(Wan26Application.class, args);
    }
}
