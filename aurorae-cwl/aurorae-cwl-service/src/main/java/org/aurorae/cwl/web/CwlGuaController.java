package org.aurorae.cwl.web;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.cwl.model.CwlGua;
import org.aurorae.cwl.service.CwlGuaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

@RestController
@RequestMapping("gua")
@Slf4j
public class CwlGuaController {

    @Resource
    private CwlGuaService service;

    @GetMapping("{id}")
    private CwlGua findById(@PathVariable Long id) {
        return service.findById(id);
    }
}
