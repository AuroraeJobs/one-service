package com.one.record.web;

import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.record.model.LotteryAstronaut;
import com.one.record.response.LotteryAstronautVoyage;
import com.one.record.response.LotteryAstronautVoyageStat;
import com.one.record.service.ILotteryAstronautService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("lottery/astronauts")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotteryAstronautController {

    private final ILotteryAstronautService service;

    @GetMapping
    @Operation(summary = "查询星际穿越宇航员", description = "查询所有彩票宇航员名称映射")
    public List<LotteryAstronaut> findAll() {
        return service.findAll();
    }

    @GetMapping("voyage-counts")
    @Operation(summary = "查询宇航员出行次数", description = "从 Redis 查询两个舰队每个宇航员的出行次数统计")
    public List<LotteryAstronautVoyageStat> getVoyageStats() {
        return service.getVoyageStats();
    }

    @PostMapping("voyage-counts/statistics")
    @Operation(summary = "统计宇航员出行次数", description = "统计两个舰队每个宇航员的出行次数并保存到 Redis")
    public List<LotteryAstronautVoyageStat> calculateVoyageStats() {
        return service.calculateVoyageStats();
    }

    @GetMapping("{camp}")
    @Operation(summary = "按阵营查询宇航员", description = "按 RED 或 BLUE 查询宇航员名称映射")
    public List<LotteryAstronaut> findByCamp(@PathVariable String camp) {
        return service.findByCamp(camp);
    }

    @GetMapping("{camp}/{number}/voyage")
    @Operation(summary = "查询宇航员航行记录", description = "按阵营和编号查询宇航员历史命中记录与统计")
    public LotteryAstronautVoyage voyage(@PathVariable String camp, @PathVariable String number) {
        return service.voyage(camp, number);
    }

    @PutMapping
    @Operation(summary = "更新宇航员", description = "按阵营和编号更新宇航员名称")
    public LotteryAstronaut update(@RequestBody LotteryAstronaut astronaut) {
        log.info("Updating lottery astronaut: {}", astronaut);
        return service.save(astronaut);
    }

    @PostMapping("batch")
    @Operation(summary = "批量更新宇航员", description = "批量更新宇航员名称映射")
    public List<LotteryAstronaut> saveAll(@RequestBody List<LotteryAstronaut> astronauts) {
        log.info("Batch updating lottery astronauts: {}", astronauts.size());
        return service.saveAll(astronauts);
    }

    @PostMapping("reset")
    @Operation(summary = "重置默认宇航员", description = "恢复当前前端内置的默认名称映射")
    public List<LotteryAstronaut> resetDefaults() {
        return service.resetDefaults();
    }
}
