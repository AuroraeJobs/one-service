import { useEffect, useState } from 'react';
import { Button, Empty, Pagination, Space, Tag, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import {
  wechatOfficialAccountApi,
  type WechatArticleListResponse,
  type WechatTokenStatus
} from '../services/api';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import './WechatOfficialAccountPage.css';

interface WechatOfficialAccountArticlesPageProps {
  type: 'drafts' | 'published';
}

const pageSize = 10;

const WechatOfficialAccountArticlesPage = ({ type }: WechatOfficialAccountArticlesPageProps) => {
  const { isEnglish } = useAppPreferences();
  const [loading, setLoading] = useState(false);
  const [articleList, setArticleList] = useState<WechatArticleListResponse>();
  const [page, setPage] = useState(1);
  const [tokenStatus, setTokenStatus] = useState<WechatTokenStatus>();

  const isDrafts = type === 'drafts';
  const text = {
    title: isDrafts
      ? (isEnglish ? 'Official Account Drafts' : '公众号草稿箱')
      : (isEnglish ? 'Published Articles' : '公众号已发布'),
    panelTitle: isDrafts
      ? (isEnglish ? 'Drafts' : '草稿箱')
      : (isEnglish ? 'Published' : '已发布'),
    configured: isEnglish ? 'Configured' : '已配置',
    notConfigured: isEnglish ? 'Not configured' : '未配置',
    refresh: isEnglish ? 'Refresh' : '刷新',
    articleUnit: isEnglish ? 'articles' : '篇',
    unnamedArticle: isEnglish ? 'Untitled article' : '未命名文章',
    noTime: isEnglish ? 'No time' : '暂无时间',
    noId: isEnglish ? 'No id' : '无 id',
    loading: isEnglish ? 'Loading' : '加载中',
    noData: isEnglish ? 'No data' : '暂无数据',
    draftsLoadFailed: isEnglish ? 'Failed to load drafts' : '草稿箱加载失败',
    publishedLoadFailed: isEnglish ? 'Failed to load published articles' : '已发布列表加载失败'
  };

  const loadTokenStatus = async () => {
    try {
      setTokenStatus(await wechatOfficialAccountApi.tokenStatus());
    } catch (error) {
      console.error('token status failed', error);
    }
  };

  const loadArticleList = async (targetPage = page) => {
    setLoading(true);
    try {
      const request = {
        offset: (targetPage - 1) * pageSize,
        count: pageSize,
        noContent: 1
      };
      const result = isDrafts
        ? await wechatOfficialAccountApi.listDrafts(request)
        : await wechatOfficialAccountApi.listPublishedArticles(request);
      setArticleList(result);
    } catch (error) {
      const fallback = isDrafts ? text.draftsLoadFailed : text.publishedLoadFailed;
      message.error(error instanceof Error ? error.message : fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadTokenStatus();
    loadArticleList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  return (
    <LifePageShell
      eyebrow="OneAI Daily"
      title={text.title}
      actions={(
        <Space wrap>
          <Tag color={tokenStatus?.configured ? 'green' : 'orange'}>
            {tokenStatus?.configured ? text.configured : text.notConfigured}
          </Tag>
          <Button icon={<ReloadOutlined />} onClick={() => loadArticleList()} loading={loading}>
            {text.refresh}
          </Button>
        </Space>
      )}
    >
      <section className="wechat-official-account-panel">
        <div className="wechat-official-account-panel-header">
          <strong>{text.panelTitle}</strong>
          <Tag>{articleList?.total_count ?? 0} {text.articleUnit}</Tag>
        </div>
        <div className="wechat-official-account-list">
          {articleList?.item?.length ? articleList.item.map((item, index) => {
            const content = item.content as Record<string, unknown> | undefined;
            const newsItems = content?.news_item as Array<Record<string, unknown>> | undefined;
            const firstNews = newsItems?.[0] || {};
            const titleText = String(firstNews.title || item.media_id || item.publish_id || text.unnamedArticle);
            const digest = String(firstNews.digest || '');
            const updatedAt = Number(item.update_time || item.create_time || item.publish_time || 0);
            return (
              <article className="wechat-official-account-list-item" key={`${item.media_id || item.publish_id || index}`}>
                <div>
                  <h3>{titleText}</h3>
                  {digest && <p>{digest}</p>}
                  <span>{updatedAt ? new Date(updatedAt * 1000).toLocaleString() : text.noTime}</span>
                </div>
                <Tag>{String(item.media_id || item.publish_id || text.noId)}</Tag>
              </article>
            );
          }) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={loading ? text.loading : text.noData} />
          )}
        </div>
        <div className="wechat-official-account-pagination">
          <Pagination
            size="small"
            current={page}
            pageSize={pageSize}
            total={articleList?.total_count || 0}
            showSizeChanger={false}
            onChange={(nextPage) => {
              setPage(nextPage);
              loadArticleList(nextPage);
            }}
          />
        </div>
      </section>
    </LifePageShell>
  );
};

export default WechatOfficialAccountArticlesPage;
