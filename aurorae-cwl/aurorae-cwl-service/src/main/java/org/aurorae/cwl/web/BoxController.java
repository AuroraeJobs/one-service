package org.aurorae.cwl.web;

import org.aurorae.cwl.model.Box;
import org.aurorae.cwl.service.IBoxService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

@RestController
@RequestMapping("box")
public class BoxController {

    @Resource
    private IBoxService boxService;

    @GetMapping()
    public Box box() {
        return boxService.box();
    }
}
