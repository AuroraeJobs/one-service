import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Empty, Space, Spin, Tag, message } from 'antd';
import { BellOutlined, CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LifePageShell from './LifePageShell';
import { lotteryCalendarApi, type LotteryCalendarReminder, type LotteryCalendarState } from '../services/api';
import './LotteryOverviewPage.css';

const formatDateTime = (timestamp?: number) => {
  if (!timestamp) {
    return '-';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
};

const statusColor = (status?: string) => {
  if (status === 'WARNING') return 'gold';
  if (status === 'PENDING') return 'orange';
  return 'default';
};

const LotteryAlertPage = () => {
  const navigate = useNavigate();
  const [calendar, setCalendar] = useState<LotteryCalendarState>();
  const [loading, setLoading] = useState(false);
  const [ackingKey, setAckingKey] = useState<string>();
  const [error, setError] = useState<string>();

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setCalendar(await lotteryCalendarApi.calendar());
    } catch (requestError) {
      console.error('读取彩票提醒失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票提醒失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const acknowledge = async (reminder: LotteryCalendarReminder) => {
    if (!reminder.key || !reminder.fingerprint) {
      return;
    }
    setAckingKey(reminder.key);
    try {
      setCalendar(await lotteryCalendarApi.acknowledge(reminder.key, reminder.fingerprint));
      message.success('提醒已确认');
    } catch (requestError) {
      console.error('确认彩票提醒失败:', requestError);
      message.error('确认彩票提醒失败');
    } finally {
      setAckingKey(undefined);
    }
  };

  return (
    <LifePageShell
      className="lottery-prediction-page lottery-alert-page"
      eyebrow="彩票数据"
      title="日历提醒"
      actions={
        <Space wrap>
          <Button icon={<SafetyCertificateOutlined />} onClick={() => navigate('/lottery/ticket-packs')}>
            票包队列
          </Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadCalendar}>
            刷新
          </Button>
        </Space>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <Spin spinning={loading && !calendar}>
        <section className="lottery-workbench-daily-state">
          <div>
            <strong>第 {calendar?.nextIssue || '-'} 期</strong>
            <span>{calendar?.nextDrawDate || '-'} {calendar?.drawWeekday || ''}</span>
          </div>
          <Space wrap>
            <Tag color="blue">{calendar?.currentIssueState || 'UNKNOWN'}</Tag>
            <Tag>同步 {formatDateTime(calendar?.expectedSyncStartAt)} - {formatDateTime(calendar?.expectedSyncEndAt)}</Tag>
          </Space>
        </section>

        {calendar?.reminders?.length ? (
          <section className="lottery-alert-list">
            {calendar.reminders.map(reminder => (
              <Card key={`${reminder.key}-${reminder.fingerprint}`} className="life-panel-card lottery-clean-panel">
                <div className="lottery-card-title-row">
                  <div>
                    <h2>{reminder.label || reminder.key}</h2>
                    <p>{reminder.message || '-'}</p>
                  </div>
                  <Tag color={statusColor(reminder.status)}>{reminder.status || 'UNKNOWN'}</Tag>
                </div>
                <div className="lottery-latest-meta">
                  <span><ClockCircleOutlined /> 到期 {formatDateTime(reminder.dueAt)}</span>
                  <span><BellOutlined /> {reminder.key}</span>
                </div>
                <Space wrap>
                  {reminder.path ? (
                    <Button onClick={() => navigate(reminder.path || '/lottery/workbench')}>
                      处理
                    </Button>
                  ) : null}
                  <Button
                    icon={<CheckCircleOutlined />}
                    loading={ackingKey === reminder.key}
                    onClick={() => acknowledge(reminder)}
                  >
                    确认
                  </Button>
                </Space>
              </Card>
            ))}
          </section>
        ) : (
          <Empty description="暂无待处理提醒" />
        )}
      </Spin>
    </LifePageShell>
  );
};

export default LotteryAlertPage;
