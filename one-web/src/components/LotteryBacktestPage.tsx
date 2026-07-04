import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Pagination, Select, Space, Spin, Tag, message } from 'antd';
import { BarChartOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import {
  lotteryBacktestApi,
  type LotteryBacktestReport,
  type LotteryBacktestRunRequest,
  type LotteryPageResponse
} from '../services/api';
import './LotteryOverviewPage.css';

const formatMoney = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return `¥${Number(value).toFixed(2)}`;
};

const formatTime = (value?: number) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const LotteryBacktestPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<LotteryBacktestRunRequest>();
  const [reports, setReports] = useState<LotteryBacktestReport[]>([]);
  const [pageResponse, setPageResponse] = useState<LotteryPageResponse<LotteryBacktestReport>>();
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string>();

  const page = Math.max(0, Number(searchParams.get('page') || '0') || 0);
  const pageSize = Math.max(1, Number(searchParams.get('pageSize') || '10') || 10);
  const strategyName = searchParams.get('strategyName') || '';
  const presetWindow = searchParams.get('presetWindow') || '';

  const updateQuery = useCallback((patch: Record<string, string | number | undefined>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    if (resetPage && !Object.prototype.hasOwnProperty.call(patch, 'page')) {
      next.delete('page');
    }
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await lotteryBacktestApi.reports({
        page,
        pageSize,
        strategyName: strategyName.trim() || undefined,
        presetWindow: presetWindow.trim() || undefined
      });
      setPageResponse(response);
      setReports(response.items || []);
    } catch (requestError) {
      console.error('读取回测报告失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取回测报告失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, presetWindow, strategyName]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const summary = useMemo(() => {
    const best = reports.reduce((current, item) => (item.stabilityScore || 0) > (current?.stabilityScore || 0) ? item : current, reports[0]);
    const net = reports.reduce((sum, item) => sum + (item.netResult || 0), 0);
    return { best, net };
  }, [reports]);

  const runBacktest = async () => {
    const values = await form.validateFields();
    setRunning(true);
    setError(undefined);
    try {
      const report = await lotteryBacktestApi.run(values);
      message.success('回测报告已生成');
      setModalOpen(false);
      form.resetFields();
      await loadReports();
      if (report.id) {
        navigate(`/lottery/backtests/${report.id}`);
      }
    } catch (requestError) {
      console.error('运行回测失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '运行回测失败');
      message.error('运行回测失败');
    } finally {
      setRunning(false);
    }
  };

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="回测证据"
      actions={
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新建回测
          </Button>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="策略名称"
            value={strategyName}
            onChange={event => updateQuery({ strategyName: event.target.value })}
            style={{ width: 160 }}
          />
          <Select
            allowClear
            placeholder="窗口"
            value={presetWindow || undefined}
            onChange={value => updateQuery({ presetWindow: value })}
            style={{ width: 140 }}
            options={[
              { label: 'latest-30', value: 'latest-30' },
              { label: 'latest-100', value: 'latest-100' },
              { label: 'latest-300', value: 'latest-300' }
            ]}
          />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadReports}>
            刷新
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}

      <section className="lottery-history-summary-grid">
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <BarChartOutlined />
            <div>
              <strong>{pageResponse?.total || 0}</strong>
              <span>回测报告</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <BarChartOutlined />
            <div>
              <strong>{summary.best?.stabilityScore ?? 0}</strong>
              <span>当前页稳定分</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <BarChartOutlined />
            <div>
              <strong>{formatMoney(summary.net)}</strong>
              <span>当前页净值</span>
            </div>
          </div>
        </Card>
      </section>

      <Card className="life-panel-card lottery-prediction-panel">
        <Spin spinning={loading}>
          <div className="lottery-history-list">
            {reports.map(report => (
              <article className="lottery-history-card" key={report.id}>
                <div className="lottery-prediction-card-head">
                  <div>
                    <strong>{report.strategyName || '未命名回测'}</strong>
                    <span>{report.presetWindow || '-'} · {report.issueStart || '-'} 到 {report.issueEnd || '-'} · {formatTime(report.createdAt)}</span>
                  </div>
                  <Tag color="processing">稳定 {report.stabilityScore ?? 0}</Tag>
                </div>
                <div className="lottery-prediction-tags">
                  <span>回放 {report.replayCount || 0}</span>
                  <span>红球均值 {report.averageRedHits ?? 0}</span>
                  <span>蓝球率 {report.blueHitRate ?? 0}%</span>
                  <span>净值 {formatMoney(report.netResult)}</span>
                </div>
                <div className="lottery-history-card-actions">
                  <Button size="small" icon={<BarChartOutlined />} onClick={() => navigate(`/lottery/backtests/${report.id}`)}>
                    查看详情
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Spin>
        <Pagination
          className="lottery-list-pagination"
          current={page + 1}
          pageSize={pageSize}
          total={pageResponse?.total || 0}
          showSizeChanger
          showTotal={total => `共 ${total} 条`}
          onChange={(nextPage, nextPageSize) => updateQuery({ page: nextPage - 1, pageSize: nextPageSize }, false)}
        />
      </Card>

      <Modal
        title="新建回测"
        open={modalOpen}
        okText="运行"
        cancelText="取消"
        confirmLoading={running}
        onOk={runBacktest}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical" initialValues={{ strategyName: '上一期基线', presetWindow: 'latest-30', window: 30 }}>
          <Form.Item name="strategyName" label="策略名称" rules={[{ required: true, message: '请输入策略名称' }]}>
            <Input />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="presetWindow" label="窗口" style={{ width: '50%' }}>
              <Select
                options={[
                  { label: 'latest-30', value: 'latest-30' },
                  { label: 'latest-100', value: 'latest-100' },
                  { label: 'latest-300', value: 'latest-300' },
                  { label: 'custom', value: 'custom' }
                ]}
              />
            </Form.Item>
            <Form.Item name="window" label="期数" style={{ width: '50%' }}>
              <InputNumber min={1} max={500} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item name="issueStart" label="起始期号" style={{ width: '50%' }}>
              <Input placeholder="可选" />
            </Form.Item>
            <Form.Item name="issueEnd" label="结束期号" style={{ width: '50%' }}>
              <Input placeholder="可选" />
            </Form.Item>
          </Space.Compact>
        </Form>
      </Modal>
    </LifePageShell>
  );
};

export default LotteryBacktestPage;
