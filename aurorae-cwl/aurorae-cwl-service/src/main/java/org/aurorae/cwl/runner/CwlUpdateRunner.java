package org.aurorae.cwl.runner;

import org.aurorae.cwl.service.CwlUpdateService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Component
public class CwlUpdateRunner implements CommandLineRunner {

    @Resource
    private CwlUpdateService updateService;

    @Override
    public void run(String... args) {
        updateService.update();
    }
}
