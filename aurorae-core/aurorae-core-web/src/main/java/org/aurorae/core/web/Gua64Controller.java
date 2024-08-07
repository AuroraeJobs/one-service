package org.aurorae.core.web;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.X6;
import org.aurorae.core.service.Gua64Service;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.Collections;
import java.util.List;

/**
 * @author aurorae
 */
@RestController
@RequestMapping("gua64")
@Slf4j
public class Gua64Controller {

    @Resource
    private Gua64Service service;

    @GetMapping
    private List<X6> get() {
        return service.findAll();
    }

    @PostMapping
    private List<X6> save(@RequestBody List<X6> items) {
        return service.save(items);
    }

    @PostMapping("save")
    private List<X6> save(@RequestBody X6 item) {
        return service.save(Collections.singletonList(item));
    }
}
