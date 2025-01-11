package org.aurorae.cwl.web;

import javax.annotation.Resource;

import org.aurorae.cwl.service.IBoxService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("box")
public class BoxController {

    @Resource
    private IBoxService boxService;
}
