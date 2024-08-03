package org.aurorae.core.web;

import com.alibaba.dubbo.config.annotation.Reference;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.X3;
import org.aurorae.core.service.GuaService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author aurorae
 */
@RestController
@RequestMapping("gua")
@Slf4j
public class GuaController {

    @Reference
    private GuaService service;

    @GetMapping
    private List<X3> get() {
        return service.findAll();
    }

    @PostMapping
    private List<X3> save(@RequestBody List<X3> items) {
        return service.save(items);
    }
}
