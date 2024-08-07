package org.aurorae.core.service.impl;

import org.aurorae.core.service.YiService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class YiServiceImplTest {
  @Autowired private YiService yiService;

  @Test
  void findAll() {
    yiService.findAll().forEach(yi -> System.out.println(yi.getCode()));
  }
}
