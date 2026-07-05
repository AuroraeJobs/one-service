import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Key } from 'react';
import { Alert, Button, Card, Checkbox, Empty, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BranchesOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  HistoryOutlined,
  LinkOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import LotteryBalls from './lottery/LotteryBalls';
import {
  lotteryBudgetApi,
  lotteryDecisionSetApi,
  lotteryLedgerApi,
  lotteryTicketApi,
  type LotteryBudgetStatus,
  type LotteryDecisionOutcomeSummary,
  type LotteryIssueLedger,
  type LotteryPageResponse,
  type LotteryTicket,
  type LotteryTicketBatchSaveResult,
  type LotteryTicketBudgetPrecheckResult,
  type LotteryTicketImportPreviewResult,
  type LotteryTicketPrizeCheckSummary,
  type LotteryTicketSummary
} from '../services/api';
import { lotteryViewStateKeys, useLotterySavedViewState } from '../utils/lotteryViewState';
import './LotteryOverviewPage.css';

const ticketViewKeys = ['page', 'pageSize', 'issue', 'predictionSnapshotId', 'status', 'source', 'prizeGrade'];

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

interface BulkTicketPreviewRow {
  key: string;
  lineNumber: number;
  raw: string;
  issue?: string;
  redNumbers: string[];
  blueNumber?: string;
  status: 'VALID' | 'INVALID' | 'DUPLICATE_EXISTING' | 'DUPLICATE_REQUEST';
  messages: string[];
  ticket?: Partial<LotteryTicket>;
}

interface IssueTimelineRow {
  issue: string;
  ticketCount: number;
  predictionCount: number;
  sourceDistribution: Record<string, number>;
  checkedCount: number;
  pendingCount: number;
  winningCount: number;
  totalCost: number;
  totalPrize: number;
  netResult: number;
  roiPercent: number;
  latestUpdatedAt?: number;
}

interface BudgetExposureRow {
  key: string;
  label: string;
  scope: 'ISSUE' | 'MONTH';
  ticketCount: number;
  totalCost: number;
  warning?: string;
  usagePercent?: number;
}

interface SettlementReview {
  issue: string;
  tickets: LotteryTicket[];
  ledger?: LotteryIssueLedger;
  ticketCount: number;
  checkedCount: number;
  pendingCount: number;
  winningCount: number;
  totalCost: number;
  totalPrize: number;
  netResult: number;
  roiPercent: number;
  predictionCount: number;
  sourceDistribution: Record<string, number>;
}

const splitNumbers = (value?: string) =>
  (value || '')
    .split(/[\s,，]+/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => item.padStart(2, '0'));

const normalizeBallNumber = (value?: string) => {
  if (!value || !/^\d+$/.test(value)) {
    return '';
  }
  return String(Number(value)).padStart(2, '0');
};

const ticketDuplicateKey = (ticket?: Pick<LotteryTicket, 'issue' | 'redNumbers' | 'blueNumber'>) => {
  const issue = ticket?.issue?.trim();
  const redNumbers = ticket?.redNumbers || [];
  const blueNumber = ticket?.blueNumber?.trim();
  if (!issue || redNumbers.length !== 6 || !blueNumber) {
    return undefined;
  }
  const normalizedRed = [...redNumbers]
    .map(item => normalizeBallNumber(item))
    .filter(Boolean)
    .sort((left, right) => Number(left) - Number(right));
  if (normalizedRed.length !== 6) {
    return undefined;
  }
  return `${issue}|${normalizedRed.join(',')}|${normalizeBallNumber(blueNumber)}`;
};

const parseBulkTicketRows = (
  text: string,
  defaultIssue: string,
  existingTicketKeys: Set<string>
): BulkTicketPreviewRow[] => {
  const seenKeys = new Set<string>();
  return text
    .split(/\r?\n/)
    .map((raw, index): BulkTicketPreviewRow | undefined => {
      const line = raw.trim();
      if (!line) {
        return undefined;
      }
      const tokens: string[] = Array.from(line.matchAll(/\d+/g), match => match[0]);
      const messages: string[] = [];
      let issue = defaultIssue.trim();
      let numberTokens: string[] = tokens;
      if (tokens.length >= 8 && (tokens[0] || '').length >= 5) {
        issue = tokens[0] || '';
        numberTokens = tokens.slice(1);
      } else if (tokens.length >= 9 && (tokens[0] || '').length === 4 && (tokens[1] || '').length <= 3) {
        issue = `${tokens[0] || ''}${(tokens[1] || '').padStart(3, '0')}`;
        numberTokens = tokens.slice(2);
      }
      if (numberTokens.length > 7) {
        messages.push('已忽略第 7 个之后的额外号码');
      }
      const redNumbers = numberTokens.slice(0, 6).map(normalizeBallNumber).filter(Boolean);
      const blueNumber = normalizeBallNumber(numberTokens[6]);
      if (!issue) {
        messages.push('缺少期号，可先在页面筛选期号或每行带期号');
      }
      if (redNumbers.length !== 6 || !blueNumber) {
        messages.push('需要 6 个红球和 1 个蓝球');
      }
      const redSet = new Set(redNumbers);
      if (redSet.size !== redNumbers.length) {
        messages.push('红球不能重复');
      }
      const redOutOfRange = redNumbers.some(item => Number(item) < 1 || Number(item) > 33);
      if (redOutOfRange) {
        messages.push('红球范围应为 01-33');
      }
      if (blueNumber && (Number(blueNumber) < 1 || Number(blueNumber) > 16)) {
        messages.push('蓝球范围应为 01-16');
      }
      const normalizedRed = [...redNumbers].sort((left, right) => Number(left) - Number(right));
      const ticket = issue && normalizedRed.length === 6 && blueNumber ? {
        issue,
        redNumbers: normalizedRed,
        blueNumber,
        quantity: 1,
        cost: 2,
        source: 'MANUAL',
        status: 'DRAFT',
        note: '批量导入'
      } : undefined;
      const duplicateKey = ticketDuplicateKey(ticket);
      let status: BulkTicketPreviewRow['status'] = messages.length ? 'INVALID' : 'VALID';
      if (!messages.length && duplicateKey) {
        if (existingTicketKeys.has(duplicateKey)) {
          status = 'DUPLICATE_EXISTING';
          messages.push('已有相同票据');
        } else if (seenKeys.has(duplicateKey)) {
          status = 'DUPLICATE_REQUEST';
          messages.push('本次粘贴内重复');
        } else {
          seenKeys.add(duplicateKey);
        }
      }
      return {
        key: `${index}-${line}`,
        lineNumber: index + 1,
        raw: line,
        issue,
        redNumbers: normalizedRed,
        blueNumber,
        status,
        messages,
        ticket
      };
    })
    .filter(Boolean) as BulkTicketPreviewRow[];
};

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

const previewStatusLabel = (status: BulkTicketPreviewRow['status']) => {
  const labels: Record<BulkTicketPreviewRow['status'], string> = {
    VALID: '可保存',
    INVALID: '需修正',
    DUPLICATE_EXISTING: '已存在',
    DUPLICATE_REQUEST: '本次重复'
  };
  return labels[status];
};

const previewStatusColor = (status: BulkTicketPreviewRow['status']) => {
  if (status === 'VALID') {
    return 'green';
  }
  if (status === 'INVALID') {
    return 'red';
  }
  return 'gold';
};

const normalizePreviewStatus = (status?: string): BulkTicketPreviewRow['status'] => {
  if (status === 'VALID' || status === 'INVALID' || status === 'DUPLICATE_EXISTING' || status === 'DUPLICATE_REQUEST') {
    return status;
  }
  return 'INVALID';
};

const budgetPrecheckMessages = (result?: LotteryTicketBudgetPrecheckResult) =>
  (result?.warnings || []).map(item => item.message).filter(Boolean).join('；');

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

const issueKey = (ticket: LotteryTicket) => ticket.issue || (ticket.period ? String(ticket.period) : '');

const buildIssueTimelineRows = (
  allTickets: LotteryTicket[],
  issueLedgers: LotteryIssueLedger[]
): IssueTimelineRow[] => {
  const ledgerByIssue = new Map<string, LotteryIssueLedger>();
  issueLedgers.forEach(ledger => {
    const issue = ledger.issue || (ledger.period ? String(ledger.period) : '');
    if (issue) {
      ledgerByIssue.set(issue, ledger);
    }
  });
  const grouped = new Map<string, IssueTimelineRow>();
  allTickets.forEach(ticket => {
    const issue = issueKey(ticket);
    if (!issue) {
      return;
    }
    const current = grouped.get(issue) || {
      issue,
      ticketCount: 0,
      predictionCount: 0,
      sourceDistribution: {},
      checkedCount: 0,
      pendingCount: 0,
      winningCount: 0,
      totalCost: 0,
      totalPrize: 0,
      netResult: 0,
      roiPercent: 0,
      latestUpdatedAt: undefined
    };
    current.ticketCount += 1;
    current.predictionCount += ticket.predictionSnapshotId ? 1 : 0;
    const source = ticket.source || 'MANUAL';
    current.sourceDistribution[source] = (current.sourceDistribution[source] || 0) + 1;
    current.checkedCount += ticket.status === 'CHECKED' ? 1 : 0;
    current.pendingCount += ticket.status === 'CHECKED' ? 0 : 1;
    current.winningCount += ticket.prizeResult?.winning ? 1 : 0;
    current.totalCost += Number(ticket.cost || 0);
    current.totalPrize += Number(ticket.prizeResult?.prizeAmount || 0) / 100;
    current.latestUpdatedAt = Math.max(current.latestUpdatedAt || 0, ticket.updatedAt || ticket.createdAt || 0);
    grouped.set(issue, current);
  });
  issueLedgers.forEach(ledger => {
    const issue = ledger.issue || (ledger.period ? String(ledger.period) : '');
    if (!issue || grouped.has(issue)) {
      return;
    }
    grouped.set(issue, {
      issue,
      ticketCount: ledger.ticketCount || 0,
      predictionCount: 0,
      sourceDistribution: {},
      checkedCount: ledger.checkedTicketCount || 0,
      pendingCount: ledger.pendingTicketCount || 0,
      winningCount: ledger.winningTicketCount || 0,
      totalCost: Number(ledger.totalCost || 0),
      totalPrize: Number(ledger.totalPrize || 0),
      netResult: Number(ledger.netResult || 0),
      roiPercent: Number(ledger.roiPercent || 0)
    });
  });
  return Array.from(grouped.values())
    .map(row => {
      const ledger = ledgerByIssue.get(row.issue);
      const totalCost = Number(ledger?.totalCost ?? row.totalCost ?? 0);
      const totalPrize = Number(ledger?.totalPrize ?? row.totalPrize ?? 0);
      return {
        ...row,
        ticketCount: ledger?.ticketCount ?? row.ticketCount,
        checkedCount: ledger?.checkedTicketCount ?? row.checkedCount,
        pendingCount: ledger?.pendingTicketCount ?? row.pendingCount,
        winningCount: ledger?.winningTicketCount ?? row.winningCount,
        totalCost,
        totalPrize,
        netResult: Number(ledger?.netResult ?? (totalPrize - totalCost)),
        roiPercent: Number(ledger?.roiPercent ?? (totalCost ? ((totalPrize - totalCost) * 100) / totalCost : 0))
      };
    })
    .sort((left, right) => right.issue.localeCompare(left.issue))
    .slice(0, 8);
};

const buildBudgetExposureRows = (
  allTickets: LotteryTicket[],
  budgetStatus?: LotteryBudgetStatus
): BudgetExposureRow[] => {
  const issueGroups = new Map<string, BudgetExposureRow>();
  const monthGroups = new Map<string, BudgetExposureRow>();
  allTickets.forEach(ticket => {
    const issue = issueKey(ticket);
    const cost = Number(ticket.cost || 0);
    if (issue) {
      const current = issueGroups.get(issue) || {
        key: `issue-${issue}`,
        label: `第 ${issue} 期`,
        scope: 'ISSUE' as const,
        ticketCount: 0,
        totalCost: 0
      };
      current.ticketCount += 1;
      current.totalCost += cost;
      issueGroups.set(issue, current);
    }
    const month = ticket.createdAt ? new Date(ticket.createdAt).toISOString().slice(0, 7) : '';
    if (month) {
      const current = monthGroups.get(month) || {
        key: `month-${month}`,
        label: month,
        scope: 'MONTH' as const,
        ticketCount: 0,
        totalCost: 0
      };
      current.ticketCount += 1;
      current.totalCost += cost;
      monthGroups.set(month, current);
    }
  });

  const maxTickets = budgetStatus?.maxTicketsPerIssue || 0;
  const monthlyBudget = budgetStatus?.monthlyBudget || 0;
  const issueRows = Array.from(issueGroups.values())
    .sort((left, right) => right.label.localeCompare(left.label))
    .slice(0, 4)
    .map(row => ({
      ...row,
      usagePercent: maxTickets ? (row.ticketCount * 100) / maxTickets : undefined,
      warning: maxTickets && row.ticketCount >= maxTickets ? `达到单期上限 ${maxTickets} 注` : undefined
    }));
  const monthRows = Array.from(monthGroups.values())
    .sort((left, right) => right.label.localeCompare(left.label))
    .slice(0, 2)
    .map(row => ({
      ...row,
      usagePercent: monthlyBudget ? (row.totalCost * 100) / monthlyBudget : undefined,
      warning: monthlyBudget && row.totalCost >= monthlyBudget ? `达到月预算 ${formatMoney(monthlyBudget)}` : undefined
    }));
  return [...issueRows, ...monthRows];
};

const buildSettlementReview = (
  activeIssue: string,
  allTickets: LotteryTicket[],
  issueLedgers: LotteryIssueLedger[]
): SettlementReview | undefined => {
  if (!activeIssue) {
    return undefined;
  }
  const tickets = allTickets.filter(ticket => issueKey(ticket) === activeIssue);
  const ledger = issueLedgers.find(row => row.issue === activeIssue || String(row.period || '') === activeIssue);
  if (!tickets.length && !ledger) {
    return undefined;
  }
  const sourceDistribution: Record<string, number> = {};
  tickets.forEach(ticket => {
    const source = ticket.source || 'MANUAL';
    sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
  });
  const totalCost = Number(ledger?.totalCost ?? tickets.reduce((sum, ticket) => sum + Number(ticket.cost || 0), 0));
  const totalPrize = Number(ledger?.totalPrize ?? tickets.reduce((sum, ticket) => sum + Number(ticket.prizeResult?.prizeAmount || 0) / 100, 0));
  const netResult = Number(ledger?.netResult ?? (totalPrize - totalCost));
  return {
    issue: activeIssue,
    tickets,
    ledger,
    ticketCount: ledger?.ticketCount ?? tickets.length,
    checkedCount: ledger?.checkedTicketCount ?? tickets.filter(ticket => ticket.status === 'CHECKED').length,
    pendingCount: ledger?.pendingTicketCount ?? tickets.filter(ticket => ticket.status !== 'CHECKED').length,
    winningCount: ledger?.winningTicketCount ?? tickets.filter(ticket => ticket.prizeResult?.winning).length,
    totalCost,
    totalPrize,
    netResult,
    roiPercent: Number(ledger?.roiPercent ?? (totalCost ? (netResult * 100) / totalCost : 0)),
    predictionCount: tickets.filter(ticket => ticket.predictionSnapshotId).length,
    sourceDistribution
  };
};

const LotteryTicketPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<TicketFormValues>();
  const [tickets, setTickets] = useState<LotteryTicket[]>([]);
  const [allTickets, setAllTickets] = useState<LotteryTicket[]>([]);
  const [pageResponse, setPageResponse] = useState<LotteryPageResponse<LotteryTicket>>();
  const [summary, setSummary] = useState<LotteryTicketSummary>(emptySummary);
  const [issueLedgers, setIssueLedgers] = useState<LotteryIssueLedger[]>([]);
  const [decisionOutcomeSummary, setDecisionOutcomeSummary] = useState<LotteryDecisionOutcomeSummary>();
  const [budgetStatus, setBudgetStatus] = useState<LotteryBudgetStatus>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingLatest, setCheckingLatest] = useState(false);
  const [latestCheckSummary, setLatestCheckSummary] = useState<LotteryTicketPrizeCheckSummary>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<LotteryTicket>();
  const [error, setError] = useState<string>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [batchStatus, setBatchStatus] = useState<string>();
  const [batchSource, setBatchSource] = useState<string>();
  const [batchIssue, setBatchIssue] = useState('');
  const [batchQuantity, setBatchQuantity] = useState<number>();
  const [batchCost, setBatchCost] = useState<number>();
  const [batchNote, setBatchNote] = useState('');
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkReferenceLoading, setBulkReferenceLoading] = useState(false);
  const [bulkReferenceTickets, setBulkReferenceTickets] = useState<LotteryTicket[]>([]);
  const [bulkPreviewLoading, setBulkPreviewLoading] = useState(false);
  const [bulkPreviewResult, setBulkPreviewResult] = useState<LotteryTicketImportPreviewResult>();
  const [bulkImportResult, setBulkImportResult] = useState<LotteryTicketBatchSaveResult>();

  useLotterySavedViewState(lotteryViewStateKeys.tickets, searchParams, setSearchParams, ticketViewKeys);

  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1);
  const pageSize = Math.max(1, Number(searchParams.get('pageSize') || '10') || 10);
  const issue = searchParams.get('issue') || '';
  const predictionSnapshotId = searchParams.get('predictionSnapshotId') || '';
  const statusFilter = searchParams.get('status') || undefined;
  const sourceFilter = searchParams.get('source') || undefined;
  const prizeGradeFilter = searchParams.get('prizeGrade') || undefined;

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

  const queryParams = useMemo(() => ({
    issue: issue.trim() || undefined,
    status: statusFilter,
    source: sourceFilter,
    prizeGrade: prizeGradeFilter,
    predictionSnapshotId: predictionSnapshotId.trim() || undefined,
    page,
    pageSize
  }), [issue, page, pageSize, predictionSnapshotId, prizeGradeFilter, sourceFilter, statusFilter]);

  const selectedTicketKeys = useMemo(() => new Set(selectedRowKeys.map(String)), [selectedRowKeys]);
  const selectedTickets = useMemo(
    () => tickets.filter(ticket => ticket.id && selectedTicketKeys.has(ticket.id)),
    [selectedTicketKeys, tickets]
  );
  const existingTicketKeys = useMemo(() => new Set(
    (bulkReferenceTickets.length ? bulkReferenceTickets : allTickets)
      .map(ticketDuplicateKey)
      .filter(Boolean) as string[]
  ), [allTickets, bulkReferenceTickets]);
  const localBulkPreviewRows = useMemo(
    () => parseBulkTicketRows(bulkText, issue, existingTicketKeys),
    [bulkText, existingTicketKeys, issue]
  );
  const bulkPreviewRows = useMemo(() => {
    if (!bulkPreviewResult) {
      return localBulkPreviewRows;
    }
    return (bulkPreviewResult.rows || []).map((row, index) => ({
      key: row.key || `${row.lineNumber || index}-${row.raw || ''}`,
      lineNumber: row.lineNumber || index + 1,
      raw: row.raw || '',
      issue: row.issue,
      redNumbers: row.redNumbers || [],
      blueNumber: row.blueNumber,
      status: normalizePreviewStatus(row.status),
      messages: row.messages || [],
      ticket: row.ticket
    }));
  }, [bulkPreviewResult, localBulkPreviewRows]);
  const validBulkPreviewRows = useMemo(
    () => bulkPreviewRows.filter(row => row.status === 'VALID' && row.ticket),
    [bulkPreviewRows]
  );
  const issueTimelineRows = useMemo(
    () => buildIssueTimelineRows(allTickets, issueLedgers),
    [allTickets, issueLedgers]
  );
  const budgetExposureRows = useMemo(
    () => buildBudgetExposureRows(allTickets, budgetStatus),
    [allTickets, budgetStatus]
  );
  const activeSettlementIssue = issue.trim() || latestCheckSummary?.issue || issueTimelineRows[0]?.issue || '';
  const settlementReview = useMemo(
    () => buildSettlementReview(activeSettlementIssue, allTickets, issueLedgers),
    [activeSettlementIssue, allTickets, issueLedgers]
  );
  const settlementDecisionSummary = useMemo(() => {
    const rows = (decisionOutcomeSummary?.items || []).filter(item => item.targetIssue === activeSettlementIssue);
    return {
      rows,
      candidates: rows.flatMap(item => (item.candidates || []).map(candidate => ({
        ...candidate,
        decisionSetId: item.decisionSetId,
        decisionTitle: item.title,
        targetIssue: item.targetIssue
      }))),
      candidateCount: rows.reduce((sum, item) => sum + Number(item.candidateCount || 0), 0),
      winningCandidateCount: rows.reduce((sum, item) => sum + Number(item.winningCandidateCount || 0), 0),
      convertedTicketCount: rows.reduce((sum, item) => sum + Number(item.convertedTicketCount || 0), 0),
      netResult: rows.reduce((sum, item) => sum + Number(item.netResult || 0), 0),
      warningCount: rows.reduce((sum, item) => sum + Number(item.warningCount || 0), 0)
    };
  }, [activeSettlementIssue, decisionOutcomeSummary?.items]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [ticketItems, ticketSummary, budgetData, issueRows, allTicketRows, decisionOutcomes] = await Promise.all([
        lotteryTicketApi.ticketsPage(queryParams),
        lotteryTicketApi.summary(),
        lotteryBudgetApi.status(),
        lotteryLedgerApi.issues(),
        lotteryTicketApi.tickets(),
        lotteryDecisionSetApi.outcomes({ limit: 30 })
      ]);
      setPageResponse(ticketItems);
      setTickets(ticketItems.items || []);
      setAllTickets(allTicketRows || ticketItems.items || []);
      setSummary(ticketSummary || emptySummary);
      setBudgetStatus(budgetData);
      setIssueLedgers(issueRows || []);
      setDecisionOutcomeSummary(decisionOutcomes);
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

  useEffect(() => {
    const currentIds = new Set(tickets.map(ticket => ticket.id).filter(Boolean) as string[]);
    setSelectedRowKeys(keys => keys.filter(key => currentIds.has(String(key))));
  }, [tickets]);

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

  const checkLatestPrizes = async () => {
    setCheckingLatest(true);
    setError(undefined);
    try {
      const result = await lotteryTicketApi.checkLatestPrizes();
      setLatestCheckSummary(result);
      await loadTickets();
    } catch (requestError) {
      console.error('按最新开奖记录核奖失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '按最新开奖记录核奖失败');
    } finally {
      setCheckingLatest(false);
    }
  };

  const clearPredictionSnapshotFilter = () => {
    updateQuery({ predictionSnapshotId: undefined });
  };

  const openBulkImportModal = async () => {
    setBulkModalOpen(true);
    setBulkText('');
    setBulkPreviewResult(undefined);
    setBulkImportResult(undefined);
    setBulkReferenceTickets(allTickets);
    setBulkReferenceLoading(true);
    try {
      const referenceTickets = await lotteryTicketApi.tickets();
      setBulkReferenceTickets(referenceTickets || []);
    } catch (requestError) {
      console.warn('读取已有票据用于重复预览失败:', requestError);
      setBulkReferenceTickets(allTickets);
    } finally {
      setBulkReferenceLoading(false);
    }
  };

  const previewBulkTickets = async () => {
    if (!bulkText.trim()) {
      message.warning('请先粘贴票据内容');
      return undefined;
    }
    setBulkPreviewLoading(true);
    setError(undefined);
    try {
      const result = await lotteryTicketApi.importPreview({
        content: bulkText,
        defaultIssue: issue.trim() || undefined,
        defaultQuantity: 1,
        defaultCost: 2,
        defaultSource: 'MANUAL',
        defaultStatus: 'DRAFT',
        note: '批量导入'
      });
      setBulkPreviewResult(result);
      setBulkImportResult(undefined);
      return result;
    } catch (requestError) {
      console.error('预览批量导入票据失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '预览批量导入票据失败');
      message.error('预览批量导入票据失败');
      return undefined;
    } finally {
      setBulkPreviewLoading(false);
    }
  };

  const saveBulkTickets = async () => {
    const preview = bulkPreviewResult || await previewBulkTickets();
    if (!preview) {
      return;
    }
    const payload = (preview.rows || [])
      .filter(row => row.status === 'VALID' && row.ticket)
      .map(row => row.ticket)
      .filter(Boolean) as Partial<LotteryTicket>[];
    if (!payload.length) {
      message.warning('没有可保存的票据');
      return;
    }
    setBulkSaving(true);
    setError(undefined);
    try {
      const result = await lotteryTicketApi.saveTickets(payload);
      setBulkImportResult(result);
      message.success(`已保存 ${result.savedCount || 0} 注，跳过重复 ${result.duplicateCount || 0} 注`);
      const warnings = budgetPrecheckMessages(result.budgetPrecheck);
      if (warnings) {
        message.warning(warnings);
      }
      await loadTickets();
      const referenceTickets = await lotteryTicketApi.tickets();
      setBulkReferenceTickets(referenceTickets || []);
      setBulkPreviewResult(undefined);
    } catch (requestError) {
      console.error('批量保存彩票票据失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '批量保存彩票票据失败');
      message.error('批量保存彩票票据失败');
    } finally {
      setBulkSaving(false);
    }
  };

  const updateSelectedTickets = async () => {
    if (!selectedTickets.length) {
      message.warning('请先选择票据');
      return;
    }
    const trimmedNote = batchNote.trim();
    const trimmedIssue = batchIssue.trim();
    if (!batchStatus && !batchSource && !trimmedIssue && batchQuantity === undefined && batchCost === undefined && !trimmedNote) {
      message.warning('请选择要批量更新的期号、注数、成本、状态、来源或备注');
      return;
    }
    setBatchSaving(true);
    setError(undefined);
    try {
      const result = await lotteryTicketApi.bulkUpdateTickets({
        ids: selectedTickets.map(ticket => ticket.id).filter(Boolean) as string[],
        issue: trimmedIssue || undefined,
        quantity: batchQuantity,
        cost: batchCost,
        status: batchStatus,
        source: batchSource,
        note: trimmedNote || undefined
      });
      message.success(`已更新 ${result.updatedCount || 0} 注票据`);
      setBatchStatus(undefined);
      setBatchSource(undefined);
      setBatchIssue('');
      setBatchQuantity(undefined);
      setBatchCost(undefined);
      setBatchNote('');
      await loadTickets();
    } catch (requestError) {
      console.error('批量更新彩票票据失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '批量更新彩票票据失败');
      message.error('批量更新彩票票据失败');
    } finally {
      setBatchSaving(false);
    }
  };

  const archiveSelectedTickets = async () => {
    if (!selectedTickets.length) {
      message.warning('请先选择票据');
      return;
    }
    setBatchDeleting(true);
    setError(undefined);
    try {
      const result = await lotteryTicketApi.archiveTickets(selectedTickets.map(ticket => ticket.id).filter(Boolean) as string[]);
      message.success(`已归档 ${result.archivedCount || 0} 注票据`);
      setSelectedRowKeys([]);
      await loadTickets();
    } catch (requestError) {
      console.error('归档彩票票据失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '归档彩票票据失败');
      message.error('归档彩票票据失败');
    } finally {
      setBatchDeleting(false);
    }
  };

  const deleteSelectedTickets = async () => {
    if (!selectedTickets.length) {
      message.warning('请先选择票据');
      return;
    }
    setBatchDeleting(true);
    setError(undefined);
    try {
      const result = await lotteryTicketApi.deleteTickets(selectedTickets.map(ticket => ticket.id).filter(Boolean) as string[]);
      message.success(`已删除 ${result.deletedCount || 0} 注票据`);
      setSelectedRowKeys([]);
      await loadTickets();
    } catch (requestError) {
      console.error('批量删除彩票票据失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '批量删除彩票票据失败');
      message.error('批量删除彩票票据失败');
    } finally {
      setBatchDeleting(false);
    }
  };

  const toggleTicketSelection = (ticket: LotteryTicket, checked: boolean) => {
    if (!ticket.id) {
      return;
    }
    setSelectedRowKeys(keys => {
      if (checked) {
        return keys.includes(ticket.id as Key) ? keys : [...keys, ticket.id as Key];
      }
      return keys.filter(key => key !== ticket.id);
    });
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
          {record.predictionSnapshotId ? (
            <Button
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => navigate(`/lottery/predictions/${record.predictionSnapshotId}`)}
            />
          ) : null}
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm title="删除票据？" okText="删除" cancelText="取消" onConfirm={() => deleteTicket(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const bulkPreviewColumns: ColumnsType<BulkTicketPreviewRow> = [
    {
      title: '行',
      dataIndex: 'lineNumber',
      key: 'lineNumber',
      width: 56
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 104,
      render: value => <Tag color={previewStatusColor(value)}>{previewStatusLabel(value)}</Tag>
    },
    {
      title: '期号',
      dataIndex: 'issue',
      key: 'issue',
      width: 110,
      render: value => value || '-'
    },
    {
      title: '号码',
      key: 'numbers',
      render: (_, record) => (
        record.redNumbers.length && record.blueNumber
          ? <LotteryBalls redNumbers={record.redNumbers} blueNumber={record.blueNumber} />
          : <span className="stock-quote-code">{record.raw}</span>
      )
    },
    {
      title: '提示',
      key: 'messages',
      render: (_, record) => (
        <span className="stock-quote-code">{record.messages.length ? record.messages.join('；') : '格式正常'}</span>
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
          <Button icon={<FileAddOutlined />} onClick={openBulkImportModal}>
            批量导入
          </Button>
          <Button icon={<TrophyOutlined />} loading={checkingLatest} onClick={checkLatestPrizes}>
            最新核奖
          </Button>
          <Button icon={<BranchesOutlined />} onClick={() => navigate(`/lottery/outcomes${issue ? `?issue=${issue}` : ''}`)}>
            归因
          </Button>
          <div className="lottery-filter-preset-bar">
            <Button size="small" onClick={() => updateQuery({ status: 'BOUGHT', prizeGrade: undefined })}>待核</Button>
            <Button size="small" onClick={() => updateQuery({ status: 'CHECKED', prizeGrade: undefined })}>已核</Button>
            <Button size="small" onClick={() => updateQuery({ status: 'CHECKED', prizeGrade: 'NONE' })}>未中</Button>
            <Button size="small" onClick={() => updateQuery({ source: 'TICKET_PACK' })}>票包</Button>
            <Button size="small" onClick={() => updateQuery({ status: undefined, source: undefined, prizeGrade: undefined, predictionSnapshotId: undefined })}>清除</Button>
          </div>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="按期号筛选"
            value={issue}
            onChange={event => updateQuery({ issue: event.target.value })}
            style={{ width: 180 }}
          />
          <Input
            allowClear
            prefix={<HistoryOutlined />}
            placeholder="预测快照"
            value={predictionSnapshotId}
            onChange={event => updateQuery({ predictionSnapshotId: event.target.value })}
            style={{ width: 190 }}
          />
          <Select
            allowClear
            placeholder="状态"
            value={statusFilter}
            onChange={value => updateQuery({ status: value })}
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
            onChange={value => updateQuery({ source: value })}
            style={{ width: 120 }}
            options={[
              { label: '手动', value: 'MANUAL' },
              { label: '预测', value: 'PREDICTION' },
              { label: '票包', value: 'TICKET_PACK' }
            ]}
          />
          <Select
            allowClear
            placeholder="奖级"
            value={prizeGradeFilter}
            onChange={value => updateQuery({ prizeGrade: value })}
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
      {latestCheckSummary ? (
        <Alert
          className="lottery-overview-status-alert"
          type="success"
          showIcon
          message={`第 ${latestCheckSummary.issue || '-'} 期已核奖 ${latestCheckSummary.checkedTicketCount || 0} 注，中奖 ${latestCheckSummary.winningTicketCount || 0} 注，奖金 ${formatPrizeAmount(latestCheckSummary.totalPrizeAmount)}`}
        />
      ) : null}
      {latestCheckSummary ? (
        <div className="lottery-ticket-prize-check-card">
          <span>核奖期号<strong>{latestCheckSummary.issue || '-'}</strong></span>
          <span>已核验<strong>{latestCheckSummary.checkedTicketCount || 0}</strong></span>
          <span>中奖<strong>{latestCheckSummary.winningTicketCount || 0}</strong></span>
          <span>奖金<strong>{formatPrizeAmount(latestCheckSummary.totalPrizeAmount)}</strong></span>
        </div>
      ) : null}
      {predictionSnapshotId.trim() ? (
        <Alert
          className="lottery-overview-status-alert"
          type="info"
          showIcon
          message={`正在查看预测快照 ${predictionSnapshotId.trim()} 的票据`}
          action={<Button size="small" onClick={clearPredictionSnapshotFilter}>清除</Button>}
        />
      ) : null}
      {budgetStatus?.warnings?.length ? (
        <Alert
          className="lottery-overview-status-alert"
          type="warning"
          showIcon
          message={budgetStatus.warnings.map(item => item.message).join('；')}
          action={<Button size="small" onClick={() => navigate('/lottery/settings')}>预算设置</Button>}
        />
      ) : null}
      <section className="lottery-ticket-budget-grid">
        {budgetExposureRows.map(row => (
          <article key={row.key} className={row.warning ? 'is-warning' : ''}>
            <div>
              <Tag color={row.scope === 'ISSUE' ? 'blue' : 'purple'}>{row.scope === 'ISSUE' ? '期号' : '月份'}</Tag>
              <strong>{row.label}</strong>
            </div>
            <span>票据 {row.ticketCount} 注 · 成本 {formatMoney(row.totalCost)}</span>
            {row.usagePercent !== undefined ? (
              <small>使用率 {Math.min(999, Number(row.usagePercent)).toFixed(1)}%</small>
            ) : null}
            {row.warning ? <em>{row.warning}</em> : null}
          </article>
        ))}
        {budgetExposureRows.length === 0 ? (
          <article>
            <div>
              <Tag>预算</Tag>
              <strong>暂无暴露</strong>
            </div>
            <span>还没有可汇总的票据成本</span>
          </article>
        ) : null}
      </section>
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

      <Card
        className="life-panel-card"
        title={<Space><HistoryOutlined />期号时间线</Space>}
        extra={<Button size="small" icon={<LinkOutlined />} onClick={() => navigate('/lottery/ledger')}>账本</Button>}
      >
        {issueTimelineRows.length ? (
          <div className="lottery-ticket-timeline">
            {issueTimelineRows.map(row => (
              <article className="lottery-ticket-timeline-row" key={row.issue}>
                <div>
                  <strong>第 {row.issue} 期</strong>
                  <span>{formatTime(row.latestUpdatedAt)} 更新</span>
                </div>
                <div className="lottery-ticket-timeline-metrics">
                  <span><small>票据</small><strong>{row.ticketCount}</strong></span>
                  <span><small>预测关联</small><strong>{row.predictionCount}</strong></span>
                  <span><small>已核/待核</small><strong>{row.checkedCount}/{row.pendingCount}</strong></span>
                  <span><small>中奖</small><strong>{row.winningCount}</strong></span>
                  <span><small>净结果</small><strong>{formatMoney(row.netResult)}</strong></span>
                  <span><small>ROI</small><strong>{Number(row.roiPercent || 0).toFixed(2)}%</strong></span>
                </div>
                <Space wrap>
                  <Button size="small" onClick={() => updateQuery({ issue: row.issue })}>看票据</Button>
                  <Button size="small" icon={<LinkOutlined />} onClick={() => navigate('/lottery/ledger')}>账本</Button>
                </Space>
              </article>
            ))}
          </div>
        ) : (
          <div className="lottery-ticket-empty-line">暂无可汇总的期号票据</div>
        )}
      </Card>

      <Card
        className="life-panel-card lottery-ticket-settlement-card lottery-report-print-area"
        title={<Space><CheckCircleOutlined />期号结算复盘</Space>}
        extra={settlementReview ? (
          <Space wrap>
            <Tag color={settlementReview.pendingCount ? 'gold' : 'green'}>第 {settlementReview.issue} 期</Tag>
            <Button size="small" icon={<PrinterOutlined />} onClick={() => window.print()}>打印</Button>
          </Space>
        ) : null}
      >
        {settlementReview ? (
          <div className="lottery-ticket-settlement">
            <div className="lottery-ticket-settlement-metrics">
              <span><small>票据</small><strong>{settlementReview.ticketCount}</strong></span>
              <span><small>已核/待核</small><strong>{settlementReview.checkedCount}/{settlementReview.pendingCount}</strong></span>
              <span><small>中奖</small><strong>{settlementReview.winningCount}</strong></span>
              <span><small>预测来源</small><strong>{settlementReview.predictionCount}</strong></span>
              <span><small>决策候选</small><strong>{settlementDecisionSummary.candidateCount}</strong></span>
              <span><small>净结果</small><strong>{formatMoney(settlementReview.netResult)}</strong></span>
              <span><small>ROI</small><strong>{Number(settlementReview.roiPercent || 0).toFixed(2)}%</strong></span>
            </div>
            <div className="lottery-ticket-settlement-sources">
              {Object.entries(settlementReview.sourceDistribution).map(([source, count]) => (
                <Tag key={source}>{source} {count}</Tag>
              ))}
              {latestCheckSummary?.issue === settlementReview.issue ? (
                <Tag color="blue">最近核验 {latestCheckSummary.checkedTicketCount || 0}</Tag>
              ) : null}
              {settlementDecisionSummary.rows.length ? (
                <>
                  <Tag color="magenta">决策集 {settlementDecisionSummary.rows.length}</Tag>
                  <Tag color={settlementDecisionSummary.warningCount ? 'gold' : 'green'}>
                    决策命中 {settlementDecisionSummary.winningCandidateCount}/{settlementDecisionSummary.candidateCount}
                  </Tag>
                  <Tag color="purple">决策转票 {settlementDecisionSummary.convertedTicketCount}</Tag>
                  <Tag color={settlementDecisionSummary.netResult >= 0 ? 'blue' : 'default'}>
                    决策净 {formatMoney(settlementDecisionSummary.netResult)}
                  </Tag>
                </>
              ) : null}
            </div>
            <div className="lottery-ticket-settlement-list">
              {settlementReview.tickets.slice(0, 6).map(ticket => (
                <article key={ticket.id || `${ticket.issue}-${ticket.blueNumber}-${ticket.createdAt}`}>
                  <div>
                    <strong>{ticket.source || 'MANUAL'}</strong>
                    <Tag color={statusColor(ticket.status)}>{statusLabel(ticket.status)}</Tag>
                  </div>
                  <LotteryBalls redNumbers={ticket.redNumbers || []} blueNumber={ticket.blueNumber || ''} />
                  <span>{ticket.prizeResult?.prizeName || ticket.prizeGrade || '待开奖'} · {formatMoney(ticket.cost)}</span>
                </article>
              ))}
            </div>
            {settlementDecisionSummary.candidates.length ? (
              <div className="lottery-ticket-decision-drilldown">
                {settlementDecisionSummary.candidates.slice(0, 6).map(candidate => (
                  <article key={`${candidate.decisionSetId || candidate.decisionTitle}-${candidate.candidateKey || candidate.candidateTitle}`}>
                    <div>
                      <strong>{candidate.candidateTitle || '决策候选'}</strong>
                      <Tag color={candidate.winningTicketCount ? 'blue' : candidate.convertedTicketCount ? 'green' : 'default'}>
                        {candidate.prizeName || '待开奖'}
                      </Tag>
                    </div>
                    <LotteryBalls redNumbers={candidate.redNumbers || []} blueNumber={candidate.blueNumber || ''} />
                    <span>
                      红 {candidate.redHits ?? '-'}/6 · {candidate.blueHit ? '蓝中' : '蓝未中'} · 净 {formatMoney(candidate.netResult)}
                    </span>
                    <Space wrap>
                      <Button
                        size="small"
                        icon={<LinkOutlined />}
                        onClick={() => navigate(`/lottery/predictions/decision?targetIssue=${encodeURIComponent(candidate.targetIssue || activeSettlementIssue)}`)}
                      >
                        决策
                      </Button>
                      <Button size="small" onClick={() => updateQuery({ issue: candidate.targetIssue || activeSettlementIssue })}>
                        票据
                      </Button>
                    </Space>
                  </article>
                ))}
              </div>
            ) : settlementDecisionSummary.rows.length ? (
              <div className="lottery-ticket-empty-line">当前决策集暂无候选明细</div>
            ) : null}
          </div>
        ) : (
          <Empty description="选择期号后查看结算复盘" />
        )}
      </Card>

      <Card className="life-panel-card">
        <div className="lottery-ticket-batch-toolbar">
          <Space wrap>
            <Tag color={selectedTickets.length ? 'blue' : 'default'}>已选 {selectedTickets.length} 注</Tag>
            <Input
              allowClear
              placeholder="批量期号"
              value={batchIssue}
              onChange={event => setBatchIssue(event.target.value)}
              style={{ width: 132 }}
            />
            <InputNumber
              min={1}
              placeholder="注数"
              value={batchQuantity}
              onChange={value => setBatchQuantity(value ?? undefined)}
              style={{ width: 96 }}
            />
            <InputNumber
              min={0}
              placeholder="成本"
              value={batchCost}
              onChange={value => setBatchCost(value ?? undefined)}
              style={{ width: 104 }}
            />
            <Select
              allowClear
              placeholder="批量状态"
              value={batchStatus}
              onChange={setBatchStatus}
              style={{ width: 132 }}
              options={[
                { label: '草稿', value: 'DRAFT' },
                { label: '已购买', value: 'BOUGHT' },
                { label: '已兑奖', value: 'CHECKED' },
                { label: '作废', value: 'VOID' }
              ]}
            />
            <Select
              allowClear
              placeholder="批量来源"
              value={batchSource}
              onChange={setBatchSource}
              style={{ width: 132 }}
              options={[
                { label: '手动', value: 'MANUAL' },
                { label: '预测', value: 'PREDICTION' }
              ]}
            />
            <Input
              allowClear
              placeholder="批量备注"
              value={batchNote}
              onChange={event => setBatchNote(event.target.value)}
              style={{ width: 220 }}
            />
            <Button
              icon={<CheckCircleOutlined />}
              loading={batchSaving}
              disabled={!selectedTickets.length}
              onClick={updateSelectedTickets}
            >
              更新选中
            </Button>
            <Popconfirm
              title={`归档选中的 ${selectedTickets.length} 注票据？`}
              okText="归档"
              cancelText="取消"
              disabled={!selectedTickets.length}
              onConfirm={archiveSelectedTickets}
            >
              <Button icon={<HistoryOutlined />} loading={batchDeleting} disabled={!selectedTickets.length}>
                归档选中
              </Button>
            </Popconfirm>
            <Popconfirm
              title={`删除选中的 ${selectedTickets.length} 注票据？`}
              okText="删除"
              cancelText="取消"
              disabled={!selectedTickets.length}
              onConfirm={deleteSelectedTickets}
            >
              <Button danger icon={<DeleteOutlined />} loading={batchDeleting} disabled={!selectedTickets.length}>
                删除选中
              </Button>
            </Popconfirm>
          </Space>
        </div>
        <Table
          className="lottery-ticket-desktop-table"
          rowKey={record => record.id || `${record.issue}-${record.blueNumber}-${record.createdAt}`}
          rowSelection={{
            selectedRowKeys,
            onChange: nextKeys => setSelectedRowKeys(nextKeys)
          }}
          columns={columns}
          dataSource={tickets}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total: pageResponse?.total || 0,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (nextPage, nextPageSize) => updateQuery({ page: nextPage, pageSize: nextPageSize }, false)
          }}
          scroll={{ x: 920 }}
        />
        <div className="lottery-ticket-mobile-list">
          {tickets.map(ticket => (
            <article className="lottery-ticket-mobile-card" key={ticket.id || `${ticket.issue}-${ticket.blueNumber}-${ticket.createdAt}`}>
              <div className="lottery-ticket-mobile-card-head">
                <Checkbox
                  checked={ticket.id ? selectedTicketKeys.has(ticket.id) : false}
                  disabled={!ticket.id}
                  onChange={event => toggleTicketSelection(ticket, event.target.checked)}
                />
                <div>
                  <strong>第 {ticket.issue || ticket.period || '-'} 期</strong>
                  <span>{ticket.source || 'MANUAL'} · {formatTime(ticket.updatedAt || ticket.createdAt)}</span>
                </div>
                <Tag color={statusColor(ticket.status)}>{statusLabel(ticket.status)}</Tag>
              </div>
              <LotteryBalls redNumbers={ticket.redNumbers || []} blueNumber={ticket.blueNumber || ''} />
              <div className="lottery-ticket-mobile-stats">
                <span><small>注数</small><strong>{ticket.quantity || 1}</strong></span>
                <span><small>成本</small><strong>{formatMoney(ticket.cost)}</strong></span>
                <span><small>兑奖</small><strong>{ticket.prizeResult?.prizeName || ticket.prizeGrade || '待开奖'}</strong></span>
                <span><small>命中</small><strong>{ticket.prizeResult ? `红 ${ticket.prizeResult.redHits ?? '-'}/蓝${ticket.prizeResult.blueHit ? '中' : '未中'}` : '-'}</strong></span>
              </div>
              {ticket.note ? <p>{ticket.note}</p> : null}
              <Space wrap>
                {ticket.predictionSnapshotId ? (
                  <Button size="small" icon={<HistoryOutlined />} onClick={() => navigate(`/lottery/predictions/${ticket.predictionSnapshotId}`)}>
                    预测
                  </Button>
                ) : null}
                <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(ticket)}>编辑</Button>
                <Popconfirm title="删除票据？" okText="删除" cancelText="取消" onConfirm={() => deleteTicket(ticket.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              </Space>
            </article>
          ))}
        </div>
      </Card>

      <Modal
        title="批量导入票据"
        open={bulkModalOpen}
        className="lottery-ticket-import-modal"
        okText="保存可用票据"
        cancelText="关闭"
        width={960}
        confirmLoading={bulkSaving}
        okButtonProps={{ disabled: !validBulkPreviewRows.length || bulkReferenceLoading || bulkPreviewLoading }}
        onOk={saveBulkTickets}
        onCancel={() => setBulkModalOpen(false)}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message={`每行一注，可写“2026079 01 02 03 04 05 06 + 07”；不写期号时会使用当前筛选期号${issue ? ` ${issue}` : ''}。`}
          />
          <Input.TextArea
            rows={7}
            value={bulkText}
            onChange={event => {
              setBulkText(event.target.value);
              setBulkPreviewResult(undefined);
              setBulkImportResult(undefined);
            }}
            placeholder={'2026079 01 02 03 04 05 06 + 07\n2026079, 08, 10, 12, 16, 22, 31, 09'}
          />
          <Space wrap>
            <Button icon={<SearchOutlined />} loading={bulkPreviewLoading} onClick={previewBulkTickets}>
              后端预览
            </Button>
            <Tag color="green">可保存 {validBulkPreviewRows.length}</Tag>
            <Tag color="gold">重复 {bulkPreviewRows.filter(row => row.status === 'DUPLICATE_EXISTING' || row.status === 'DUPLICATE_REQUEST').length}</Tag>
            <Tag color="red">需修正 {bulkPreviewRows.filter(row => row.status === 'INVALID').length}</Tag>
            <Tag>{bulkPreviewResult ? '后端已确认' : `本地预览 · 已对比 ${bulkReferenceTickets.length || allTickets.length} 注已有票据`}</Tag>
            {bulkReferenceLoading ? <Tag color="processing">正在读取已有票据</Tag> : null}
          </Space>
          {budgetPrecheckMessages(bulkPreviewResult?.budgetPrecheck) ? (
            <Alert
              type={bulkPreviewResult?.budgetPrecheck?.status === 'OVER' ? 'error' : 'warning'}
              showIcon
              message={budgetPrecheckMessages(bulkPreviewResult?.budgetPrecheck)}
            />
          ) : null}
          {bulkImportResult ? (
            <Alert
              type={budgetPrecheckMessages(bulkImportResult.budgetPrecheck) ? 'warning' : 'success'}
              showIcon
              message={`本次请求 ${bulkImportResult.requestedCount || 0} 注，保存 ${bulkImportResult.savedCount || 0} 注，后端跳过重复 ${bulkImportResult.duplicateCount || 0} 注。${budgetPrecheckMessages(bulkImportResult.budgetPrecheck) ? ` ${budgetPrecheckMessages(bulkImportResult.budgetPrecheck)}` : ''}`}
            />
          ) : null}
          <Table
            rowKey="key"
            size="small"
            columns={bulkPreviewColumns}
            dataSource={bulkPreviewRows}
            pagination={{ pageSize: 6, hideOnSinglePage: true }}
            scroll={{ x: 780 }}
          />
          <div className="lottery-ticket-import-mobile-list">
            {bulkPreviewRows.map(row => (
              <article key={row.key}>
                <div>
                  <strong>第 {row.lineNumber} 行</strong>
                  <Tag color={previewStatusColor(row.status)}>{previewStatusLabel(row.status)}</Tag>
                </div>
                {row.redNumbers.length && row.blueNumber ? (
                  <LotteryBalls redNumbers={row.redNumbers} blueNumber={row.blueNumber} />
                ) : (
                  <span>{row.raw}</span>
                )}
                <small>期号 {row.issue || '-'}</small>
                <em>{row.messages.length ? row.messages.join('；') : '格式正常'}</em>
              </article>
            ))}
          </div>
        </Space>
      </Modal>

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
