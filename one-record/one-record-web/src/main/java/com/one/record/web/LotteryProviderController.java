package com.one.record.web;

import com.one.record.lottery.LotteryProviderConfig;
import com.one.record.lottery.LotteryProviderHealth;
import com.one.record.service.ILotteryProviderService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("lottery/providers")
@AllArgsConstructor
public class LotteryProviderController {

    private final ILotteryProviderService service;

    @GetMapping("health")
    @Operation(summary = "查询彩票 Provider 健康状态", description = "返回已注册的彩票开奖数据 provider 及其激活状态")
    public List<LotteryProviderHealth> health() {
        return service.health();
    }

    @GetMapping("config")
    @Operation(summary = "查询彩票 Provider 配置快照", description = "返回当前彩票 provider 与同步相关配置")
    public LotteryProviderConfig config() {
        return service.config();
    }
}
