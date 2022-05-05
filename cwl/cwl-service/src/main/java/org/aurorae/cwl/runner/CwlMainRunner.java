package org.aurorae.cwl.runner;

import org.aurorae.cwl.service.CwlGuaService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Component
public class CwlMainRunner implements CommandLineRunner {

    @Resource
    private CwlGuaService service;

    @Override
    public void run(String... args) {
        //service.compute();
    }
}
