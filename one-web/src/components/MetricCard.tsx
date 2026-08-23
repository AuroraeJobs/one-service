import { Card, Statistic } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

interface MetricCardProps {
  title: ReactNode;
  value: string | number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  accent?: string;
  minWidth?: number;
  valueStyle?: CSSProperties;
  secondaryTitle?: ReactNode;
  secondaryValue?: string | number;
  secondaryAccent?: string;
}

const MetricCard = ({
  title,
  value,
  prefix,
  suffix,
  accent = '#1890ff',
  minWidth = 150,
  valueStyle,
  secondaryTitle,
  secondaryValue,
  secondaryAccent = '#faad14'
}: MetricCardProps) => {
  const renderStatistic = (
    statisticTitle: ReactNode,
    statisticValue: string | number,
    statisticAccent: string,
    statisticPrefix?: ReactNode,
    statisticSuffix?: ReactNode
  ) => (
    <Statistic
      title={<span className="metric-card-title">{statisticTitle}</span>}
      value={statisticValue}
      prefix={statisticPrefix}
      suffix={statisticSuffix}
      valueStyle={{
        color: statisticAccent,
        fontWeight: 700,
        ...valueStyle
      }}
    />
  );

  return (
    <Card
      className="metric-card"
      style={{
        flex: '1 1 18%',
        minWidth,
        borderColor: `${accent}55`
      }}
    >
      {secondaryTitle !== undefined && secondaryValue !== undefined ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {renderStatistic(title, value, accent)}
          {renderStatistic(secondaryTitle, secondaryValue, secondaryAccent)}
        </div>
      ) : renderStatistic(title, value, accent, prefix, suffix)}
    </Card>
  );
};

export default MetricCard;
