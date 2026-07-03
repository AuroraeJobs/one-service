import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, TrophyOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import { lotteryTicketApi, type LotteryTicket, type LotteryTicketSummary } from '../services/api';
import './LotteryOverviewPage.css';

const formatMoney = (value?: number) => {
  if (value === undefined || value === null) {
    return '-';
  }
  return `¥${Number(value).toFixed(2)}`;
};

const formatPrizeAmount = (value?: number) => {
  if (!value) {
    return '¥0.00';
  }
  return `¥${(Number(value) / 100).toFixed(2)}`;
};

interface TicketFormValues {
  issue?: string;
  redNumbers?: string;
  blueNumber?: string;
  quantity?: number;
  cost?: number;
  source?: string;
  status?: string;
  note?: string;
}

const splitNumbers = (value?: string) =>
  (value || '')
    .split(/[\s,，]+/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => item.padStart(2, '0'));

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

const statusLabel = (status?: string) => {
  const value = status || 'UNKNOWN';
  const labels: Record<string, string> = {
    DRAFT: '草稿',
    BOUGHT: '已购买',
    CHECKED: '已兑奖',
    VOID: '作废',
    UNKNOWN: '未知'
  };
  return labels[value] || value;
};

const statusColor = (status?: string) => {
  if (status === 'CHECKED') {
    return 'blue';
  }
  if (status === 'BOUGHT') {
    return 'green';
  }
  if (status === 'VOID') {
    return 'default';
  }
  return 'gold';
};

const emptySummary: LotteryTicketSummary = {
  ticketCount: 0,
  checkedTicketCount: 0,
  pendingTicketCount: 0,
  winningTicketCount: 0,
  totalCost: 0,
  totalPrizeAmount: 0,
  statusDistribution: {},
  prizeDistribution: {}
};

const LotteryTicketPage = () => {
  const [form] = Form.useForm<TicketFormValues>();
  const [tickets, setTickets] = useState<LotteryTicket[]>([]);
  const [summary, setSummary] = useState<LotteryTicketSummary>(emptySummary);
  const [issue, setIssue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();
  const [sourceFilter, setSourceFilter] = useState<string>();
  const [prizeGradeFilter, setPrizeGradeFilter] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<LotteryTicket>();
  const [error, setError] = useState<string>();

  const queryParams = useMemo(() => ({
    issue: issue.trim() || undefined,
    status: statusFilter,
    source: sourceFilter,
    prizeGrade: prizeGradeFilter
  }), [issue, prizeGradeFilter, sourceFilter, statusFilter]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [ticketItems, ticketSummary] = await Promise.all([
        lotteryTicketApi.tickets(queryParams),
        lotteryTicketApi.summary()
      ]);
      setTickets(ticketItems);
      setSummary(ticketSummary || emptySummary);
    } catch (requestError) {
      console.error('获取彩票票据失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '获取彩票票据失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const openCreateModal = useCallback(() => {
    setEditingTicket(undefined);
    form.resetFields();
    form.setFieldsValue({
      issue: issue.trim() || undefined,
      quantity: 1,
      source: 'MANUAL',
      status: 'DRAFT'
    });
    setModalOpen(true);
  }, [form, issue]);

  const openEditModal = (ticket: LotteryTicket) => {
    setEditingTicket(ticket);
    form.setFieldsValue({
      issue: ticket.issue,
      redNumbers: ticket.redNumbers?.join(' '),
      blueNumber: ticket.blueNumber,
      quantity: ticket.quantity || 1,
      cost: ticket.cost,
      source: ticket.source || 'MANUAL',
      status: ticket.status || 'DRAFT',
      note: ticket.note
    });
    setModalOpen(true);
  };

  const saveTicket = async () => {
    const values = await form.validateFields();
    const redNumbers = splitNumbers(values.redNumbers);
    if (redNumbers.length !== 6) {
      setError('请输入 6 个红球号码');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      const payload = {
        issue: values.issue?.trim(),
        redNumbers,
        blueNumber: values.blueNumber?.trim().padStart(2, '0'),
        quantity: values.quantity,
        cost: values.cost,
        source: values.source,
        status: values.status,
        note: values.note?.trim() || undefined
      };
      if (editingTicket?.id) {
        await lotteryTicketApi.updateTicket(editingTicket.id, payload);
      } else {
        await lotteryTicketApi.saveTicket(payload);
      }
      setModalOpen(false);
      setEditingTicket(undefined);
      await loadTickets();
    } catch (requestError) {
      console.error('保存彩票票据失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '保存彩票票据失败');
    } finally {
      setSaving(false);
    }
  };

  const deleteTicket = async (id?: string) => {
    if (!id) {
      return;
    }
    setError(undefined);
    try {
      await lotteryTicketApi.deleteTicket(id);
      await loadTickets();
    } catch (requestError) {
      console.error('删除彩票票据失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '删除彩票票据失败');
    }
  };

  const columns: ColumnsType<LotteryTicket> = [
    {
      title: '期号',
      dataIndex: 'issue',
      key: 'issue',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <strong>{record.issue || record.period || '-'}</strong>
          <span className="stock-quote-code">{record.source || 'MANUAL'}</span>
        </Space>
      )
    },
    {
      title: '号码',
      key: 'numbers',
      render: (_, record) => <LotteryBalls redNumbers={record.redNumbers || []} blueNumber={record.blueNumber || ''} />
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: value => <Tag color={statusColor(value)}>{statusLabel(value)}</Tag>
    },
    {
      title: '数量/成本',
      key: 'cost',
      align: 'right',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.quantity || 1} 注</span>
          <strong>{formatMoney(record.cost)}</strong>
        </Space>
      )
    },
    {
      title: '兑奖',
      key: 'prize',
      render: (_, record) => record.prizeResult ? (
        <Space direction="vertical" size={0}>
          <Tag color={record.prizeResult.winning ? 'blue' : 'default'}>{record.prizeResult.prizeName || record.prizeGrade}</Tag>
          <span className="stock-quote-code">红 {record.prizeResult.redHits ?? '-'}/6 · {record.prizeResult.blueHit ? '蓝中' : '蓝未中'}</span>
        </Space>
      ) : <Tag>待开奖</Tag>
    },
    {
      title: '更新',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: value => formatTime(value)
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm title="删除票据？" okText="删除" cancelText="取消" onConfirm={() => deleteTicket(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="我的彩票"
      actions={
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新增票据
          </Button>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="按期号筛选"
            value={issue}
            onChange={event => setIssue(event.target.value)}
            style={{ width: 180 }}
          />
          <Select
            allowClear
            placeholder="状态"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            options={[
              { label: '草稿', value: 'DRAFT' },
              { label: '已购买', value: 'BOUGHT' },
              { label: '已兑奖', value: 'CHECKED' },
              { label: '作废', value: 'VOID' }
            ]}
          />
          <Select
            allowClear
            placeholder="来源"
            value={sourceFilter}
            onChange={setSourceFilter}
            style={{ width: 120 }}
            options={[
              { label: '手动', value: 'MANUAL' },
              { label: '预测', value: 'PREDICTION' }
            ]}
          />
          <Select
            allowClear
            placeholder="奖级"
            value={prizeGradeFilter}
            onChange={setPrizeGradeFilter}
            style={{ width: 130 }}
            options={[
              { label: '一等奖', value: 'FIRST' },
              { label: '二等奖', value: 'SECOND' },
              { label: '三等奖', value: 'THIRD' },
              { label: '四等奖', value: 'FOURTH' },
              { label: '五等奖', value: 'FIFTH' },
              { label: '六等奖', value: 'SIXTH' },
              { label: '未中奖', value: 'NONE' }
            ]}
          />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadTickets}>
            刷新
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <section className="lottery-history-summary-grid">
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <TrophyOutlined />
            <div>
              <strong>{summary.ticketCount || 0}</strong>
              <span>票据数量</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <TrophyOutlined />
            <div>
              <strong>{summary.winningTicketCount || 0}</strong>
              <span>中奖票据</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <TrophyOutlined />
            <div>
              <strong>{formatMoney(summary.totalCost)}</strong>
              <span>总成本</span>
            </div>
          </div>
        </Card>
        <Card className="life-panel-card lottery-clean-panel">
          <div className="lottery-history-summary-item">
            <TrophyOutlined />
            <div>
              <strong>{formatPrizeAmount(summary.totalPrizeAmount)}</strong>
              <span>已开奖金</span>
            </div>
          </div>
        </Card>
      </section>

      <Card className="life-panel-card">
        <Table
          rowKey={record => record.id || `${record.issue}-${record.blueNumber}-${record.createdAt}`}
          columns={columns}
          dataSource={tickets}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 920 }}
        />
      </Card>

      <Modal
        title={editingTicket ? '编辑票据' : '新增票据'}
        open={modalOpen}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        onOk={saveTicket}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="issue" label="期号" rules={[{ required: true, message: '请输入期号' }]}>
            <Input placeholder="例如 2026001" />
          </Form.Item>
          <Form.Item name="redNumbers" label="红球" rules={[{ required: true, message: '请输入红球号码' }]}>
            <Input placeholder="例如 03 05 16 18 29 32" />
          </Form.Item>
          <Form.Item name="blueNumber" label="蓝球" rules={[{ required: true, message: '请输入蓝球号码' }]}>
            <Input placeholder="例如 07" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="quantity" label="注数" style={{ width: '50%' }}>
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="cost" label="成本" style={{ width: '50%' }}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item name="source" label="来源" style={{ width: '50%' }}>
              <Select
                options={[
                  { label: '手动', value: 'MANUAL' },
                  { label: '预测', value: 'PREDICTION' }
                ]}
              />
            </Form.Item>
            <Form.Item name="status" label="状态" style={{ width: '50%' }}>
              <Select
                options={[
                  { label: '草稿', value: 'DRAFT' },
                  { label: '已购买', value: 'BOUGHT' },
                  { label: '已兑奖', value: 'CHECKED' },
                  { label: '作废', value: 'VOID' }
                ]}
              />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} placeholder="可记录购买渠道、想法或组合来源" />
          </Form.Item>
        </Form>
      </Modal>
    </LifePageShell>
  );
};

export default LotteryTicketPage;
