import { useEffect, useState } from 'react';
import { Button, Empty, Pagination, Space, Tag, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import {
  wechatOfficialAccountApi,
  type WechatArticleListResponse,
  type WechatTokenStatus
} from '../services/api';
import './WechatOfficialAccountPage.css';

interface WechatOfficialAccountArticlesPageProps {
  type: 'drafts' | 'published';
}

const pageSize = 10;

const WechatOfficialAccountArticlesPage = ({ type }: WechatOfficialAccountArticlesPageProps) => {
  const [loading, setLoading] = useState(false);
  const [articleList, setArticleList] = useState<WechatArticleListResponse>();
  const [page, setPage] = useState(1);
  const [tokenStatus, setTokenStatus] = useState<WechatTokenStatus>();

  const isDrafts = type === 'drafts';
  const title = isDrafts ? '公众号草稿箱' : '公众号已发布';

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
      const fallback = isDrafts ? '草稿箱加载失败' : '已发布列表加载失败';
      message.error(error instanceof Error ? error.message : fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadTokenStatus();
    loadArticleList(1);
  }, [type]);

  return (
    <LifePageShell
      eyebrow="OneAI Daily"
      title={title}
      actions={(
        <Space wrap>
          <Tag color={tokenStatus?.configured ? 'green' : 'orange'}>
            {tokenStatus?.configured ? '已配置' : '未配置'}
          </Tag>
          <Button icon={<ReloadOutlined />} onClick={() => loadArticleList()} loading={loading}>
            刷新
          </Button>
        </Space>
      )}
    >
      <section className="wechat-official-account-panel">
        <div className="wechat-official-account-panel-header">
          <strong>{isDrafts ? '草稿箱' : '已发布'}</strong>
          <Tag>{articleList?.total_count ?? 0} 篇</Tag>
        </div>
        <div className="wechat-official-account-list">
          {articleList?.item?.length ? articleList.item.map((item, index) => {
            const content = item.content as Record<string, unknown> | undefined;
            const newsItems = content?.news_item as Array<Record<string, unknown>> | undefined;
            const firstNews = newsItems?.[0] || {};
            const titleText = String(firstNews.title || item.media_id || item.publish_id || '未命名文章');
            const digest = String(firstNews.digest || '');
            const updatedAt = Number(item.update_time || item.create_time || item.publish_time || 0);
            return (
              <article className="wechat-official-account-list-item" key={`${item.media_id || item.publish_id || index}`}>
                <div>
                  <h3>{titleText}</h3>
                  {digest && <p>{digest}</p>}
                  <span>{updatedAt ? new Date(updatedAt * 1000).toLocaleString() : '暂无时间'}</span>
                </div>
                <Tag>{String(item.media_id || item.publish_id || '无 id')}</Tag>
              </article>
            );
          }) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={loading ? '加载中' : '暂无数据'} />
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
