package org.aurorae.cwl.web;

import com.alibaba.dubbo.config.annotation.Reference;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.cwl.model.CwlGua;
import org.aurorae.cwl.service.CwlGuaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("gua")
@Slf4j
public class CwlGuaController {

    @Reference
    private CwlGuaService service;

    @GetMapping("{id}")
    private CwlGua findById(@PathVariable Long id) {
        return service.findById(id);
    }
}
