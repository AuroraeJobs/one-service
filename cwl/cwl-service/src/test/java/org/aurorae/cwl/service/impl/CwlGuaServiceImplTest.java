package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.service.CwlGuaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class CwlGuaServiceImplTest {

    @Autowired
    private CwlGuaService service;

    @Test
    public void findById() {
        System.out.println(service.findById(2022001L));
    }

}