package org.aurorae.core.web;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.X2;
import org.aurorae.core.service.XiangService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;

/**
 * @author aurorae
 */
@RestController
@RequestMapping("xiang")
@Slf4j
public class XiangController {

    @Resource
    private XiangService service;

    @GetMapping
    private List<X2> get() {
        return service.findAll();
    }

    @PostMapping
    private List<X2> save(@RequestBody List<X2> items) {
        return service.save(items);
    }
}
