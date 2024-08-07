package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.service.CwlUpdateService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CwlUpdateServiceImplTest {

    @Autowired
    private CwlUpdateService service;

    @Test
    public void update() {
        service.update();
    }
}