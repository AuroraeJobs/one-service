import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Input, InputNumber, List, Popconfirm, Space, Tag, message } from 'antd';
import { DatabaseOutlined, ReloadOutlined, ToolOutlined, WarningOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import {
  lotteryDataQualityApi,
  type LotteryDataQualityRepairResult,
  type LotteryDataQualityReport
} from '../services/api';
import './LotteryOverviewPage.css';

const emptyReport: LotteryDataQualityReport = {
  totalRecords: 0,
  missingIssueCount: 0,
  duplicateIssueCount: 0,
  malformedRecordCount: 0,
  invalidNumberCount: 0,
  outOfOrderLineCount: 0,
  futureDateCount: 0,
  staleDerivedDataCount: 0,
  missingIssues: [],
  duplicateIssues: [],
  malformedIssues: [],
  outOfOrderLineIssues: [],
  futureDateIssues: [],
  staleDerivedDataReasons: []
};

const qualityGroups = (report: LotteryDataQualityReport) => [
  { title: '缺失期号', count: report.missingIssueCount || 0, issues: report.missingIssues || [], color: 'gold' },
  { title: '重复期号', count: report.duplicateIssueCount || 0, issues: report.duplicateIssues || [], color: 'orange' },
  { title: '号码异常', count: report.malformedRecordCount || 0, issues: report.malformedIssues || [], color: 'red' },
  { title: 'Line 顺序', count: report.outOfOrderLineCount || 0, issues: report.outOfOrderLineIssues || [], color: 'cyan' },
  { title: '未来日期', count: report.futureDateCount || 0, issues: report.futureDateIssues || [], color: 'purple' },
  { title: '派生数据', count: report.staleDerivedDataCount || 0, issues: report.staleDerivedDataReasons || [], color: 'volcano' }
];

const formatTime = (value?: number) => {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const LotteryDataQualityPage = () => {
  const [report, setReport] = useState<LotteryDataQualityReport>(emptyReport);
  const [repairPlan, setRepairPlan] = useState<LotteryDataQualityRepairResult>();
  const [loading, setLoading] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [repairLimit, setRepairLimit] = useState(50);
  const [issueStart, setIssueStart] = useState('');
  const [issueEnd, setIssueEnd] = useState('');
  const [error, setError] = useState<string>();

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const nextReport = await lotteryDataQualityApi.report();
      setReport(nextReport || emptyReport);
      setRepairPlan(undefined);
    } catch (requestError) {
      console.error('读取彩票数据质量失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票数据质量失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const dryRunRepair = async () => {
    setRepairing(true);
    setError(undefined);
    try {
      const result = await lotteryDataQualityApi.dryRunMissingIssuesRepair({
        limit: repairLimit,
        issueStart: issueStart.trim() || undefined,
        issueEnd: issueEnd.trim() || undefined
      });
      setRepairPlan(result);
      message.success(result.message || '修复计划已生成');
    } catch (requestError) {
      console.error('生成缺失期号修复计划失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '生成缺失期号修复计划失败');
      message.error('生成缺失期号修复计划失败');
    } finally {
      setRepairing(false);
    }
  };

  const confirmRepair = async () => {
    setRepairing(true);
    setError(undefined);
    try {
      const result = await lotteryDataQualityApi.confirmMissingIssuesRepair({
        issues: repairPlan?.repairableIssues || [],
        issueStart: issueStart.trim() || undefined,
        issueEnd: issueEnd.trim() || undefined,
        limit: repairLimit,
        confirm: true
      });
      setRepairPlan(result);
      message.success(result.message || '缺失期号修复完成');
      const nextReport = await lotteryDataQualityApi.report();
      setReport(nextReport || emptyReport);
    } catch (requestError) {
      console.error('确认缺失期号修复失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '确认缺失期号修复失败');
      message.error('确认缺失期号修复失败');
    } finally {
      setRepairing(false);
    }
  };

  const canConfirmRepair = Boolean(repairPlan?.dryRun && (repairPlan.repairableIssueCount || 0) > 0);

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="数据质量"
      actions={
        <Button icon={<ReloadOutlined />} loading={loading} onClick={loadReport}>
          刷新
        </Button>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}

      <section className="lottery-history-summary-grid">
        <Card className="life-panel-card lottery-clean-panel" loading={loading}>
          <div className="lottery-history-summary-item">
            <DatabaseOutlined />
            <div>
              <strong>{report.totalRecords || 0}</strong>
              <span>总记录</span>
            </div>
          </div>
        </Card>
        {qualityGroups(report).map(group => (
          <Card key={group.title} className="life-panel-card lottery-clean-panel" loading={loading}>
            <div className="lottery-history-summary-item">
              <WarningOutlined />
              <div>
                <strong>{group.count}</strong>
                <span>{group.title}</span>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <Card className="life-panel-card" title="检查样例" extra={<Tag>生成 {formatTime(report.generatedAt)}</Tag>}>
        <List
          dataSource={qualityGroups(report)}
          renderItem={group => (
            <List.Item>
              <List.Item.Meta
                title={<Space><Tag color={group.color}>{group.title}</Tag><span>{group.count} 项</span></Space>}
                description={group.issues.length ? group.issues.join('、') : '暂无异常'}
              />
            </List.Item>
          )}
        />
      </Card>

      <Card
        className="life-panel-card"
        title={<Space><ToolOutlined />缺失期号修复</Space>}
        extra={
          <Space wrap>
            <InputNumber
              min={1}
              max={200}
              value={repairLimit}
              onChange={value => setRepairLimit(value || 50)}
              addonAfter="期"
            />
            <Input
              value={issueStart}
              placeholder="起始期号"
              allowClear
              style={{ width: 130 }}
              onChange={event => setIssueStart(event.target.value)}
            />
            <Input
              value={issueEnd}
              placeholder="结束期号"
              allowClear
              style={{ width: 130 }}
              onChange={event => setIssueEnd(event.target.value)}
            />
            <Button icon={<ToolOutlined />} loading={repairing} onClick={dryRunRepair}>
              生成计划
            </Button>
            <Popconfirm
              title="确认修复缺失期号？"
              description="只会写入 provider 能证明存在的缺失期号，并刷新开奖记录顺序。"
              okText="确认"
              cancelText="取消"
              disabled={!canConfirmRepair}
              onConfirm={confirmRepair}
            >
              <Button type="primary" disabled={!canConfirmRepair} loading={repairing}>
                确认修复
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        {repairPlan ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type={repairPlan.dryRun ? 'info' : 'success'}
              showIcon
              message={repairPlan.message || '修复结果'}
            />
            <section className="lottery-history-summary-grid lottery-sync-summary-grid">
              <div className="lottery-clean-panel">
                <div className="lottery-history-summary-item">
                  <WarningOutlined />
                  <div>
                    <strong>{repairPlan.missingBefore ?? 0}</strong>
                    <span>修复前缺失</span>
                  </div>
                </div>
              </div>
              <div className="lottery-clean-panel">
                <div className="lottery-history-summary-item">
                  <ToolOutlined />
                  <div>
                    <strong>{repairPlan.repairableIssueCount ?? 0}</strong>
                    <span>可修复</span>
                  </div>
                </div>
              </div>
              <div className="lottery-clean-panel">
                <div className="lottery-history-summary-item">
                  <DatabaseOutlined />
                  <div>
                    <strong>{repairPlan.repairedIssueCount ?? 0}</strong>
                    <span>已修复</span>
                  </div>
                </div>
              </div>
              <div className="lottery-clean-panel">
                <div className="lottery-history-summary-item">
                  <WarningOutlined />
                  <div>
                    <strong>{repairPlan.skippedIssueCount ?? 0}</strong>
                    <span>跳过</span>
                  </div>
                </div>
              </div>
              <div className="lottery-clean-panel">
                <div className="lottery-history-summary-item">
                  <DatabaseOutlined />
                  <div>
                    <strong>{repairPlan.renumberedRecordCount ?? 0}</strong>
                    <span>重排记录</span>
                  </div>
                </div>
              </div>
            </section>
            <Alert
              type={repairPlan.cacheInvalidated ? 'success' : 'info'}
              showIcon
              message={`缓存刷新：${repairPlan.cacheInvalidated ? '已刷新' : '等待确认后刷新'}`}
              description={repairPlan.auditEventId ? `审计事件：${repairPlan.auditEventId}` : undefined}
            />
            <List
              size="small"
              dataSource={[
                { title: '请求期号', issues: repairPlan.requestedIssues || [], color: 'blue' },
                { title: '可修复期号', issues: repairPlan.repairableIssues || [], color: 'green' },
                { title: '已修复期号', issues: repairPlan.repairedIssues || [], color: 'cyan' },
                { title: '跳过期号', issues: repairPlan.skippedIssues || [], color: 'orange' },
                { title: '执行步骤', issues: repairPlan.repairSteps || [], color: 'purple' }
              ]}
              renderItem={group => (
                <List.Item>
                  <List.Item.Meta
                    title={<Space><Tag color={group.color}>{group.title}</Tag><span>{group.issues.length} 项</span></Space>}
                    description={group.issues.length ? group.issues.join('、') : '暂无'}
                  />
                </List.Item>
              )}
            />
          </Space>
        ) : (
          <Alert
            type="info"
            showIcon
            message="先生成修复计划；只有 provider 能重新拉取并匹配到的缺失期号才允许确认写入。"
          />
        )}
      </Card>
    </LifePageShell>
  );
};

export default LotteryDataQualityPage;
