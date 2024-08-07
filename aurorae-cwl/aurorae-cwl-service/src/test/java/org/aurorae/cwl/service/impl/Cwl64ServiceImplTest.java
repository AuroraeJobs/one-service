package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.service.Cwl64Service;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class Cwl64ServiceImplTest {

    @Autowired
    private Cwl64Service cwl64Service;

    @Test
    public void label64() {
        cwl64Service.label64();
    }
}