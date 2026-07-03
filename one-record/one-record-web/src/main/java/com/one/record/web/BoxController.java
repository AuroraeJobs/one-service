package com.one.record.web;

import lombok.AllArgsConstructor;
import com.one.record.ball.ColorBox;
import com.one.record.service.IBoxService;
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
    public ColorBox findById(@RequestParam("code") String code) {
        return service.findById(code);
    }
}
