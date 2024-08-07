package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.service.CwlRed0Service;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CwlRed0ServiceImplTest {

  @Autowired
  private CwlRed0Service service;
    @Test
    void findById() {
    System.out.println(service.findById(2022001L).getMap());
    }
}