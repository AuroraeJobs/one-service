package org.aurorae.cwl.web;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.cwl.service.CwlValueService;
import org.aurorae.cwl.vo.CwlCreaseV;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("value")
@Slf4j
public class CwlValueController {

    private CwlValueService service;

    @GetMapping("/compare/sum")
    private String compareSum() {
        service.compareSum();
        return "success";
    }

    @GetMapping("/compare/red0/{v}")
    private CwlCreaseV compareRed0(@PathVariable int v) {
        return service.compareRed0IsNot(v);
    }
}
