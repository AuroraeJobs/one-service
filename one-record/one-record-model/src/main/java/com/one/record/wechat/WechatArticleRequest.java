package com.one.record.wechat;

import lombok.Data;

@Data
public class WechatArticleRequest {

    private String markdown;

    private String postPath;

    private String title;

    private String author;

    private String thumbMediaId;

    private String coverPath;

    private String contentSourceUrl;

    private Integer needOpenComment;

    private Integer onlyFansCanComment;

    private Integer showCoverPic;

    private Boolean uploadImages = true;

    private Boolean publishAfterDraft = false;
}
