import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Pagination, Space, Spin, Tag, message } from 'antd';
import {
  ExperimentOutlined,
  HistoryOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import {
  lotteryTrainingApi,
  type LotteryPageResponse,
  type LotteryTrainingReportRecord
} from '../services/api';
import './LotteryOverviewPage.css';

const formatTime = (value?: number) => {
  if (!value) return '未记录';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const scaleLabel = (scale?: string) => {
  if (scale === 'fast') return '快速';
  if (scale === 'standard') return '标准';
  if (scale === 'deep') return '深度';
  return scale || '-';
};

const scaleColor = (scale?: string) => {
  if (scale === 'fast') return 'green';
  if (scale === 'standard') return 'blue';
  if (scale === 'deep') return 'red';
  return 'default';
};

const stageColor = (stage?: string) => {
  if (!stage) return 'default';
  if (stage.includes('完成')) return 'success';
  if (stage.includes('失败')) return 'error';
  if (stage.includes('取消')) return 'warning';
  if (stage.includes('训练')) return 'processing';
  return 'default';
};

const LotteryPredictionTrainingHistoryPage = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<LotteryTrainingReportRecord[]>([]);
  const [pageResponse, setPageResponse] = useState<LotteryPageResponse<LotteryTrainingReportRecord>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await lotteryTrainingApi.reports({ page: page - 1, pageSize });
      setPageResponse(response);
      setRecords(response.items || []);
    } catch (requestError) {
      console.error('读取训练历史失败:', requestError);
      setError('训练历史读取失败，请检查后端服务');
      message.error('训练历史读取失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const summary = useMemo(() => {
    const withBest = records.filter(item => item.best).length;
    const completed = records.filter(item => item.stage?.includes('完成')).length;
    const failed = records.filter(item => item.stage?.includes('失败')).length;
    return { withBest, completed, failed };
  }, [records]);

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="训练历史"
      actions={
        <Space wrap>
          <Button type="primary" icon={<ExperimentOutlined />} onClick={() => navigate('/lottery/prediction/training')}>
            训练台
          </Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadReports}>
            刷新
          </Button>
        </Space>
      }
    >
      {error ? <div className="lottery-overview-status-alert" style={{ color: 'var(--app-danger)', padding: '8px 12px', background: 'var(--app-surface-elevated)', borderRadius: 8, marginBottom: 12 }}>{error}</div> : null}
      <section className="lottery-history-summary-grid">
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <HistoryOutlined />
            <div>
              <strong>{records.length}</strong>
              <span>当前页记录</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <ThunderboltOutlined />
            <div>
              <strong>{summary.completed}</strong>
              <span>训练成功</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <TrophyOutlined />
            <div>
              <strong>{summary.withBest}</strong>
              <span>有最佳规则</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <ExperimentOutlined />
            <div>
              <strong>{summary.failed}</strong>
              <span>训练失败</span>
            </div>
          </div>
        </Card>
      </section>

      <Card className="life-panel-card lottery-prediction-panel">
        <div className="lottery-card-title-row">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <HistoryOutlined />
            <div>
              <h2>训练历史记录</h2>
              <p>共 {pageResponse?.total ?? 0} 条，最新训练 {formatTime(records[0]?.createdAt)}</p>
            </div>
          </div>
        </div>
        <Spin spinning={loading}>
          {records.length === 0 && !loading ? (
            <Empty description="暂无训练历史" />
          ) : (
            <div className="lottery-history-list">
              {records.map(record => (
                <article className="lottery-history-card" key={record.id || record.createdAt}>
                  <div className="lottery-prediction-card-head">
                    <div>
                      <strong>训练 #{record.generation ?? '-'}</strong>
                      <span>
                        规模 {record.replayCount ?? '-'} 期 · {scaleLabel(record.scale)} · {formatTime(record.createdAt)}
                      </span>
                    </div>
                    <Space wrap size={4}>
                      <Tag color={scaleColor(record.scale)}>{scaleLabel(record.scale)}</Tag>
                      <Tag color={stageColor(record.stage)}>{record.stage || '未知'}</Tag>
                    </Space>
                  </div>
                  <div className="lottery-prediction-tags">
                    <span>进度 {record.percent ?? 0}%</span>
                    <span>{record.processed ?? 0}/{record.total ?? 0}</span>
                    {record.best ? (
                      <>
                        <span>最佳评分 {record.best.rankScore?.toFixed(1) ?? '-'}</span>
                        <span>{record.best.config?.name || record.best.config?.id || '未记录规则'}</span>
                      </>
                    ) : null}
                    {record.finishedAt ? (
                      <span>耗时 {Math.round((record.finishedAt - (record.startedAt ?? record.createdAt ?? record.finishedAt)) / 1000)}s</span>
                    ) : null}
                  </div>
                  {record.best?.summary ? (
                    <div className="lottery-prediction-tags">
                      <span>平均评分 {record.best.summary.averageScore?.toFixed(1) ?? '-'}</span>
                      <span>红球 {record.best.summary.averageRedHits?.toFixed(1) ?? '-'}/6</span>
                      <span>蓝球 {record.best.summary.blueHitRate?.toFixed(1) ?? '-'}%</span>
                    </div>
                  ) : null}
                  {record.taskDetail ? <p>{record.taskDetail}</p> : null}
                  <div className="lottery-history-card-actions">
                    <Button size="small" icon={<HistoryOutlined />} onClick={() => navigate(`/lottery/prediction/training?reportId=${record.id}`)}>
                      查看详情
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Spin>
        <Pagination
          className="lottery-list-pagination"
          current={page}
          pageSize={pageSize}
          total={pageResponse?.total || 0}
          showSizeChanger
          showTotal={total => `共 ${total} 条`}
          onChange={(nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          }}
        />
      </Card>
    </LifePageShell>
  );
};

export default LotteryPredictionTrainingHistoryPage;
