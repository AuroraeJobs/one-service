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
import './WechatOfficialAccountPage.css';

const { TextArea } = Input;

const defaultMarkdown = `---
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

const WechatOfficialAccountPage = () => {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
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
      return '<body style="margin:0;background:#141414;"><section style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#9ca3af;padding:36px 40px;font-size:16px;font-weight:600;">等待渲染</section></body>';
    }
    return `<body style="margin:0;background:#141414;padding:24px;"><main style="max-width:760px;min-height:520px;margin:0 auto;background:#fff;padding:28px 34px;box-sizing:border-box;">${article.content}</main></body>`;
  }, [article?.content]);

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
      message.success('已渲染');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '渲染失败');
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
      message.success(result.publishSubmitted ? '已提交发布' : '草稿已创建');
      loadTokenStatus();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建草稿失败');
    } finally {
      setLoading(false);
    }
  };

  const submitPublish = async () => {
    if (!mediaId.trim()) {
      message.warning('缺少 media_id');
      return;
    }
    setLoading(true);
    try {
      await wechatOfficialAccountApi.submitPublish(mediaId.trim());
      message.success('已提交发布');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '提交发布失败');
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    setLoading(true);
    try {
      await wechatOfficialAccountApi.refreshAccessToken();
      await loadTokenStatus();
      message.success('Token 已刷新');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Token 刷新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LifePageShell
      eyebrow="OneAI Daily"
      title="公众号草稿"
      actions={(
        <Space wrap>
          <Tag color={tokenStatus?.configured ? 'green' : 'orange'}>
            {tokenStatus?.configured ? '已配置' : '未配置'}
          </Tag>
          <Tag color={tokenStatus?.cached ? 'blue' : 'default'}>
            {tokenStatus?.cached ? 'Token 已缓存' : 'Token 未缓存'}
          </Tag>
          <Button icon={<ReloadOutlined />} onClick={refreshToken} loading={loading}>
            刷新 Token
          </Button>
        </Space>
      )}
    >
      <div className="wechat-official-account-grid">
        <section className="wechat-official-account-panel">
          <div className="wechat-official-account-panel-header">
            <strong>Markdown</strong>
            <Space>
              <Switch checked={uploadImages} onChange={setUploadImages} checkedChildren="图片" unCheckedChildren="图片" />
              <Switch checked={publishAfterDraft} onChange={setPublishAfterDraft} checkedChildren="发布" unCheckedChildren="发布" />
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
              placeholder="文章路径，例如 /path/to/oneai-daily-wechat/content/daily/2026-07-06-daily-briefing.md"
            />
            <Input
              value={coverPath}
              onChange={(event) => setCoverPath(event.target.value)}
              prefix={<CloudUploadOutlined />}
              placeholder="封面图片路径，例如 /path/to/oneai-daily-wechat/assets/brand/oneai-daily-cover.png"
            />
          </div>
          <div className="wechat-official-account-toolbar">
            <Space>
              <Button type="primary" icon={<EyeOutlined />} onClick={renderArticle} loading={loading}>
                渲染
              </Button>
              <Button icon={<CloudUploadOutlined />} onClick={createDraft} loading={loading}>
                创建草稿
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
            <strong>{article?.title || '预览'}</strong>
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
