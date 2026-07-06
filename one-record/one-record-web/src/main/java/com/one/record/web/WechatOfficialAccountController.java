package com.one.record.web;

import com.one.record.service.IWechatOfficialAccountService;
import com.one.record.wechat.WechatArticleRequest;
import com.one.record.wechat.WechatArticleListRequest;
import com.one.record.wechat.WechatDraftResult;
import com.one.record.wechat.WechatRenderedArticle;
import com.one.record.wechat.WechatTokenStatus;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("wechat/official-account")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class WechatOfficialAccountController {

    private final IWechatOfficialAccountService service;

    @PostMapping("render")
    @Operation(summary = "渲染微信公众号文章", description = "按 Markdown 和 Front Matter 渲染微信公众号图文草稿内容，不调用微信 API")
    public WechatRenderedArticle render(@RequestBody WechatArticleRequest request) {
        return service.render(request);
    }

    @PostMapping("drafts")
    @Operation(summary = "创建微信公众号草稿", description = "渲染 Markdown，上传正文本地图片，并调用微信公众号草稿接口")
    public WechatDraftResult createDraft(@RequestBody WechatArticleRequest request) {
        log.info("Creating WeChat official account draft: postPath={}", request == null ? null : request.getPostPath());
        return service.createDraft(request);
    }

    @PostMapping("drafts/list")
    @Operation(summary = "查询微信公众号草稿列表", description = "调用微信公众号草稿箱批量获取接口，返回草稿列表")
    public Map<String, Object> listDrafts(@RequestBody(required = false) WechatArticleListRequest request) {
        return service.listDrafts(request);
    }

    @PostMapping("publications/list")
    @Operation(summary = "查询微信公众号已发布列表", description = "调用微信公众号发布记录批量获取接口，返回已发布图文列表")
    public Map<String, Object> listPublishedArticles(@RequestBody(required = false) WechatArticleListRequest request) {
        return service.listPublishedArticles(request);
    }

    @PostMapping("publish")
    @Operation(summary = "提交微信公众号发布", description = "按草稿 media_id 调用微信公众号发布接口")
    public Map<String, Object> submitPublish(@RequestParam("mediaId") String mediaId) {
        return service.submitPublish(mediaId);
    }

    @PostMapping("token/refresh")
    @Operation(summary = "刷新微信公众号 access_token", description = "调用 stable_token 并缓存 access_token")
    public String refreshAccessToken() {
        return service.refreshAccessToken();
    }

    @GetMapping("token/status")
    @Operation(summary = "查询微信公众号 token 状态", description = "返回配置和缓存状态，不返回敏感 token")
    public WechatTokenStatus tokenStatus() {
        return service.tokenStatus();
    }
}
