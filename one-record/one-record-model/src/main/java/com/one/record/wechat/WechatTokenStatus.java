package com.one.record.wechat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WechatTokenStatus {

    private Boolean configured;

    private Boolean cached;

    private Long expiresAt;

    private Long updatedAt;
}
