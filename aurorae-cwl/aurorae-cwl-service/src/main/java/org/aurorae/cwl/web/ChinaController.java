package org.aurorae.cwl.web;

import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.model.Province;
import org.aurorae.cwl.service.IChinaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.Map;

@RestController
@RequestMapping("china")
public class ChinaController {

    @Resource
    private IChinaService chinaService;

    @GetMapping("/{color}/year/{year}")
    public Map<String, Long> color(@PathVariable String color, @PathVariable String year) {
        return StreamUtil.toMap(chinaService.color(color, year), Province::getName, Province::getCount);
    }
}
