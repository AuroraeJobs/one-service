package org.aurorae.cwl.web;

import com.alibaba.dubbo.config.annotation.Reference;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.cwl.service.CwlUpdateService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("update")
@Slf4j
public class CwlUpdateController {

    @Reference
    private CwlUpdateService service;

    @GetMapping()
    private void update() {
        service.update();
    }
}
