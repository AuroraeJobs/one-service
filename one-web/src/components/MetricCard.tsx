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
}

const MetricCard = ({
  title,
  value,
  prefix,
  suffix,
  accent = '#1890ff',
  minWidth = 150,
  valueStyle
}: MetricCardProps) => (
  <Card
    className="metric-card"
    style={{
      flex: '1 1 18%',
      minWidth,
      borderColor: `${accent}55`
    }}
  >
    <Statistic
      title={<span className="metric-card-title">{title}</span>}
      value={value}
      prefix={prefix}
      suffix={suffix}
      valueStyle={{
        color: accent,
        fontWeight: 700,
        ...valueStyle
      }}
    />
  </Card>
);

export default MetricCard;
