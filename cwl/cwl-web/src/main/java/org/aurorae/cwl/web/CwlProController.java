package org.aurorae.cwl.web;

import com.alibaba.dubbo.config.annotation.Reference;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.cwl.service.CwlProService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("pro")
@Slf4j
public class CwlProController {

    @Reference
    private CwlProService service;

    @GetMapping("{id}")
    private String pro(@PathVariable Long id) {
        return service.pro(id);
    }

    @GetMapping("circle")
    private void circle() {
        service.circle();
    }
}
