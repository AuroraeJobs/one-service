package com.one.record.service;

import com.one.record.wechat.WechatArticleRequest;
import com.one.record.wechat.WechatArticleListRequest;
import com.one.record.wechat.WechatDraftResult;
import com.one.record.wechat.WechatRenderedArticle;
import com.one.record.wechat.WechatTokenStatus;

import java.util.Map;

public interface IWechatOfficialAccountService {

    WechatRenderedArticle render(WechatArticleRequest request);

    WechatDraftResult createDraft(WechatArticleRequest request);

    Map<String, Object> listDrafts(WechatArticleListRequest request);

    Map<String, Object> listPublishedArticles(WechatArticleListRequest request);

    Map<String, Object> submitPublish(String mediaId);

    String refreshAccessToken();

    WechatTokenStatus tokenStatus();
}
