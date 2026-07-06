import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Input, Popconfirm, Select, Space, Spin, Tag, message } from 'antd';
import {
  CheckCircleOutlined,
  FileAddOutlined,
  ImportOutlined,
  MobileOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import {
  lotteryWorkbenchApi,
  lotteryTicketPackApi,
  type LotteryTicketPack,
  type LotteryTicketPackItem
} from '../services/api';
import { lotteryCodeLabel, lotteryStatusLabel } from '../utils/lotteryStatusLabel';
import './LotteryOverviewPage.css';

const defaultTicketText = '01 06 11 18 25 31 + 09\n03 08 14 19 26 32 + 12';

const statusColor = (status?: string) => {
  if (status === 'SAVED') return 'green';
  if (status === 'APPROVED') return 'blue';
  if (status === 'ARCHIVED') return 'default';
  return 'gold';
};

const budgetColor = (status?: string) => {
  if (status === 'OK') return 'green';
  if (status === 'OVER') return 'red';
  if (status === 'WARNING') return 'gold';
  return 'default';
};

const parseItems = (value: string): LotteryTicketPackItem[] => value
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean)
  .map(line => line.match(/\d{1,2}/g) || [])
  .filter(numbers => numbers.length >= 7)
  .map((numbers, index) => ({
    key: `manual-${index}`,
    title: `候选 ${index + 1}`,
    redNumbers: numbers.slice(0, 6).map(number => number.padStart(2, '0')),
    blueNumber: numbers[6].padStart(2, '0'),
    quantity: 1,
    cost: 2,
    source: 'TICKET_PACK',
    note: '票包候选'
  }));

const formatMoney = (value?: number) => value === undefined || value === null ? '-' : `¥${Number(value).toFixed(2)}`;
const formatTime = (value?: number) => value ? new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value)) : '-';

const actionCopy = {
  approve: { title: '审批票包？', okText: '审批', success: '票包已审批' },
  save: { title: '保存为票据？', okText: '保存', success: '票包已保存为票据' },
  archive: { title: '归档票包？', okText: '归档', success: '票包已归档' }
};

const LotteryTicketPackPage = () => {
  const navigate = useNavigate();
  const [packs, setPacks] = useState<LotteryTicketPack[]>([]);
  const [preview, setPreview] = useState<LotteryTicketPack>();
  const [title, setTitle] = useState('执行票包');
  const [titleTouched, setTitleTouched] = useState(false);
  const [targetIssue, setTargetIssue] = useState('');
  const [sourceType, setSourceType] = useState('MANUAL');
  const [sourceId, setSourceId] = useState('');
  const [ticketText, setTicketText] = useState(defaultTicketText);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string>();
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState<string>();
  const [autoIssue, setAutoIssue] = useState<string>();

  const draftItems = useMemo(() => sourceType === 'DECISION_SET' ? [] : parseItems(ticketText), [sourceType, ticketText]);
  const normalizedTargetIssue = targetIssue.trim();
  const suggestedTitle = normalizedTargetIssue ? `${normalizedTargetIssue} 执行票包` : '执行票包';

  const loadPacks = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await lotteryTicketPackApi.ticketPacks({ includeArchived: showArchived, page: 1, pageSize: 50 });
      setPacks(response.items || []);
    } catch (requestError) {
      console.error('读取彩票票包失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票票包失败');
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    loadPacks();
  }, [loadPacks]);

  useEffect(() => {
    let cancelled = false;
    lotteryWorkbenchApi.summary()
      .then(summary => {
        if (cancelled) {
          return;
        }
        const nextIssue = summary?.dailyState?.nextIssue;
        if (nextIssue) {
          setAutoIssue(nextIssue);
          setTargetIssue(current => current || nextIssue);
        }
      })
      .catch(requestError => {
        console.error('读取票包默认期号失败:', requestError);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (normalizedTargetIssue && !titleTouched) {
      setTitle(suggestedTitle);
    }
  }, [normalizedTargetIssue, suggestedTitle, titleTouched]);

  const draftPayload = (): Partial<LotteryTicketPack> => ({
    title: title.trim() || suggestedTitle,
    targetIssue: normalizedTargetIssue,
    sourceType,
    sourceId: sourceId || undefined,
    items: draftItems
  });

  const previewPack = async () => {
    setActionLoading('preview');
    setError(undefined);
    try {
      const response = await lotteryTicketPackApi.preview(draftPayload());
      setPreview(response);
      message.success('票包预览已生成');
    } catch (requestError) {
      console.error('预览彩票票包失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '预览彩票票包失败');
      message.error('预览彩票票包失败');
    } finally {
      setActionLoading(undefined);
    }
  };

  const createPack = async () => {
    setActionLoading('create');
    setError(undefined);
    try {
      const saved = await lotteryTicketPackApi.create(preview || draftPayload());
      setPreview(undefined);
      await loadPacks();
      message.success(`票包草稿已创建：${saved.title || title || suggestedTitle}`);
    } catch (requestError) {
      console.error('创建彩票票包失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '创建彩票票包失败');
      message.error('创建彩票票包失败');
    } finally {
      setActionLoading(undefined);
    }
  };

  const runPackAction = async (pack: LotteryTicketPack, action: 'approve' | 'save' | 'archive') => {
    if (!pack.id) {
      return;
    }
    setActionLoading(`${action}-${pack.id}`);
    try {
      if (action === 'approve') {
        await lotteryTicketPackApi.approve(pack.id);
        message.success(`${pack.title || pack.targetIssue || '票包'} 已审批`);
      } else if (action === 'save') {
        const saved = await lotteryTicketPackApi.saveAsTickets(pack.id);
        message.success(`已保存为票据：${saved.savedTicketIds?.length || saved.items?.length || 0} 注`);
      } else {
        await lotteryTicketPackApi.archive(pack.id);
        message.success(`${pack.title || pack.targetIssue || '票包'} 已归档`);
      }
      await loadPacks();
    } catch (requestError) {
      console.error('执行彩票票包动作失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '执行彩票票包动作失败');
      message.error('执行彩票票包动作失败');
    } finally {
      setActionLoading(undefined);
    }
  };

  const pendingCount = packs.filter(pack => pack.approvalState !== 'APPROVED' && pack.status !== 'SAVED').length;
  const approvedCount = packs.filter(pack => pack.approvalState === 'APPROVED').length;
  const savedCount = packs.filter(pack => pack.status === 'SAVED').length;

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-ticket-pack-page"
      eyebrow="彩票数据"
      title="票包执行"
      actions={
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={loadPacks} loading={loading}>刷新</Button>
          <Button icon={<MobileOutlined />} onClick={() => navigate('/lottery/mobile')}>移动指挥</Button>
          <Button type="primary" icon={<FileAddOutlined />} loading={actionLoading === 'create'} onClick={createPack}>保存草稿</Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}

      <section className="lottery-ticket-pack-summary">
        <article><strong>{packs.length}</strong><span>票包</span></article>
        <article><strong>{pendingCount}</strong><span>待审批</span></article>
        <article><strong>{approvedCount}</strong><span>已审批</span></article>
        <article><strong>{savedCount}</strong><span>已保存</span></article>
      </section>

      <section className="lottery-ticket-pack-grid">
        <Card className="life-panel-card lottery-clean-panel" title={<Space><ImportOutlined />生成草稿</Space>}>
          <div className="lottery-ticket-pack-form">
            <label>
              <span>标题</span>
              <Input
                value={title}
                onChange={event => {
                  setTitleTouched(true);
                  setTitle(event.target.value);
                }}
              />
            </label>
            <label>
              <span>目标期号</span>
              <Input
                value={targetIssue}
                onChange={event => setTargetIssue(event.target.value)}
                placeholder="例如 2026068"
                addonAfter={autoIssue ? <Button type="link" size="small" onClick={() => setTargetIssue(autoIssue)}>下一期</Button> : null}
              />
            </label>
            <label>
              <span>来源</span>
              <Select
                value={sourceType}
                onChange={setSourceType}
                options={[
                  { label: '手动候选', value: 'MANUAL' },
                  { label: '决策集', value: 'DECISION_SET' },
                  { label: '沙盘', value: 'SIMULATION' },
                  { label: '组合', value: 'PORTFOLIO' }
                ]}
              />
            </label>
            <label><span>来源 ID</span><Input value={sourceId} onChange={event => setSourceId(event.target.value)} placeholder="决策集/沙盘/组合 ID" /></label>
          </div>
          {sourceType === 'DECISION_SET' ? (
            <Alert className="lottery-overview-status-alert" type="info" showIcon message="填写决策集 ID 后，后端会从已保存候选生成票包。" />
          ) : (
            <Input.TextArea
              value={ticketText}
              onChange={event => setTicketText(event.target.value)}
              autoSize={{ minRows: 6, maxRows: 12 }}
              placeholder="每行一注，例如 01 06 11 18 25 31 + 09"
            />
          )}
          <Space wrap className="lottery-ticket-pack-actions">
            <Button icon={<SafetyCertificateOutlined />} loading={actionLoading === 'preview'} onClick={previewPack}>预检</Button>
            <Button type="primary" icon={<FileAddOutlined />} loading={actionLoading === 'create'} onClick={createPack}>保存草稿</Button>
            <Button onClick={() => navigate('/lottery/workbench')}>工作台</Button>
          </Space>
        </Card>

        <Card className="life-panel-card lottery-clean-panel" title={<Space><SafetyCertificateOutlined />预检结果</Space>}>
          {preview ? (
            <div className="lottery-ticket-pack-preview">
              <div className="lottery-ticket-pack-budget-row">
                <Tag color={budgetColor(preview.budgetPrecheck?.status)}>{lotteryStatusLabel(preview.budgetPrecheck?.status)}</Tag>
                <strong>{formatMoney(preview.budgetPrecheck?.proposedCost)}</strong>
                <span>{preview.items?.length || 0} 注</span>
              </div>
              {preview.warnings?.length ? <Alert type="warning" showIcon message={preview.warnings.join('；')} /> : null}
              <div className="lottery-ticket-pack-item-list">
                {(preview.items || []).length ? preview.items.map(item => (
                  <article key={item.key || `${item.redNumbers.join('-')}-${item.blueNumber}`}>
                    <LotteryBalls redNumbers={item.redNumbers || []} blueNumber={item.blueNumber || ''} />
                    <Space wrap>
                      <Tag>{item.source || 'TICKET_PACK'}</Tag>
                      <Tag color="blue">{formatMoney(item.cost)}</Tag>
                    </Space>
                  </article>
                )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可执行票据" />}
              </div>
            </div>
          ) : <Empty description="暂无票包预检" />}
        </Card>
      </section>

      <Card
        className="life-panel-card lottery-clean-panel"
        title={<Space><SaveOutlined />执行队列</Space>}
        extra={<Button size="small" onClick={() => setShowArchived(value => !value)}>{showArchived ? '隐藏归档' : '显示归档'}</Button>}
      >
        <Spin spinning={loading}>
          <div className="lottery-ticket-pack-list">
            {packs.length ? packs.map(pack => (
              <article key={pack.id}>
                <div className="lottery-ticket-pack-head">
                  <div>
                    <strong>{pack.title || pack.id}</strong>
                    <span>{pack.targetIssue || '-'} · {lotteryCodeLabel(pack.sourceType, 'MANUAL')} · 更新 {formatTime(pack.updatedAt)}</span>
                  </div>
                  <Space wrap>
                    <Tag color={statusColor(pack.status)}>{lotteryStatusLabel(pack.status, 'DRAFT')}</Tag>
                    <Tag color={pack.approvalState === 'APPROVED' ? 'green' : 'gold'}>{lotteryStatusLabel(pack.approvalState, 'PENDING')}</Tag>
                    <Tag color={budgetColor(pack.budgetPrecheck?.status)}>{lotteryStatusLabel(pack.budgetPrecheck?.status)}</Tag>
                  </Space>
                </div>
                {pack.warnings?.length ? <Alert type="warning" showIcon message={pack.warnings.join('；')} /> : null}
                <div className="lottery-ticket-pack-mini-list">
                  {(pack.items || []).slice(0, 4).map(item => (
                    <LotteryBalls key={item.key || `${item.redNumbers.join('-')}-${item.blueNumber}`} redNumbers={item.redNumbers || []} blueNumber={item.blueNumber || ''} />
                  ))}
                </div>
                <Space wrap>
                  <Popconfirm
                    title={actionCopy.approve.title}
                    description={`${pack.targetIssue || '-'} · ${(pack.items || []).length} 注，审批后才能保存为票据。`}
                    okText={actionCopy.approve.okText}
                    cancelText="取消"
                    onConfirm={() => runPackAction(pack, 'approve')}
                  >
                    <Button size="small" icon={<CheckCircleOutlined />} loading={actionLoading === `approve-${pack.id}`} disabled={pack.approvalState === 'APPROVED' || pack.status === 'SAVED'}>审批</Button>
                  </Popconfirm>
                  <Popconfirm
                    title={actionCopy.save.title}
                    description={`${pack.targetIssue || '-'} · ${(pack.items || []).length} 注，保存后会进入票据列表。`}
                    okText={actionCopy.save.okText}
                    cancelText="取消"
                    onConfirm={() => runPackAction(pack, 'save')}
                  >
                    <Button size="small" type="primary" icon={<SaveOutlined />} loading={actionLoading === `save-${pack.id}`} disabled={pack.approvalState !== 'APPROVED' || pack.status === 'SAVED'}>保存票据</Button>
                  </Popconfirm>
                  <Button size="small" onClick={() => navigate(`/lottery/tickets?issue=${pack.targetIssue || ''}&source=TICKET_PACK`)}>票据</Button>
                  <Popconfirm
                    title={actionCopy.archive.title}
                    description="归档后默认不再显示在执行队列。"
                    okText={actionCopy.archive.okText}
                    cancelText="取消"
                    onConfirm={() => runPackAction(pack, 'archive')}
                  >
                    <Button size="small" danger loading={actionLoading === `archive-${pack.id}`} disabled={pack.status === 'ARCHIVED'}>归档</Button>
                  </Popconfirm>
                </Space>
              </article>
            )) : <Empty description="暂无票包草稿" />}
          </div>
        </Spin>
      </Card>
    </LifePageShell>
  );
};

export default LotteryTicketPackPage;
