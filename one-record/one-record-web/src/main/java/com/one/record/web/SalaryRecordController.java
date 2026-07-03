package com.one.record.web;

import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.record.model.SalaryRecord;
import com.one.record.service.ISalaryRecordService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("salary-record")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class SalaryRecordController {
    
    private final ISalaryRecordService service;
    
    @PostMapping
    @Operation(summary = "添加工资记录", description = "添加一条新的工资记录")
    public SalaryRecord save(@RequestBody SalaryRecord record) {
        log.info("Saving salary record: {}", record);
        return service.save(record);
    }
    
    @PutMapping
    @Operation(summary = "更新工资记录", description = "更新一条工资记录")
    public SalaryRecord update(@RequestBody SalaryRecord record) {
        log.info("Updating salary record: {}", record);
        return service.save(record);
    }
    
    @DeleteMapping("{id}")
    @Operation(summary = "删除工资记录", description = "根据ID删除工资记录")
    public void delete(@PathVariable("id") String id) {
        log.info("Deleting salary record with id: {}", id);
        service.delete(id);
    }
    
    @GetMapping("{id}")
    @Operation(summary = "查询工资记录", description = "根据ID查询工资记录")
    public SalaryRecord findById(@PathVariable("id") String id) {
        return service.findById(id);
    }
    
    @GetMapping
    @Operation(summary = "查询所有工资记录", description = "查询所有工资记录，按月份倒序")
    public List<SalaryRecord> findAll() {
        return service.findAll();
    }
    
    @GetMapping("month")
    @Operation(summary = "按月份查询", description = "查询指定月份的工资记录")
    public SalaryRecord findByMonth(@RequestParam("month") String month) {
        return service.findByMonth(month);
    }
    
    @GetMapping("month-range")
    @Operation(summary = "按月份范围查询", description = "查询指定月份范围内的工资记录")
    public List<SalaryRecord> findByMonthRange(
            @RequestParam("startMonth") String startMonth,
            @RequestParam("endMonth") String endMonth) {
        return service.findByMonthRange(startMonth, endMonth);
    }
    
    @GetMapping("statistics")
    @Operation(summary = "获取统计数据", description = "获取工资记录的统计数据")
    public Map<String, Object> getStatistics() {
        return service.getStatistics();
    }
}
