import { useMemo, useState } from 'react';
import { Button, Drawer, Input, message } from 'antd';
import { MessageOutlined, SendOutlined } from '@ant-design/icons';
import { aiApi } from '../../services/api';
import type { LotteryDraw, LotteryStats } from '../../utils/lotteryStats';

interface LotteryAiPanelProps {
  stats: LotteryStats;
  recentDraws: LotteryDraw[];
}

const buildDefaultPrompt = (stats: LotteryStats, recentDraws: LotteryDraw[]) => {
  const latest = stats.latestDraw;
  const recentText = recentDraws
    .slice(0, 6)
    .map(draw => `第${draw.period}期: ${draw.redNumbers.join(' ')} + ${draw.blueNumber}, ${draw.combination}, 和值${draw.redSum}`)
    .join('\n');

  return [
    '请基于以下双色球数据做一段概览解读，只分析数据特征，不做确定性预测。',
    `历史期数: ${stats.draws.length}`,
    `最新期: ${latest ? `第${latest.period}期 ${latest.redNumbers.join(' ')} + ${latest.blueNumber}` : '暂无'}`,
    `红球最高频: ${stats.mostFrequentRed?.number ?? '-'} (${stats.mostFrequentRed?.count ?? 0}次)`,
    `蓝球最高频: ${stats.mostFrequentBlue?.number ?? '-'} (${stats.mostFrequentBlue?.count ?? 0}次)`,
    '最近开奖:',
    recentText
  ].join('\n');
};

const LotteryAiPanel = ({ stats, recentDraws }: LotteryAiPanelProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const defaultPrompt = useMemo(() => buildDefaultPrompt(stats, recentDraws), [stats, recentDraws]);
  const [prompt, setPrompt] = useState(defaultPrompt);

  const handleOpen = () => {
    setPrompt(defaultPrompt);
    setOpen(true);
  };

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      message.warning('请输入需要解读的数据范围或问题');
      return;
    }

    setLoading(true);
    try {
      const result = await aiApi.chat(prompt);
      setResponse(result);
    } catch (error) {
      console.error('AI解读失败:', error);
      message.error('AI解读失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button icon={<MessageOutlined />} onClick={handleOpen}>
        AI 解读
      </Button>
      <Drawer title="AI 数据解读" width={520} open={open} onClose={() => setOpen(false)}>
        <div className="lottery-ai-panel">
          <Input.TextArea
            value={prompt}
            onChange={event => setPrompt(event.target.value)}
            autoSize={{ minRows: 8, maxRows: 14 }}
          />
          <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={handleAnalyze}>
            生成解读
          </Button>
          {response && (
            <div className="lottery-ai-response">
              {response}
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
};

export default LotteryAiPanel;
