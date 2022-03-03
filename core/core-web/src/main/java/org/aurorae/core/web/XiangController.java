package org.aurorae.core.web;

import com.alibaba.dubbo.config.annotation.Reference;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.Xiang;
import org.aurorae.core.model.Yi;
import org.aurorae.core.service.XiangService;
import org.aurorae.core.service.YiService;
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
    private List<Xiang> get() {
        return service.findAll();
    }

    @PostMapping
    private List<Xiang> save(@RequestBody List<Xiang> items) {
        return service.save(items);
    }
}
