import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Empty, Progress, Space, Spin, Tag } from 'antd';
import {
  AppstoreOutlined,
  BranchesOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import {
  lotteryOutcomeApi,
  type LotteryOutcomeAttribution
} from '../services/api';
import './LotteryOverviewPage.css';

const formatMoney = (value?: number) => value === undefined || value === null ? '-' : `¥${Number(value).toFixed(2)}`;
const formatPercent = (value?: number) => value === undefined || value === null ? '-' : `${Number(value).toFixed(2)}%`;
const formatTime = (value?: number) => value ? new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value)) : '-';

const stateColor = (state?: string) => {
  if (state === 'PROMOTE_SIGNAL' || state === 'POSITIVE' || state === 'LINKED' || state === 'EXECUTED' || state === 'CONFIRMED_SIGNAL') return 'green';
  if (state === 'WATCH_RISK' || state === 'WATCH' || state === 'PENDING' || state === 'OBSERVE') return 'gold';
  if (state === 'RECALIBRATE' || state === 'NO_HIT') return 'red';
  return 'default';
};

const distributionRows = (distribution?: Record<string, number>) => Object.entries(distribution || {});

const LotteryOutcomeAttributionPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [outcomes, setOutcomes] = useState<LotteryOutcomeAttribution[]>([]);
  const [selected, setSelected] = useState<LotteryOutcomeAttribution>();
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'GAP' | 'PROMOTE' | 'WATCH'>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const selectedIssue = searchParams.get('issue') || undefined;

  const loadOutcomes = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const recent = await lotteryOutcomeApi.recent({ limit: 20 });
      setOutcomes(recent);
      const issue = selectedIssue || recent[0]?.issue;
      if (issue) {
        const detail = await lotteryOutcomeApi.issue(issue);
        setSelected(detail);
        setSearchParams({ issue });
      }
    } catch (requestError) {
      console.error('读取彩票归因失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票归因失败');
    } finally {
      setLoading(false);
    }
  }, [selectedIssue, setSearchParams]);

  useEffect(() => {
    loadOutcomes();
  }, [loadOutcomes]);

  const selectIssue = async (issue?: string) => {
    if (!issue) {
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      setSelected(await lotteryOutcomeApi.issue(issue));
      setSearchParams({ issue });
    } catch (requestError) {
      console.error('读取彩票归因失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票归因失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredOutcomes = outcomes.filter(item => {
    if (outcomeFilter === 'GAP') return (item.ticketCount || 0) > (item.checkedTicketCount || 0);
    if (outcomeFilter === 'PROMOTE') return item.calibrationState === 'PROMOTE_SIGNAL';
    if (outcomeFilter === 'WATCH') return item.calibrationState === 'WATCH_RISK' || item.calibrationState === 'RECALIBRATE';
    return true;
  });

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-outcome-page"
      eyebrow="彩票数据"
      title="归因复盘"
      actions={
        <Space wrap>
          <Button onClick={() => navigate('/lottery/governance')}>治理</Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadOutcomes}>刷新</Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <Spin spinning={loading && !selected}>
        <section className="lottery-outcome-layout">
          <Card className="life-panel-card lottery-clean-panel" title={<Space><BranchesOutlined />期号时间线</Space>}>
            <div className="lottery-filter-preset-bar">
              <Button size="small" type={outcomeFilter === 'ALL' ? 'primary' : 'default'} onClick={() => setOutcomeFilter('ALL')}>全部</Button>
              <Button size="small" type={outcomeFilter === 'GAP' ? 'primary' : 'default'} onClick={() => setOutcomeFilter('GAP')}>待结算</Button>
              <Button size="small" type={outcomeFilter === 'PROMOTE' ? 'primary' : 'default'} onClick={() => setOutcomeFilter('PROMOTE')}>可推广</Button>
              <Button size="small" type={outcomeFilter === 'WATCH' ? 'primary' : 'default'} onClick={() => setOutcomeFilter('WATCH')}>需观察</Button>
            </div>
            <div className="lottery-outcome-issue-list">
              {filteredOutcomes.length ? filteredOutcomes.map(item => (
                <button
                  key={item.issue}
                  type="button"
                  className={item.issue === selected?.issue ? 'active' : ''}
                  onClick={() => selectIssue(item.issue)}
                >
                  <strong>{item.issue}</strong>
                  <span>{formatMoney(item.netResult)} · ROI {formatPercent(item.roiPercent)}</span>
                  <Tag color={stateColor(item.calibrationState)}>{item.calibrationState || 'UNKNOWN'}</Tag>
                </button>
              )) : <Empty description="暂无归因期号" />}
            </div>
          </Card>

          <div className="lottery-outcome-detail">
            {selected ? (
              <>
                <section className="lottery-outcome-summary-grid">
                  <article><strong>{selected.issue}</strong><span>期号</span></article>
                  <article><strong>{selected.ticketCount || 0}</strong><span>票据</span></article>
                  <article><strong>{selected.winningTicketCount || 0}</strong><span>中奖票据</span></article>
                  <article><strong>{formatMoney(selected.netResult)}</strong><span>净收益</span></article>
                  <article><strong>{formatPercent(selected.roiPercent)}</strong><span>ROI</span></article>
                  <article><Tag color={stateColor(selected.calibrationState)}>{selected.calibrationState || 'UNKNOWN'}</Tag><span>校准状态</span></article>
                </section>

                <section className="lottery-outcome-card-grid">
                  <Card className="life-panel-card lottery-clean-panel" title={<Space><AppstoreOutlined />组合贡献</Space>}>
                    <div className="lottery-outcome-table">
                      {selected.portfolioContributions?.length ? selected.portfolioContributions.map(item => (
                        <button key={item.portfolioId || item.name} type="button" onClick={() => navigate('/lottery/strategy-portfolios')}>
                          <span>{item.name || item.portfolioId || '-'}</span>
                          <Progress percent={item.healthScore || 0} size="small" />
                          <Tag color={stateColor(item.contributionState)}>{item.contributionState}</Tag>
                        </button>
                      )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无组合贡献" />}
                    </div>
                  </Card>

                  <Card className="life-panel-card lottery-clean-panel" title={<Space><SafetyCertificateOutlined />票包执行</Space>}>
                    <div className="lottery-outcome-table">
                      {selected.ticketPackExecutions?.length ? selected.ticketPackExecutions.map(item => (
                        <button key={item.packId || item.title} type="button" onClick={() => navigate('/lottery/ticket-packs')}>
                          <span>{item.title || item.packId}</span>
                          <small>{item.savedTicketCount || 0}/{item.itemCount || 0} 已保存 · {formatMoney(item.proposedCost)}</small>
                          <Tag color={stateColor(item.executionState)}>{item.executionState}</Tag>
                        </button>
                      )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无票包执行" />}
                    </div>
                  </Card>

                  <Card className="life-panel-card lottery-clean-panel" title={<Space><ExperimentOutlined />沙盘 Drift</Space>}>
                    <div className="lottery-outcome-table">
                      {selected.simulationDrifts?.length ? selected.simulationDrifts.map(item => (
                        <button key={item.auditId || item.generatedAt} type="button" onClick={() => navigate('/lottery/simulator')}>
                          <span>{item.riskLevel || 'UNKNOWN'} · {item.candidateCount || 0} 候选</span>
                          <small>中奖票据 {item.actualWinningTicketCount || 0} · {formatTime(item.generatedAt)}</small>
                          <Tag color={stateColor(item.driftState)}>{item.driftState}</Tag>
                        </button>
                      )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无沙盘归因" />}
                    </div>
                  </Card>

                  <Card className="life-panel-card lottery-clean-panel" title={<Space><FileTextOutlined />决策与奖级</Space>}>
                    <div className="lottery-outcome-distribution">
                      {distributionRows(selected.prizeDistribution).length ? distributionRows(selected.prizeDistribution).map(([name, count]) => (
                        <div key={name}><span>{name}</span><strong>{count}</strong></div>
                      )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无奖级分布" />}
                    </div>
                    <div className="lottery-outcome-table">
                      {selected.decisionContributions?.map(item => (
                        <button key={item.decisionSetId || item.title} type="button" onClick={() => navigate('/lottery/predictions/decision')}>
                          <span>{item.title || item.decisionSetId}</span>
                          <small>{item.ruleName || '-'} · {formatMoney(item.netResult)}</small>
                          <Tag color={stateColor(item.contributionState)}>{item.contributionState}</Tag>
                        </button>
                      ))}
                    </div>
                  </Card>
                </section>

                <Card className="life-panel-card lottery-clean-panel" title="归因时间线">
                  <div className="lottery-outcome-timeline">
                    {selected.timeline?.length ? selected.timeline.map(item => (
                      <button key={`${item.type}-${item.timestamp}-${item.title}`} type="button" onClick={() => navigate(item.path || '/lottery/outcomes')}>
                        <Tag>{item.type}</Tag>
                        <span>{item.title}</span>
                        <small>{item.state || '-'} · {formatTime(item.timestamp)}</small>
                      </button>
                    )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无归因时间线" />}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="life-panel-card lottery-clean-panel">
                <Empty description="暂无归因数据" />
              </Card>
            )}
          </div>
        </section>
      </Spin>
    </LifePageShell>
  );
};

export default LotteryOutcomeAttributionPage;
