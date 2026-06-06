import { useMemo } from 'react';
import { Card, Empty, Tag } from 'antd';
import LifePageShell from './LifePageShell';
import { useRecordContext } from '../contexts/RecordContext';
import { buildLotteryStats, type LotteryDraw } from '../utils/lotteryStats';
import './LotteryOverviewPage.css';

const RED_TOTAL = 33;
const GRID_SIZE = 7;
const CELL_TOTAL = GRID_SIZE * GRID_SIZE;

const getCellIndex = (type: 'red' | 'blue', number: string) => {
  const offset = type === 'red' ? 0 : RED_TOTAL;
  return offset + Number(number) - 1;
};

const getDrawCellIndexes = (draw: LotteryDraw) => [
  ...draw.redNumbers.map(number => getCellIndex('red', number)),
  getCellIndex('blue', draw.blueNumber)
];

const getDrawRedCellIndexes = (draw: LotteryDraw) =>
  draw.redNumbers.map(number => getCellIndex('red', number));

const buildCoverageStats = (
  draws: LotteryDraw[],
  getCellIndexes: (draw: LotteryDraw) => number[]
) => {
  const rows = Array.from({ length: GRID_SIZE }, (_, index) => ({
    index,
    count: 0
  }));
  const columns = Array.from({ length: GRID_SIZE }, (_, index) => ({
    index,
    count: 0
  }));
  const cells = Array.from({ length: CELL_TOTAL }, (_, index) => ({
    index,
    count: 0
  }));
  const shapeCounts = new Map<string, number>();

  draws.forEach(draw => {
    const drawRows = new Set<number>();
    const drawColumns = new Set<number>();

    getCellIndexes(draw).forEach(cellIndex => {
      if (cellIndex < 0 || cellIndex >= CELL_TOTAL) return;
      const rowIndex = Math.floor(cellIndex / GRID_SIZE);
      const columnIndex = cellIndex % GRID_SIZE;

      rows[rowIndex].count += 1;
      columns[columnIndex].count += 1;
      cells[cellIndex].count += 1;
      drawRows.add(rowIndex);
      drawColumns.add(columnIndex);
    });

    const shapeKey = `${drawRows.size}行${drawColumns.size}列`;
    shapeCounts.set(shapeKey, (shapeCounts.get(shapeKey) || 0) + 1);
  });

  const shapes = Array.from(shapeCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'zh-Hans-CN'));

  return {
    rows,
    columns,
    cells,
    shapes,
    maxRowCount: Math.max(1, ...rows.map(row => row.count)),
    maxColumnCount: Math.max(1, ...columns.map(column => column.count)),
    maxCellCount: Math.max(1, ...cells.map(cell => cell.count)),
    maxShapeCount: Math.max(1, ...shapes.map(shape => shape.count))
  };
};

const buildPixelStats = (draws: LotteryDraw[]) => buildCoverageStats(draws, getDrawCellIndexes);

const buildRedPixelStats = (draws: LotteryDraw[]) => buildCoverageStats(draws, getDrawRedCellIndexes);

interface PixelStatBarsProps {
  title: string;
  items: Array<{ index: number; count: number }>;
  maxCount: number;
  prefix: string;
}

const PixelStatBars = ({ title, items, maxCount, prefix }: PixelStatBarsProps) => (
  <Card className="life-panel-card lottery-pixel-stat-card">
    <div className="lottery-card-title-row">
      <div>
        <h2>{title}</h2>
      </div>
    </div>
    <div className="lottery-pixel-stat-list">
      {items.map(item => (
        <div className="lottery-pixel-stat-row" key={item.index}>
          <strong>{prefix}{item.index + 1}</strong>
          <span className="lottery-pixel-stat-track">
            <span style={{ width: `${Math.max(3, (item.count / maxCount) * 100)}%` }} />
          </span>
          <em>{item.count}</em>
        </div>
      ))}
    </div>
  </Card>
);

const LotteryPixelStatsPage = () => {
  const { allRecords } = useRecordContext();
  const stats = useMemo(() => buildLotteryStats(allRecords), [allRecords]);
  const pixelStats = useMemo(() => buildPixelStats(stats.draws), [stats.draws]);
  const redPixelStats = useMemo(() => buildRedPixelStats(stats.draws), [stats.draws]);
  const totalHits = stats.draws.length * 7;

  return (
    <LifePageShell
      className="lottery-pixel-stats-page"
      eyebrow="象数"
      title="像素行列统计"
      actions={<Tag color={stats.draws.length ? 'processing' : 'default'}>{totalHits} 次</Tag>}
    >
      {stats.draws.length > 0 ? (
        <>
          <section className="lottery-pixel-stat-layout">
            <PixelStatBars title="行" items={pixelStats.rows} maxCount={pixelStats.maxRowCount} prefix="R" />
            <PixelStatBars title="列" items={pixelStats.columns} maxCount={pixelStats.maxColumnCount} prefix="C" />
          </section>

          <Card className="life-panel-card lottery-pixel-shape-card">
            <div className="lottery-card-title-row">
              <div>
                <h2>行列组合</h2>
              </div>
            </div>
            <div className="lottery-pixel-shape-grid">
              {pixelStats.shapes.map(shape => (
                <div className="lottery-pixel-shape-item" key={shape.label}>
                  <strong>{shape.label}</strong>
                  <span className="lottery-pixel-stat-track">
                    <span style={{ width: `${Math.max(3, (shape.count / pixelStats.maxShapeCount) * 100)}%` }} />
                  </span>
                  <em>{shape.count}</em>
                </div>
              ))}
            </div>
          </Card>

          <section className="lottery-pixel-section-title">
            <h2>红球覆盖</h2>
            <Tag color="error">{stats.draws.length * 6} 次</Tag>
          </section>

          <section className="lottery-pixel-stat-layout lottery-pixel-stat-layout-red">
            <PixelStatBars title="红球行" items={redPixelStats.rows} maxCount={redPixelStats.maxRowCount} prefix="R" />
            <PixelStatBars title="红球列" items={redPixelStats.columns} maxCount={redPixelStats.maxColumnCount} prefix="C" />
          </section>

          <Card className="life-panel-card lottery-pixel-shape-card lottery-pixel-shape-card-red">
            <div className="lottery-card-title-row">
              <div>
                <h2>红球行列组合</h2>
              </div>
            </div>
            <div className="lottery-pixel-shape-grid">
              {redPixelStats.shapes.map(shape => (
                <div className="lottery-pixel-shape-item" key={shape.label}>
                  <strong>{shape.label}</strong>
                  <span className="lottery-pixel-stat-track lottery-pixel-stat-track-red">
                    <span style={{ width: `${Math.max(3, (shape.count / redPixelStats.maxShapeCount) * 100)}%` }} />
                  </span>
                  <em>{shape.count}</em>
                </div>
              ))}
            </div>
          </Card>

          <Card className="life-panel-card lottery-pixel-heat-card">
            <div className="lottery-pixel-heat-grid">
              {pixelStats.cells.map(cell => {
                const intensity = cell.count / pixelStats.maxCellCount;
                return (
                  <span
                    key={cell.index}
                    className="lottery-pixel-heat-cell"
                    title={`R${Math.floor(cell.index / GRID_SIZE) + 1} C${(cell.index % GRID_SIZE) + 1}: ${cell.count}`}
                    style={{ opacity: 0.2 + intensity * 0.8 }}
                  >
                    {cell.count}
                  </span>
                );
              })}
            </div>
          </Card>
        </>
      ) : (
        <Empty description={false} />
      )}
    </LifePageShell>
  );
};

export default LotteryPixelStatsPage;
