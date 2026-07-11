import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Space, Switch, Tag, message } from 'antd';
import { CloudUploadOutlined, EyeOutlined, FileSearchOutlined, ReloadOutlined, SendOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import {
  wechatOfficialAccountApi,
  type WechatArticleRequest,
  type WechatRenderedArticle,
  type WechatTokenStatus
} from '../services/api';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import './WechatOfficialAccountPage.css';

const { TextArea } = Input;

const defaultMarkdownZh = `---
title: "OneAI Daily"
author: "OneAI"
digest: "今天值得关注的 AI 与招聘动态。"
cover_media_id: ""
show_cover_pic: 0
---

# OneAI Daily

## 今日关注

- AI 产品进入更重视可靠性和成本的阶段。
- 企业招聘继续围绕自动化、合规和效率展开。

## 发布备注

这里的内部备注不会进入公众号正文。`;

const defaultMarkdownEn = `---
title: "OneAI Daily"
author: "OneAI"
digest: "AI and hiring updates worth watching today."
cover_media_id: ""
show_cover_pic: 0
---

# OneAI Daily

## Today's Focus

- AI products are entering a phase that cares more about reliability and cost.
- Enterprise hiring continues to revolve around automation, compliance, and efficiency.

## Publishing Notes

These internal notes will not be included in the WeChat article body.`;

const WechatOfficialAccountPage = () => {
  const { isEnglish } = useAppPreferences();
  const text = {
    title: isEnglish ? 'Official Account Draft' : '公众号草稿',
    waitingRender: isEnglish ? 'Waiting for render' : '等待渲染',
    configured: isEnglish ? 'Configured' : '已配置',
    notConfigured: isEnglish ? 'Not configured' : '未配置',
    tokenCached: isEnglish ? 'Token cached' : 'Token 已缓存',
    tokenNotCached: isEnglish ? 'Token not cached' : 'Token 未缓存',
    refreshToken: isEnglish ? 'Refresh Token' : '刷新 Token',
    imageUpload: isEnglish ? 'Images' : '图片',
    publish: isEnglish ? 'Publish' : '发布',
    postPathPlaceholder: isEnglish
      ? 'Article path, for example /path/to/oneai-daily-wechat/content/daily/2026-07-06-daily-briefing.md'
      : '文章路径，例如 /path/to/oneai-daily-wechat/content/daily/2026-07-06-daily-briefing.md',
    coverPathPlaceholder: isEnglish
      ? 'Cover image path, for example /path/to/oneai-daily-wechat/assets/brand/oneai-daily-cover.png'
      : '封面图片路径，例如 /path/to/oneai-daily-wechat/assets/brand/oneai-daily-cover.png',
    render: isEnglish ? 'Render' : '渲染',
    createDraft: isEnglish ? 'Create Draft' : '创建草稿',
    preview: isEnglish ? 'Preview' : '预览',
    rendered: isEnglish ? 'Rendered' : '已渲染',
    renderFailed: isEnglish ? 'Render failed' : '渲染失败',
    publishSubmitted: isEnglish ? 'Publish submitted' : '已提交发布',
    draftCreated: isEnglish ? 'Draft created' : '草稿已创建',
    createDraftFailed: isEnglish ? 'Failed to create draft' : '创建草稿失败',
    missingMediaId: isEnglish ? 'Missing media_id' : '缺少 media_id',
    submitPublishFailed: isEnglish ? 'Failed to submit publish' : '提交发布失败',
    tokenRefreshed: isEnglish ? 'Token refreshed' : 'Token 已刷新',
    tokenRefreshFailed: isEnglish ? 'Token refresh failed' : 'Token 刷新失败'
  };
  const [markdown, setMarkdown] = useState(() => (isEnglish ? defaultMarkdownEn : defaultMarkdownZh));
  const [postPath, setPostPath] = useState('');
  const [coverPath, setCoverPath] = useState('');
  const [mediaId, setMediaId] = useState('');
  const [uploadImages, setUploadImages] = useState(true);
  const [publishAfterDraft, setPublishAfterDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<WechatRenderedArticle>();
  const [tokenStatus, setTokenStatus] = useState<WechatTokenStatus>();

  const previewHtml = useMemo(() => {
    if (!article?.content) {
      return `<body style="margin:0;background:#141414;"><section style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#9ca3af;padding:36px 40px;font-size:16px;font-weight:600;">${text.waitingRender}</section></body>`;
    }
    return `<body style="margin:0;background:#141414;padding:24px;"><main style="max-width:760px;min-height:520px;margin:0 auto;background:#fff;padding:28px 34px;box-sizing:border-box;">${article.content}</main></body>`;
  }, [article?.content, text.waitingRender]);

  const loadTokenStatus = async () => {
    try {
      setTokenStatus(await wechatOfficialAccountApi.tokenStatus());
    } catch (error) {
      console.error('token status failed', error);
    }
  };

  useEffect(() => {
    loadTokenStatus();
  }, []);

  const buildArticleRequest = (forDraft = false): WechatArticleRequest => {
    const normalizedPostPath = postPath.trim();
    const normalizedCoverPath = coverPath.trim();
    const request: WechatArticleRequest = {
      markdown: normalizedPostPath ? undefined : markdown,
      postPath: normalizedPostPath || undefined,
      uploadImages: forDraft ? uploadImages : false,
      publishAfterDraft: forDraft ? publishAfterDraft : false
    };
    if (normalizedCoverPath) {
      request.coverPath = normalizedCoverPath;
    }
    return request;
  };

  const renderArticle = async () => {
    setLoading(true);
    try {
      const result = await wechatOfficialAccountApi.render(buildArticleRequest(false));
      setArticle(result);
      message.success(text.rendered);
    } catch (error) {
      message.error(error instanceof Error ? error.message : text.renderFailed);
    } finally {
      setLoading(false);
    }
  };

  const createDraft = async () => {
    setLoading(true);
    try {
      const result = await wechatOfficialAccountApi.createDraft(buildArticleRequest(true));
      setArticle(result.article);
      setMediaId(result.mediaId || '');
      message.success(result.publishSubmitted ? text.publishSubmitted : text.draftCreated);
      loadTokenStatus();
    } catch (error) {
      message.error(error instanceof Error ? error.message : text.createDraftFailed);
    } finally {
      setLoading(false);
    }
  };

  const submitPublish = async () => {
    if (!mediaId.trim()) {
      message.warning(text.missingMediaId);
      return;
    }
    setLoading(true);
    try {
      await wechatOfficialAccountApi.submitPublish(mediaId.trim());
      message.success(text.publishSubmitted);
    } catch (error) {
      message.error(error instanceof Error ? error.message : text.submitPublishFailed);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    setLoading(true);
    try {
      await wechatOfficialAccountApi.refreshAccessToken();
      await loadTokenStatus();
      message.success(text.tokenRefreshed);
    } catch (error) {
      message.error(error instanceof Error ? error.message : text.tokenRefreshFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LifePageShell
      eyebrow="OneAI Daily"
      title={text.title}
      actions={(
        <Space wrap>
          <Tag color={tokenStatus?.configured ? 'green' : 'orange'}>
            {tokenStatus?.configured ? text.configured : text.notConfigured}
          </Tag>
          <Tag color={tokenStatus?.cached ? 'blue' : 'default'}>
            {tokenStatus?.cached ? text.tokenCached : text.tokenNotCached}
          </Tag>
          <Button icon={<ReloadOutlined />} onClick={refreshToken} loading={loading}>
            {text.refreshToken}
          </Button>
        </Space>
      )}
    >
      <div className="wechat-official-account-grid">
        <section className="wechat-official-account-panel">
          <div className="wechat-official-account-panel-header">
            <strong>Markdown</strong>
            <Space>
              <Switch checked={uploadImages} onChange={setUploadImages} checkedChildren={text.imageUpload} unCheckedChildren={text.imageUpload} />
              <Switch checked={publishAfterDraft} onChange={setPublishAfterDraft} checkedChildren={text.publish} unCheckedChildren={text.publish} />
            </Space>
          </div>
          <TextArea
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            autoSize={false}
            className="wechat-official-account-editor"
          />
          <div className="wechat-official-account-script-panel">
            <Input
              value={postPath}
              onChange={(event) => setPostPath(event.target.value)}
              prefix={<FileSearchOutlined />}
              placeholder={text.postPathPlaceholder}
            />
            <Input
              value={coverPath}
              onChange={(event) => setCoverPath(event.target.value)}
              prefix={<CloudUploadOutlined />}
              placeholder={text.coverPathPlaceholder}
            />
          </div>
          <div className="wechat-official-account-toolbar">
            <Space>
              <Button type="primary" icon={<EyeOutlined />} onClick={renderArticle} loading={loading}>
                {text.render}
              </Button>
              <Button icon={<CloudUploadOutlined />} onClick={createDraft} loading={loading}>
                {text.createDraft}
              </Button>
            </Space>
            <Input.Search
              value={mediaId}
              onChange={(event) => setMediaId(event.target.value)}
              onSearch={submitPublish}
              enterButton={<SendOutlined />}
              placeholder="media_id"
              className="wechat-official-account-media-input"
            />
          </div>
        </section>

        <section className="wechat-official-account-panel">
          <div className="wechat-official-account-panel-header">
            <strong>{article?.title || text.preview}</strong>
            {article?.digest && <Tag>{article.digest}</Tag>}
          </div>
          <iframe
            title="wechat-preview"
            srcDoc={previewHtml}
            className="wechat-official-account-preview"
          />
        </section>
      </div>
    </LifePageShell>
  );
};

export default WechatOfficialAccountPage;
