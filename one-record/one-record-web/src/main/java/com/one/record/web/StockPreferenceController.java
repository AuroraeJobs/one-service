package com.one.record.web;

import com.one.record.service.IStockPreferenceService;
import com.one.record.stock.StockPreference;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("stock")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class StockPreferenceController {

    private final IStockPreferenceService service;

    @GetMapping("preferences")
    @Operation(summary = "查询股票偏好设置", description = "查询当前用户的股票模块偏好设置")
    public StockPreference get() {
        return service.get();
    }

    @PutMapping("preferences")
    @Operation(summary = "保存股票偏好设置", description = "保存当前用户的股票模块偏好设置")
    public StockPreference save(@RequestBody StockPreference preference) {
        log.info("Saving stock preference: {}", preference);
        return service.save(preference);
    }
}
