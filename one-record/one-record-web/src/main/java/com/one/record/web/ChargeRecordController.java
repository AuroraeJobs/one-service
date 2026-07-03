package com.one.record.web;

import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.record.dto.ChargeProviderDTO;
import com.one.record.enums.ChargeProvider;
import com.one.record.model.ChargeRecord;
import com.one.record.service.IChargeRecordService;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("charge-record")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class ChargeRecordController {
    
    private final IChargeRecordService service;
    
    @PostMapping
    @Operation(summary = "添加充电记录", description = "添加一条新的充电记录")
    public ChargeRecord save(@RequestBody ChargeRecord record) {
        log.info("Saving charge record: {}", record);
        return service.save(record);
    }
    
    @PutMapping
    @Operation(summary = "更新充电记录", description = "更新一条充电记录")
    public ChargeRecord update(@RequestBody ChargeRecord record) {
        log.info("Updating charge record: {}", record);
        return service.save(record);
    }
    
    @DeleteMapping("{id}")
    @Operation(summary = "删除充电记录", description = "根据ID删除充电记录")
    public void delete(@PathVariable("id") String id) {
        log.info("Deleting charge record with id: {}", id);
        service.delete(id);
    }
    
    @GetMapping("{id}")
    @Operation(summary = "查询充电记录", description = "根据ID查询充电记录")
    public ChargeRecord findById(@PathVariable("id") String id) {
        return service.findById(id);
    }
    
    @GetMapping
    @Operation(summary = "查询所有充电记录", description = "查询所有充电记录，按创建时间倒序")
    public List<ChargeRecord> findAll() {
        return service.findAll();
    }
    
    @GetMapping("date-range")
    @Operation(summary = "按日期范围查询", description = "查询指定日期范围内的充电记录")
    public List<ChargeRecord> findByDateRange(
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {
        return service.findByDateRange(startDate, endDate);
    }
    
    @GetMapping("charger-type")
    @Operation(summary = "按充电方式查询", description = "查询指定充电方式的充电记录")
    public List<ChargeRecord> findByChargerType(@RequestParam("chargerType") String chargerType) {
        return service.findByChargerType(chargerType);
    }
    
    @GetMapping("location")
    @Operation(summary = "按地点查询", description = "查询指定地点的充电记录")
    public List<ChargeRecord> findByLocation(@RequestParam("location") String location) {
        return service.findByLocation(location);
    }
    
    @GetMapping("statistics")
    @Operation(summary = "获取统计数据", description = "获取充电记录的统计数据")
    public Map<String, Object> getStatistics() {
        return service.getStatistics();
    }
    
    @GetMapping("providers")
    @Operation(summary = "获取充电提供方列表", description = "获取所有可选的充电提供方枚举")
    public List<ChargeProviderDTO> getProviders() {
        return Arrays.stream(ChargeProvider.values())
                .map(provider -> ChargeProviderDTO.builder()
                        .label(provider.getName())
                        .value(provider.name())
                        .build())
                .collect(Collectors.toList());
    }
}
