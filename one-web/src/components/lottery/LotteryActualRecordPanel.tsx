import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, Tag, message } from 'antd';
import { SaveOutlined, TrophyOutlined } from '@ant-design/icons';
import LotteryBalls from './LotteryBalls';
import {
  lotteryTrainingApi,
  type LotteryActualRecord,
  type LotteryLatestPrediction
} from '../../services/api';

interface LotteryActualRecordPanelProps {
  prediction?: LotteryLatestPrediction;
  onPredictionUpdated?: (prediction?: LotteryLatestPrediction) => void;
  onActualRecordUpdated?: (record?: LotteryActualRecord) => void;
}

const splitNumbers = (value?: string) =>
  (value || '')
    .split(/[\s,，]+/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => item.padStart(2, '0'));

const LotteryActualRecordPanel = ({
  prediction,
  onPredictionUpdated,
  onActualRecordUpdated
}: LotteryActualRecordPanelProps) => {
  const [form] = Form.useForm();
  const [record, setRecord] = useState<LotteryActualRecord | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    lotteryTrainingApi.latestActualRecord()
      .then(actualRecord => {
        if (actualRecord?.redNumbers?.length) {
          setRecord(actualRecord);
          onActualRecordUpdated?.(actualRecord);
          form.setFieldsValue({
            period: actualRecord.period || prediction?.targetPeriod,
            redNumbers: actualRecord.redNumbers.join(' '),
            blueNumber: actualRecord.blueNumber
          });
        } else {
          form.setFieldValue('period', prediction?.targetPeriod);
        }
      })
      .catch(error => {
        console.warn('读取最新中奖记录失败:', error);
        form.setFieldValue('period', prediction?.targetPeriod);
      });
  }, [form, onActualRecordUpdated, prediction?.targetPeriod]);

  const saveRecord = async () => {
    const values = await form.validateFields();
    const redNumbers = splitNumbers(values.redNumbers);
    if (redNumbers.length !== 6) {
      message.error('请输入 6 个红球号码');
      return;
    }
    setSaving(true);
    try {
      const saved = await lotteryTrainingApi.saveLatestActualRecord({
        period: values.period || prediction?.targetPeriod || 0,
        redNumbers,
        blueNumber: String(values.blueNumber).padStart(2, '0')
      });
      setRecord(saved);
      onActualRecordUpdated?.(saved);
      const latestPrediction = await lotteryTrainingApi.latestPrediction();
      onPredictionUpdated?.(latestPrediction);
      message.success('最新中奖记录已保存');
    } catch (error) {
      console.error('保存最新中奖记录失败:', error);
      message.error('保存失败，请检查号码格式');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="lottery-clean-panel lottery-actual-record-panel">
      <div className="lottery-card-title-row">
        <div>
          <h2>最新中奖记录</h2>
          <p>手动录入最新期开奖，保存到 Redis 后用于给训练后预测打分。</p>
        </div>
        <TrophyOutlined />
      </div>

      <div className="lottery-actual-record-grid">
        <Form form={form} layout="vertical" className="lottery-actual-form">
          <Form.Item name="period" label="期号">
            <InputNumber min={1} placeholder="例如 2026" />
          </Form.Item>
          <Form.Item
            name="redNumbers"
            label="红球"
            rules={[{ required: true, message: '请输入 6 个红球号码' }]}
          >
            <Input placeholder="例如 03 05 16 18 29 32" />
          </Form.Item>
          <Form.Item
            name="blueNumber"
            label="蓝球"
            rules={[{ required: true, message: '请输入蓝球号码' }]}
          >
            <Input placeholder="例如 04" />
          </Form.Item>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveRecord}>
            保存中奖记录
          </Button>
        </Form>

        <div className="lottery-actual-summary">
          {record ? (
            <>
              <div>
                <strong>已保存第 {record.period || prediction?.targetPeriod} 期</strong>
                <LotteryBalls redNumbers={record.redNumbers} blueNumber={record.blueNumber} />
              </div>
              {prediction?.result ? (
                <div className="lottery-actual-score">
                  <Tag color={prediction.result.prizeName === '未中奖' ? 'default' : 'blue'}>
                    {prediction.result.prizeName}
                  </Tag>
                  <span>红球 {prediction.result.redHits}/6</span>
                  <span>{prediction.result.blueHit ? '蓝球命中' : '蓝球未中'}</span>
                  <span>评分 {prediction.result.score}</span>
                </div>
              ) : (
                <span>保存后会对训练后预测进行评分</span>
              )}
            </>
          ) : (
            <span>尚未保存最新中奖记录</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default LotteryActualRecordPanel;
