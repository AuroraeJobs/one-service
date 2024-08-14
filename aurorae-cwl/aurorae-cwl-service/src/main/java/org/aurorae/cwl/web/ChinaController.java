package org.aurorae.cwl.web;

import org.aurorae.cwl.model.China;
import org.aurorae.cwl.service.IChinaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

@RestController
@RequestMapping("china")
public class ChinaController {

    @Resource
    private IChinaService chinaService;

    @GetMapping("{year}")
    public China year(@PathVariable String year) {
        return chinaService.year(year);
    }
}
