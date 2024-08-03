package org.aurorae.core.web;

import com.alibaba.dubbo.config.annotation.Reference;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.X1;
import org.aurorae.core.service.YiService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author aurorae
 */
@RestController
@RequestMapping("yi")
@Slf4j
public class YiController {

    @Reference
    private YiService service;

    @GetMapping
    private List<X1> get() {
        return service.findAll();
    }

    @PostMapping
    private List<X1> save(@RequestBody List<X1> items) {
        return service.save(items);
    }
}
