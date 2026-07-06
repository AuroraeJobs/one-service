package com.one.record.wechat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WechatDraftResult {

    private Boolean dryRun;

    private String mediaId;

    private Boolean publishSubmitted;

    private Map<String, Object> publishResponse;

    private WechatRenderedArticle article;
}
