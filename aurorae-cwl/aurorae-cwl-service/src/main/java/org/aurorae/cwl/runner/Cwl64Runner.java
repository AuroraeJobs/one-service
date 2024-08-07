package org.aurorae.cwl.runner;

import org.aurorae.cwl.service.Cwl64Service;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Component
public class Cwl64Runner implements CommandLineRunner {

    @Resource
    private Cwl64Service service;

    @Override
    public void run(String... args) {
        //service.label64();
    }
}
