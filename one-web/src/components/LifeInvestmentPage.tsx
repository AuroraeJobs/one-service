import { Button, Card } from 'antd';
import { BarChartOutlined, LineChartOutlined, PieChartOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MetricCard from './MetricCard';
import MetricGrid from './MetricGrid';
import LifePageShell from './LifePageShell';

const investmentTracks = [
  {
    title: '账户持仓',
    description: '券商、基金、现金类资产进入统一资产表。',
    icon: <PieChartOutlined />,
    accent: '#5856d6'
  },
  {
    title: '行情数据',
    description: '股票、指数、基金净值统一沉淀为时间序列。',
    icon: <LineChartOutlined />,
    accent: '#0071e3'
  },
  {
    title: '收益归因',
    description: '区分市场收益、交易收益、分红和汇率变化。',
    icon: <BarChartOutlined />,
    accent: '#34c759'
  }
];

const LifeInvestmentPage = () => {
  const navigate = useNavigate();

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow="投资资产"
      title="把账户、持仓、行情和收益归因整理成长期资产视图。"
      actions={
        <Button type="primary" icon={<SyncOutlined />} onClick={() => navigate('/connections')}>
          配置接入
        </Button>
      }
    >
      <MetricGrid gap={16} minColumnWidth={200}>
        <MetricCard title="账户接入" value="0" suffix="个" accent="#5856d6" />
        <MetricCard title="持仓标的" value="0" suffix="个" accent="#0071e3" />
        <MetricCard title="行情源" value="待接入" accent="#ff9500" />
        <MetricCard title="收益归因" value="规划中" accent="#34c759" />
      </MetricGrid>

      <section className="life-section-grid life-section-grid-three">
        {investmentTracks.map(track => (
          <Card key={track.title} className="life-module-card">
            <div className="life-module-card-head">
              <span className="life-module-icon" style={{ color: track.accent }}>
                {track.icon}
              </span>
            </div>
            <h2>{track.title}</h2>
            <p>{track.description}</p>
          </Card>
        ))}
      </section>

      <Card className="life-panel-card">
        <h2>建议的数据模型</h2>
        <div className="life-data-model-grid">
          {['账户 Account', '资产 Asset', '持仓 Position', '交易 Trade', '行情 Quote', '收益 Return'].map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </Card>
    </LifePageShell>
  );
};

export default LifeInvestmentPage;
