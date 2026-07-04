import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Form, InputNumber, Select, Space, Switch, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import { lotteryPreferenceApi, type LotteryPreference } from '../services/api';
import './LotteryOverviewPage.css';

const LotterySettingsPage = () => {
  const [form] = Form.useForm<LotteryPreference>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const loadPreference = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const preference = await lotteryPreferenceApi.preference();
      form.setFieldsValue(preference);
    } catch (requestError) {
      console.error('读取彩票偏好失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '读取彩票偏好失败');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadPreference();
  }, [loadPreference]);

  const savePreference = async () => {
    const values = await form.validateFields();
    setSaving(true);
    setError(undefined);
    try {
      const saved = await lotteryPreferenceApi.updatePreference(values);
      form.setFieldsValue(saved);
      message.success('彩票设置已保存');
    } catch (requestError) {
      console.error('保存彩票偏好失败:', requestError);
      setError(requestError instanceof Error ? requestError.message : '保存彩票偏好失败');
      message.error('保存彩票设置失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LifePageShell
      className="lottery-prediction-page"
      eyebrow="彩票数据"
      title="彩票设置"
      actions={
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={savePreference}>
          保存
        </Button>
      }
    >
      {error ? <Alert className="lottery-overview-status-alert" type="error" showIcon message={error} /> : null}
      <Card className="life-panel-card" loading={loading}>
        <Form form={form} layout="vertical" initialValues={{
          defaultTrainingScale: 'standard',
          defaultReplayCount: 0,
          autoSavePredictions: false,
          defaultTicketSource: 'MANUAL',
          budgetReminderPercent: 80,
          reminderDrawWindowHours: 12,
          reminderDefaultSnoozeMinutes: 60,
          monthEndExportChecklistEnabled: true,
          governancePortfolioScoreThreshold: 70,
          governanceSimulatorHighRiskLimit: 2,
          governanceTicketPackBudgetExposurePercent: 90,
          governanceEvidenceFreshnessDays: 14,
          governanceStaleApprovalHours: 24
        }}>
          <Form.Item name="defaultTrainingScale" label="训练规模">
            <Select
              options={[
                { label: '快速', value: 'fast' },
                { label: '标准', value: 'standard' },
                { label: '深度', value: 'deep' }
              ]}
            />
          </Form.Item>
          <Form.Item name="defaultReplayCount" label="默认回放次数">
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="defaultTicketSource" label="默认票据来源">
            <Select
              options={[
                { label: '手动', value: 'MANUAL' },
                { label: '预测', value: 'PREDICTION' }
              ]}
            />
          </Form.Item>
          <Form.Item name="autoSavePredictions" label="自动保存预测票据" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="weeklyBudget" label="每周预算" style={{ width: '50%' }}>
              <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="monthlyBudget" label="每月预算" style={{ width: '50%' }}>
              <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item name="maxTicketsPerIssue" label="单期票据上限" style={{ width: '50%' }}>
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="budgetReminderPercent" label="提醒阈值" style={{ width: '50%' }}>
              <InputNumber min={1} max={100} precision={0} addonAfter="%" style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item name="reminderDrawWindowHours" label="开奖前提醒窗口" style={{ width: '50%' }}>
              <InputNumber min={1} max={72} precision={0} addonAfter="小时" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="reminderDefaultSnoozeMinutes" label="默认稍后时长" style={{ width: '50%' }}>
              <InputNumber min={5} max={10080} precision={0} addonAfter="分钟" style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="monthEndExportChecklistEnabled" label="月末导出清单提醒" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="governancePortfolioScoreThreshold" label="组合健康分阈值" style={{ width: '50%' }}>
              <InputNumber min={1} max={100} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="governanceSimulatorHighRiskLimit" label="沙盘高风险上限" style={{ width: '50%' }}>
              <InputNumber min={0} max={100} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item name="governanceTicketPackBudgetExposurePercent" label="票包预算暴露阈值" style={{ width: '50%' }}>
              <InputNumber min={1} max={100} precision={0} addonAfter="%" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="governanceEvidenceFreshnessDays" label="证据新鲜天数" style={{ width: '50%' }}>
              <InputNumber min={1} max={365} precision={0} addonAfter="天" style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="governanceStaleApprovalHours" label="审批滞留阈值">
            <InputNumber min={1} max={720} precision={0} addonAfter="小时" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Card>
    </LifePageShell>
  );
};

export default LotterySettingsPage;
