import type { CSSProperties, ReactNode } from 'react';

interface MetricGridProps {
  children: ReactNode;
  className?: string;
  gap?: number;
  minColumnWidth?: number;
  style?: CSSProperties;
}

const MetricGrid = ({
  children,
  className = '',
  gap = 16,
  minColumnWidth = 180,
  style
}: MetricGridProps) => (
  <div
    className={`metric-grid ${className}`.trim()}
    style={{
      '--metric-grid-gap': `${gap}px`,
      '--metric-grid-min': `${minColumnWidth}px`,
      ...style
    } as CSSProperties}
  >
    {children}
  </div>
);

export default MetricGrid;
