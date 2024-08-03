package org.aurorae.core.web;

import com.alibaba.dubbo.config.annotation.Reference;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.X2;
import org.aurorae.core.service.XiangService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author aurorae
 */
@RestController
@RequestMapping("xiang")
@Slf4j
public class XiangController {

    @Reference
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
