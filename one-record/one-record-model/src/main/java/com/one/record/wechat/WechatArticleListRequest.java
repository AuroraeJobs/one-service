package com.one.record.wechat;

import lombok.Data;

@Data
public class WechatArticleListRequest {

    private Integer offset = 0;

    private Integer count = 10;

    private Integer noContent = 1;
}
