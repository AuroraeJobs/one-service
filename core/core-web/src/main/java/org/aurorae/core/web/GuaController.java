package org.aurorae.core.web;

import com.alibaba.dubbo.config.annotation.Reference;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.Gua;
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
    private List<Gua> get() {
        return service.findAll();
    }

    @PostMapping
    private List<Gua> save(@RequestBody List<Gua> items) {
        return service.save(items);
    }
}
