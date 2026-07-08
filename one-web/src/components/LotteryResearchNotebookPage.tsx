import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Input, Select, Space, Spin, Tag, message } from 'antd';
import {
  AuditOutlined,
  BookOutlined,
  CompassOutlined,
  FileAddOutlined,
  LinkOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import {
  lotteryStrategyNoteApi,
  type LotteryPageResponse,
  type LotteryStrategyNote,
  type LotteryStrategyNoteEvidence
} from '../services/api';
import { lotteryStatusLabel } from '../utils/lotteryStatusLabel';
import './LotteryOverviewPage.css';

const statusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: '草稿', value: 'DRAFT' },
  { label: '验证中', value: 'ACTIVE' },
  { label: '已验证', value: 'VALIDATED' },
  { label: '已放弃', value: 'REJECTED' }
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

const evidenceFromQuery = (searchParams: URLSearchParams): LotteryStrategyNoteEvidence | undefined => {
  const evidenceKey = searchParams.get('evidenceKey') || '';
  if (!evidenceKey) {
    return undefined;
  }
  return {
    evidenceKey,
    evidenceType: searchParams.get('evidenceType') || 'EVIDENCE',
    title: searchParams.get('evidenceTitle') || evidenceKey,
    sourceId: searchParams.get('sourceId') || undefined,
    path: searchParams.get('path') || undefined
  };
};

const LotteryResearchNotebookPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [response, setResponse] = useState<LotteryPageResponse<LotteryStrategyNote>>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [title, setTitle] = useState(searchParams.get('title') || '');
  const [hypothesis, setHypothesis] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [ruleName, setRuleName] = useState('');
  const [targetIssue, setTargetIssue] = useState(searchParams.get('targetIssue') || '');

  const status = searchParams.get('status') || 'ALL';
  const pendingEvidence = useMemo(() => evidenceFromQuery(searchParams), [searchParams]);
  const isArchiveReviewEvidence = pendingEvidence?.evidenceType === 'ARCHIVE_REVIEW';
  const pendingEvidenceSourceLabel = pendingEvidence?.sourceId === 'workbench'
    ? '工作台'
    : pendingEvidence?.sourceId === 'governance'
      ? '治理看板'
      : pendingEvidence?.sourceId === 'all'
        ? '全部归档'
        : pendingEvidence?.sourceId || '归档复核';
  const notes = response?.items || [];

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await lotteryStrategyNoteApi.notes({
        page: 1,
        pageSize: 30,
        status: status === 'ALL' ? undefined : status
      });
      setResponse(data);
    } catch (requestError) {
      console.error('读取彩票策略笔记失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票策略笔记失败');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const updateStatus = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'ALL') {
      next.delete('status');
    } else {
      next.set('status', value);
    }
    setSearchParams(next);
  };

  const clearPendingEvidence = () => {
    const next = new URLSearchParams(searchParams);
    ['evidenceKey', 'evidenceType', 'evidenceTitle', 'sourceId', 'path', 'title', 'targetIssue'].forEach(key => next.delete(key));
    setSearchParams(next);
  };

  const createNote = async () => {
    if (!title.trim()) {
      message.warning('请输入策略笔记标题');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await lotteryStrategyNoteApi.create({
        title: title.trim(),
        hypothesis: hypothesis.trim() || undefined,
        expectedBehavior: expectedBehavior.trim() || undefined,
        ruleName: ruleName.trim() || undefined,
        targetIssue: targetIssue.trim() || undefined,
        status: 'ACTIVE',
        tags: [ruleName.trim(), targetIssue.trim()].filter(Boolean),
        evidence: pendingEvidence ? [pendingEvidence] : []
      });
      setTitle('');
      setHypothesis('');
      setExpectedBehavior('');
      setRuleName('');
      setTargetIssue('');
      clearPendingEvidence();
      await loadNotes();
      message.success('策略笔记已创建');
    } catch (requestError) {
      console.error('创建彩票策略笔记失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '创建彩票策略笔记失败');
      message.error('创建策略笔记失败');
    } finally {
      setSaving(false);
    }
  };

  const attachToNote = async (noteId?: string) => {
    if (!noteId || !pendingEvidence) {
      return;
    }
    try {
      await lotteryStrategyNoteApi.attachEvidence(noteId, pendingEvidence);
      clearPendingEvidence();
      await loadNotes();
      message.success('证据已挂载');
    } catch (requestError) {
      console.error('挂载策略笔记证据失败:', requestError);
      message.error('挂载证据失败');
    }
  };

  const archiveNote = async (noteId?: string) => {
    if (!noteId) {
      return;
    }
    try {
      await lotteryStrategyNoteApi.archive(noteId);
      await loadNotes();
      message.success('策略笔记已归档');
    } catch (requestError) {
      console.error('归档彩票策略笔记失败:', requestError);
      message.error('归档策略笔记失败');
    }
  };

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-research-notebook-page"
      eyebrow="彩票数据"
      title="策略笔记"
      actions={
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadNotes}>刷新</Button>
          <Button icon={<SafetyCertificateOutlined />} onClick={() => navigate('/lottery/research')}>研究对比</Button>
          <Button icon={<CompassOutlined />} onClick={() => navigate('/lottery/recommendations')}>推荐</Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      {pendingEvidence ? (
        isArchiveReviewEvidence ? (
          <Card
            className="life-panel-card lottery-clean-panel lottery-notebook-pending-evidence"
            title={<Space><AuditOutlined />归档复核证据待挂载</Space>}
            extra={<Tag color="gold">{pendingEvidenceSourceLabel}</Tag>}
          >
            <div>
              <strong>{pendingEvidence.title || pendingEvidence.evidenceKey}</strong>
              <span>{pendingEvidence.evidenceKey}</span>
            </div>
            <Space wrap>
              {pendingEvidence.path ? (
                <Button size="small" icon={<LinkOutlined />} onClick={() => navigate(pendingEvidence.path || '/lottery/exports')}>
                  查看证据
                </Button>
              ) : null}
              <Button size="small" onClick={clearPendingEvidence}>清除</Button>
            </Space>
          </Card>
        ) : (
          <Alert
            className="lottery-overview-status-alert"
            type="info"
            showIcon
            message={`待挂载证据：${pendingEvidence.title || pendingEvidence.evidenceKey}`}
          />
        )
      ) : null}

      <Card className="life-panel-card lottery-clean-panel lottery-notebook-editor">
        <Input allowClear placeholder="策略笔记标题" value={title} onChange={event => setTitle(event.target.value)} />
        <Input.TextArea rows={3} placeholder="规则假设" value={hypothesis} onChange={event => setHypothesis(event.target.value)} />
        <Input.TextArea rows={2} placeholder="预期表现或验证口径" value={expectedBehavior} onChange={event => setExpectedBehavior(event.target.value)} />
        <div className="lottery-notebook-editor-row">
          <Input allowClear placeholder="规则名称" value={ruleName} onChange={event => setRuleName(event.target.value)} />
          <Input allowClear placeholder="目标期号" value={targetIssue} onChange={event => setTargetIssue(event.target.value)} />
          <Button type="primary" icon={<FileAddOutlined />} loading={saving} onClick={createNote}>创建笔记</Button>
        </div>
      </Card>

      <Card className="life-panel-card lottery-clean-panel">
        <Space wrap>
          <Select value={status} options={statusOptions} onChange={updateStatus} style={{ width: 140 }} />
          <Tag color="blue">笔记 {response?.total || notes.length}</Tag>
          {pendingEvidence ? <Tag color="gold">待挂载证据</Tag> : null}
        </Space>
      </Card>

      <Spin spinning={loading}>
        {notes.length ? (
          <section className="lottery-notebook-grid">
            {notes.map(note => (
              <article key={note.id || note.title} className="lottery-notebook-card">
                <div className="lottery-notebook-card-head">
                  <div>
                    <Tag color={note.status === 'ACTIVE' ? 'blue' : note.status === 'VALIDATED' ? 'green' : 'default'}>{lotteryStatusLabel(note.status, 'DRAFT')}</Tag>
                    <strong>{note.title || '策略笔记'}</strong>
                    <span>{note.ruleName || '未绑定规则'} · 第 {note.targetIssue || '-'} 期 · {formatTime(note.updatedAt || note.createdAt)}</span>
                  </div>
                  <BookOutlined />
                </div>
                <p>{note.hypothesis || '暂无规则假设'}</p>
                <small>{note.expectedBehavior || '暂无验证口径'}</small>
                <div className="lottery-notebook-evidence-list">
                  {(note.evidence || []).slice(0, 4).map(item => (
                    <button key={item.evidenceKey || item.title} type="button" onClick={() => item.path && navigate(item.path)}>
                      <Tag>{item.evidenceType || 'EVIDENCE'}</Tag>
                      <span>{item.title || item.evidenceKey}</span>
                    </button>
                  ))}
                  {(note.evidence || []).length === 0 ? <span>暂无证据</span> : null}
                </div>
                <Space wrap>
                  {pendingEvidence ? (
                    <Button size="small" icon={<LinkOutlined />} onClick={() => attachToNote(note.id)}>挂载证据</Button>
                  ) : null}
                  <Button size="small" danger onClick={() => archiveNote(note.id)}>归档</Button>
                </Space>
              </article>
            ))}
          </section>
        ) : (
          <Card className="life-panel-card lottery-clean-panel">
            <Empty description="暂无策略笔记" />
          </Card>
        )}
      </Spin>
    </LifePageShell>
  );
};

export default LotteryResearchNotebookPage;
