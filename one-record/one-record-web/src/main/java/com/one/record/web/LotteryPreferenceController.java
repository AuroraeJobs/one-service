package com.one.record.web;

import com.one.record.model.LotteryPreference;
import com.one.record.service.ILotteryPreferenceService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("lottery/preferences")
@AllArgsConstructor
public class LotteryPreferenceController {

    private final ILotteryPreferenceService service;

    @GetMapping
    @Operation(summary = "查询彩票偏好设置", description = "返回默认用户的彩票训练和票据偏好")
    public LotteryPreference preference() {
        return service.preference();
    }

    @PutMapping
    @Operation(summary = "更新彩票偏好设置", description = "更新默认用户的彩票训练和票据偏好")
    public LotteryPreference updatePreference(@RequestBody LotteryPreference preference) {
        return service.updatePreference(preference);
    }
}
