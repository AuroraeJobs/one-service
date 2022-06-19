package org.aurorae.cwl.runner;

import org.aurorae.cwl.service.CwlProService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Component
public class CwlProRunner implements CommandLineRunner {

    @Resource
    private CwlProService service;

    @Override
    public void run(String... args) {
        // service.excel();
    }
}
