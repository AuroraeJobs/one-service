import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, List, Space, Tag } from 'antd';
import { DatabaseOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import { lotteryDataQualityApi, type LotteryDataQualityReport } from '../services/api';
import './LotteryOverviewPage.css';

const emptyReport: LotteryDataQualityReport = {
  totalRecords: 0,
  missingIssueCount: 0,
  duplicateIssueCount: 0,
  malformedRecordCount: 0,
  futureDateCount: 0,
  missingIssues: [],
  duplicateIssues: [],
  malformedIssues: [],
  futureDateIssues: []
};

const qualityGroups = (report: LotteryDataQualityReport) => [
  { title: '缺失期号', count: report.missingIssueCount || 0, issues: report.missingIssues || [], color: 'gold' },
  { title: '重复期号', count: report.duplicateIssueCount || 0, issues: report.duplicateIssues || [], color: 'orange' },
  { title: '号码异常', count: report.malformedRecordCount || 0, issues: report.malformedIssues || [], color: 'red' },
  { title: '未来日期', count: report.futureDateCount || 0, issues: report.futureDateIssues || [], color: 'purple' }
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const nextReport = await lotteryDataQualityApi.report();
      setReport(nextReport || emptyReport);
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
    </LifePageShell>
  );
};

export default LotteryDataQualityPage;
