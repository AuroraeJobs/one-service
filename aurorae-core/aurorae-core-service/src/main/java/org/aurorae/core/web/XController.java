package org.aurorae.core.web;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.XX;
import org.aurorae.core.service.IXService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author aurorae
 */
@RestController
@RequestMapping("x")
@Slf4j
@AllArgsConstructor
public class XController {

    private final IXService service;

    @GetMapping
    private List<XX> get() {
        return service.findAll();
    }

    @PostMapping
    private List<XX> save(@RequestBody List<XX> items) {
        return service.save(items);
    }
}
