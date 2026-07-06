import { useEffect, useMemo, useState } from 'react';
import { Button, Empty, Input, Pagination, Segmented, Space, Switch, Tag, message } from 'antd';
import { CloudUploadOutlined, EyeOutlined, ReloadOutlined, SendOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import {
  wechatOfficialAccountApi,
  type WechatArticleListResponse,
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
  const [mediaId, setMediaId] = useState('');
  const [uploadImages, setUploadImages] = useState(true);
  const [publishAfterDraft, setPublishAfterDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<WechatRenderedArticle>();
  const [tokenStatus, setTokenStatus] = useState<WechatTokenStatus>();
  const [listType, setListType] = useState<'drafts' | 'published'>('drafts');
  const [listLoading, setListLoading] = useState(false);
  const [articleList, setArticleList] = useState<WechatArticleListResponse>();
  const [listPage, setListPage] = useState(1);
  const listPageSize = 10;

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

  const loadArticleList = async (type = listType, page = listPage) => {
    setListLoading(true);
    try {
      const request = {
        offset: (page - 1) * listPageSize,
        count: listPageSize,
        noContent: 1
      };
      const result = type === 'drafts'
        ? await wechatOfficialAccountApi.listDrafts(request)
        : await wechatOfficialAccountApi.listPublishedArticles(request);
      setArticleList(result);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '列表加载失败');
    } finally {
      setListLoading(false);
    }
  };

  const switchListType = (value: 'drafts' | 'published') => {
    setListType(value);
    setListPage(1);
    loadArticleList(value, 1);
  };

  const renderArticle = async () => {
    setLoading(true);
    try {
      const result = await wechatOfficialAccountApi.render({ markdown, uploadImages: false });
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
      const result = await wechatOfficialAccountApi.createDraft({
        markdown,
        uploadImages,
        publishAfterDraft
      });
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
          <div className="wechat-official-account-toolbar">
            <Space>
              <Button type="primary" icon={<EyeOutlined />} onClick={renderArticle} loading={loading}>
                渲染
              </Button>
              <Button icon={<CloudUploadOutlined />} onClick={createDraft} loading={loading}>
                创建草稿
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => loadArticleList()} loading={listLoading}>
                列表
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

      <section className="wechat-official-account-panel wechat-official-account-list-panel">
        <div className="wechat-official-account-panel-header">
          <Space>
            <strong>公众号文章</strong>
            <Segmented
              size="small"
              value={listType}
              onChange={(value) => switchListType(value as 'drafts' | 'published')}
              options={[
                { label: '草稿箱', value: 'drafts' },
                { label: '已发布', value: 'published' }
              ]}
            />
          </Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadArticleList()} loading={listLoading}>
            刷新
          </Button>
        </div>
        <div className="wechat-official-account-list">
          {articleList?.item?.length ? articleList.item.map((item, index) => {
            const content = item.content as Record<string, unknown> | undefined;
            const newsItems = content?.news_item as Array<Record<string, unknown>> | undefined;
            const firstNews = newsItems?.[0] || {};
            const title = String(firstNews.title || item.media_id || item.publish_id || '未命名文章');
            const digest = String(firstNews.digest || '');
            const updatedAt = Number(item.update_time || item.create_time || item.publish_time || 0);
            return (
              <article className="wechat-official-account-list-item" key={`${item.media_id || item.publish_id || index}`}>
                <div>
                  <h3>{title}</h3>
                  {digest && <p>{digest}</p>}
                  <span>{updatedAt ? new Date(updatedAt * 1000).toLocaleString() : '暂无时间'}</span>
                </div>
                <Tag>{String(item.media_id || item.publish_id || '无 id')}</Tag>
              </article>
            );
          }) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={listLoading ? '加载中' : '暂无数据'} />
          )}
        </div>
        <div className="wechat-official-account-pagination">
          <Pagination
            size="small"
            current={listPage}
            pageSize={listPageSize}
            total={articleList?.total_count || 0}
            showSizeChanger={false}
            onChange={(page) => {
              setListPage(page);
              loadArticleList(listType, page);
            }}
          />
        </div>
      </section>
    </LifePageShell>
  );
};

export default WechatOfficialAccountPage;
