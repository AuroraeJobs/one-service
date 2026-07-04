import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Input, InputNumber, Select, Slider, Space, Spin, Tag, message } from 'antd';
import {
  BarChartOutlined,
  DownloadOutlined,
  FileTextOutlined,
  ImportOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import {
  lotterySimulationApi,
  lotteryStrategyPortfolioApi,
  type LotterySimulationResult,
  type LotteryStrategyPortfolioSummary,
  type LotteryTicket
} from '../services/api';
import './LotteryOverviewPage.css';

const defaultTicketText = '01 06 11 18 25 31 + 09\n03 08 14 19 26 32 + 12';

const riskColor = (risk?: string) => {
  if (risk === 'LOW') return 'green';
  if (risk === 'MEDIUM') return 'gold';
  if (risk === 'HIGH') return 'red';
  return 'default';
};

const parseTickets = (value: string, targetIssue?: string): Partial<LotteryTicket>[] => value
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean)
  .map(line => line.match(/\d{1,2}/g) || [])
  .filter(numbers => numbers.length >= 7)
  .map(numbers => ({
    issue: targetIssue,
    redNumbers: numbers.slice(0, 6).map(number => number.padStart(2, '0')),
    blueNumber: numbers[6].padStart(2, '0'),
    quantity: 1,
    cost: 2,
    source: 'SIMULATION',
    status: 'DRAFT',
    note: '沙盘候选'
  }));

const formatMoney = (value?: number) => value === undefined || value === null ? '-' : `¥${Number(value).toFixed(2)}`;
const formatPercent = (value?: number) => value === undefined || value === null ? '-' : `${Number(value).toFixed(2)}%`;

const distributionRows = (distribution?: Record<string, number>) => {
  const entries = Object.entries(distribution || {});
  const maxValue = entries.reduce((max, [, value]) => Math.max(max, value), 0);
  return entries.map(([label, value]) => ({
    label,
    value,
    width: maxValue ? `${Math.max(8, Math.round((value / maxValue) * 100))}%` : '0%'
  }));
};

const LotterySimulatorPage = () => {
  const navigate = useNavigate();
  const [targetIssue, setTargetIssue] = useState('');
  const [budgetLimit, setBudgetLimit] = useState<number>(20);
  const [replayWindow, setReplayWindow] = useState<number>(60);
  const [stabilityWeight, setStabilityWeight] = useState<number>(40);
  const [blueWeight, setBlueWeight] = useState<number>(30);
  const [roiWeight, setRoiWeight] = useState<number>(30);
  const [ticketText, setTicketText] = useState(defaultTicketText);
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<string[]>([]);
  const [portfolios, setPortfolios] = useState<LotteryStrategyPortfolioSummary[]>([]);
  const [result, setResult] = useState<LotterySimulationResult>();
  const [loading, setLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [error, setError] = useState<string>();

  const candidateTickets = useMemo(() => parseTickets(ticketText, targetIssue || undefined), [ticketText, targetIssue]);

  const loadPortfolios = useCallback(async () => {
    setPortfolioLoading(true);
    try {
      const response = await lotteryStrategyPortfolioApi.portfolios({ page: 1, pageSize: 50 });
      setPortfolios(response.items || []);
    } catch (requestError) {
      console.error('读取彩票策略组合失败:', requestError);
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  const runSimulation = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await lotterySimulationApi.run({
        targetIssue: targetIssue || undefined,
        budgetLimit,
        replayWindow,
        portfolioIds: selectedPortfolioIds,
        ruleWeights: {
          stability: stabilityWeight,
          blue: blueWeight,
          roi: roiWeight
        },
        candidateTickets
      });
      setResult(response);
      message.success('沙盘模拟已完成');
    } catch (requestError) {
      console.error('运行彩票沙盘失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '运行彩票沙盘失败');
      message.error('运行彩票沙盘失败');
    } finally {
      setLoading(false);
    }
  };

  const handoffTargetIssue = result?.targetIssue || targetIssue || '';
  const hitRows = distributionRows(result?.hitDistribution);
  const prizeRows = distributionRows(result?.prizeDistribution);

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-simulator-page"
      eyebrow="彩票数据"
      title="沙盘模拟"
      actions={
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={loadPortfolios} loading={portfolioLoading}>刷新组合</Button>
          <Button type="primary" icon={<PlayCircleOutlined />} loading={loading} onClick={runSimulation}>运行沙盘</Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}

      <section className="lottery-simulator-grid">
        <Card className="life-panel-card lottery-clean-panel" title={<Space><SafetyCertificateOutlined />模拟参数</Space>}>
          <div className="lottery-simulator-form">
            <label>
              <span>目标期号</span>
              <Input value={targetIssue} onChange={event => setTargetIssue(event.target.value)} placeholder="默认使用最新预测期号" />
            </label>
            <label>
              <span>预算上限</span>
              <InputNumber min={2} precision={2} value={budgetLimit} onChange={value => setBudgetLimit(Number(value || 0))} addonAfter="元" />
            </label>
            <label>
              <span>回放窗口</span>
              <InputNumber min={10} max={500} value={replayWindow} onChange={value => setReplayWindow(Number(value || 30))} addonAfter="期" />
            </label>
            <label>
              <span>策略组合</span>
              <Select
                mode="multiple"
                allowClear
                loading={portfolioLoading}
                value={selectedPortfolioIds}
                onChange={setSelectedPortfolioIds}
                placeholder="选择要纳入证据的组合"
                options={portfolios.map(item => ({
                  value: item.portfolio?.id || '',
                  label: item.portfolio?.name || item.portfolio?.id || '未命名组合'
                })).filter(item => item.value)}
              />
            </label>
          </div>
          <div className="lottery-simulator-sliders">
            <label><span>稳定性权重</span><Slider min={0} max={100} value={stabilityWeight} onChange={setStabilityWeight} /></label>
            <label><span>蓝球权重</span><Slider min={0} max={100} value={blueWeight} onChange={setBlueWeight} /></label>
            <label><span>ROI 权重</span><Slider min={0} max={100} value={roiWeight} onChange={setRoiWeight} /></label>
          </div>
        </Card>

        <Card className="life-panel-card lottery-clean-panel" title={<Space><ImportOutlined />候选票据</Space>}>
          <Input.TextArea
            value={ticketText}
            onChange={event => setTicketText(event.target.value)}
            autoSize={{ minRows: 7, maxRows: 12 }}
            placeholder="每行一注，例如 01 06 11 18 25 31 + 09"
          />
          <div className="lottery-simulator-preview">
            {candidateTickets.length ? candidateTickets.map((ticket, index) => (
              <div key={`${ticket.redNumbers?.join('-')}-${ticket.blueNumber}-${index}`}>
                <LotteryBalls redNumbers={ticket.redNumbers || []} blueNumber={ticket.blueNumber || ''} />
                <span>{formatMoney(ticket.cost)}</span>
              </div>
            )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无候选票据" />}
          </div>
        </Card>
      </section>

      <Spin spinning={loading}>
        {result ? (
          <>
            <section className="lottery-simulator-summary-grid">
              <article><strong>{result.targetIssue || '-'}</strong><span>目标期号</span></article>
              <article><strong>{result.candidateCount || 0}</strong><span>候选注数</span></article>
              <article><strong>{formatMoney(result.proposedCost)}</strong><span>模拟成本</span></article>
              <article><strong>{formatPercent(result.roiReference)}</strong><span>ROI 参考</span></article>
              <article><strong>{result.replayWindow || '-'}</strong><span>回放窗口</span></article>
              <article><Tag color={riskColor(result.riskLevel)}>{result.riskLevel || 'UNKNOWN'}</Tag><span>风险级别</span></article>
            </section>

            {result.warnings?.length ? (
              <Alert
                className="lottery-overview-status-alert"
                type={result.riskLevel === 'HIGH' ? 'error' : 'warning'}
                showIcon
                message="沙盘风险提示"
                description={result.warnings.join('；')}
              />
            ) : null}

            <section className="lottery-simulator-results-grid">
              <Card className="life-panel-card lottery-clean-panel" title={<Space><BarChartOutlined />命中分布</Space>}>
                <div className="lottery-simulator-distribution">
                  {hitRows.length ? hitRows.map(row => (
                    <div key={row.label} className="lottery-simulator-bar-row">
                      <span>{row.label} 红</span>
                      <div><i style={{ width: row.width }} /></div>
                      <strong>{row.value}</strong>
                    </div>
                  )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无模拟结果" />}
                </div>
              </Card>

              <Card className="life-panel-card lottery-clean-panel" title={<Space><BarChartOutlined />奖级分布</Space>}>
                <div className="lottery-simulator-distribution">
                  {prizeRows.length ? prizeRows.map(row => (
                    <div key={row.label} className="lottery-simulator-bar-row">
                      <span>{row.label}</span>
                      <div><i style={{ width: row.width }} /></div>
                      <strong>{row.value}</strong>
                    </div>
                  )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无模拟结果" />}
                </div>
              </Card>
            </section>

            <Card className="life-panel-card lottery-clean-panel" title={<Space><FileTextOutlined />候选明细</Space>}>
              <div className="lottery-simulator-candidate-list">
                {(result.candidates || []).length ? result.candidates.map(candidate => (
                  <article key={candidate.key || `${candidate.redNumbers.join('-')}-${candidate.blueNumber}`}>
                    <div>
                      <strong>{candidate.title || '模拟票'}</strong>
                      <LotteryBalls redNumbers={candidate.redNumbers || []} blueNumber={candidate.blueNumber || ''} />
                    </div>
                    <Space wrap>
                      <Tag>{candidate.source || 'SIMULATION'}</Tag>
                      <Tag color="blue">{formatMoney(candidate.cost)}</Tag>
                      {candidate.warning ? <Tag color="red">{candidate.warning}</Tag> : null}
                    </Space>
                  </article>
                )) : <Empty description="暂无候选票据" />}
              </div>
            </Card>

            <Card className="life-panel-card lottery-clean-panel" title={<Space><DownloadOutlined />交接入口</Space>}>
              <div className="lottery-simulator-handoff">
                <Button onClick={() => navigate(`/lottery/predictions/decision?simIssue=${handoffTargetIssue}`)}>决策板</Button>
                <Button onClick={() => navigate(`/lottery/tickets?issue=${handoffTargetIssue}&source=SIMULATION`)}>票据导入预览</Button>
                <Button onClick={() => navigate(`/lottery/research/notebook?title=沙盘模拟${handoffTargetIssue}&targetIssue=${handoffTargetIssue}&evidenceType=SIMULATION&evidenceTitle=沙盘模拟&path=/lottery/simulator`)}>策略笔记</Button>
                <Button onClick={() => navigate(`/lottery/exports?type=budget-prechecks&targetIssue=${handoffTargetIssue}`)}>导出报表</Button>
              </div>
            </Card>
          </>
        ) : (
          <Card className="life-panel-card lottery-clean-panel">
            <Empty description="暂无模拟结果" />
          </Card>
        )}
      </Spin>
    </LifePageShell>
  );
};

export default LotterySimulatorPage;
