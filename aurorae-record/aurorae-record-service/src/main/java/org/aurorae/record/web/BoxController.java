package org.aurorae.record.web;

import lombok.AllArgsConstructor;
import org.aurorae.record.ball.ColorBox;
import org.aurorae.record.service.IBoxService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("box")
@AllArgsConstructor
public class BoxController {

    private final IBoxService service;

    @GetMapping("findById")
    public ColorBox findById(@RequestParam String code) {
        return service.findById(code);
    }
}
