package com.one.record.wechat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WechatRenderedArticle {

    private String title;

    private String author;

    private String digest;

    private String content;

    private String contentSourceUrl;

    private String thumbMediaId;

    private Integer needOpenComment;

    private Integer onlyFansCanComment;

    private Integer showCoverPic;
}
