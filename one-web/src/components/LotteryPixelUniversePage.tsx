import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { BorderOutlined, DatabaseOutlined, DotChartOutlined } from '@ant-design/icons';
import { useRecordContext } from '../contexts/RecordContext';
import { useI18n } from '../contexts/I18nContext';
import { buildFrequency, buildLotteryStats, getRecentDraws, type LotteryDraw } from '../utils/lotteryStats';
import './LotteryOverviewPage.css';

const GRID_SIZE = 7;
const RED_TOTAL = 33;
const PIXEL_TOTAL = 49;

interface PixelShapeStat {
  key: string;
  rowCount: number;
  columnCount: number;
  count: number;
  indexes: number[];
}

type Translate = ReturnType<typeof useI18n>['t'];

const formatShapeLabel = (shape: PixelShapeStat, t: Translate) => t('{{rowLabel}}{{columnLabel}}', {
  rowLabel: t('{{count}}行', { count: shape.rowCount }),
  columnLabel: t('{{count}}列', { count: shape.columnCount })
});

const numberLabel = (value: number) => String(value).padStart(2, '0');

const getPixelCells = (draws: LotteryDraw[]) => {
  const counts = Array.from({ length: PIXEL_TOTAL }, () => 0);

  draws.forEach(draw => {
    draw.redNumbers.forEach(number => {
      counts[Number(number) - 1] += 1;
    });
    counts[RED_TOTAL + Number(draw.blueNumber) - 1] += 1;
  });

  const maxCount = Math.max(1, ...counts);

  return counts.map((count, index) => ({
    index,
    count,
    row: Math.floor(index / GRID_SIZE),
    column: index % GRID_SIZE,
    type: index < RED_TOTAL ? 'red' : 'blue',
    label: index < RED_TOTAL ? numberLabel(index + 1) : numberLabel(index - RED_TOTAL + 1),
    intensity: count / maxCount
  }));
};

const getDrawIndexes = (draw: LotteryDraw) => [
  ...draw.redNumbers.map(number => Number(number) - 1),
  RED_TOTAL + Number(draw.blueNumber) - 1
];

const getShapeStats = (draws: LotteryDraw[], onlyRed = false) => {
  const shapeCounts = new Map<string, PixelShapeStat>();

  draws.forEach(draw => {
    const indexes = onlyRed
      ? draw.redNumbers.map(number => Number(number) - 1)
      : getDrawIndexes(draw);
    const rows = new Set(indexes.map(index => Math.floor(index / GRID_SIZE)));
    const columns = new Set(indexes.map(index => index % GRID_SIZE));
    const key = `${rows.size}-${columns.size}`;
    const current = shapeCounts.get(key);

    shapeCounts.set(key, {
      key,
      rowCount: rows.size,
      columnCount: columns.size,
      count: (current?.count || 0) + 1,
      indexes
    });
  });

  return Array.from(shapeCounts.values())
    .sort((left, right) => (
      right.count - left.count
      || left.rowCount - right.rowCount
      || left.columnCount - right.columnCount
    ))
    .slice(0, 7);
};

const getCoverage = (draws: LotteryDraw[], onlyRed = false) => {
  const rows = Array.from({ length: GRID_SIZE }, (_, index) => ({ index, count: 0 }));
  const columns = Array.from({ length: GRID_SIZE }, (_, index) => ({ index, count: 0 }));

  draws.forEach(draw => {
    const indexes = onlyRed
      ? draw.redNumbers.map(number => Number(number) - 1)
      : getDrawIndexes(draw);

    indexes.forEach(index => {
      rows[Math.floor(index / GRID_SIZE)].count += 1;
      columns[index % GRID_SIZE].count += 1;
    });
  });

  return {
    rows,
    columns,
    maxCount: Math.max(1, ...rows.map(item => item.count), ...columns.map(item => item.count))
  };
};

interface MiniPixelPatternProps {
  indexes: number[];
}

const MiniPixelPattern = ({ indexes }: MiniPixelPatternProps) => {
  const hitIndexes = new Set(indexes);

  return (
    <span className="lottery-universe-mini-pattern" aria-hidden="true">
      {Array.from({ length: PIXEL_TOTAL }, (_, index) => (
        <span
          key={index}
          className={hitIndexes.has(index) ? 'lottery-universe-mini-dot-hit' : ''}
        />
      ))}
    </span>
  );
};

interface RecentPixelProps {
  draw: LotteryDraw;
  active?: boolean;
}

const RecentPixel = ({ draw, active = false }: RecentPixelProps) => {
  const indexes = getDrawIndexes(draw);
  const hitIndexes = new Set(indexes);

  return (
    <div className={`lottery-universe-trace-card ${active ? 'lottery-universe-trace-card-active' : ''}`}>
      <strong>{draw.period}</strong>
      <div className="lottery-universe-trace-grid">
        {Array.from({ length: PIXEL_TOTAL }, (_, index) => (
          <span
            key={index}
            className={hitIndexes.has(index) ? (index < RED_TOTAL ? 'is-red' : 'is-blue') : ''}
          />
        ))}
      </div>
    </div>
  );
};

const LotteryPixelUniversePage = () => {
  const { allRecords } = useRecordContext();
  const { t } = useI18n();
  const lotteryStats = useMemo(() => buildLotteryStats(allRecords), [allRecords]);
  const pixelCells = useMemo(() => getPixelCells(lotteryStats.draws), [lotteryStats.draws]);
  const shapeStats = useMemo(() => getShapeStats(lotteryStats.draws), [lotteryStats.draws]);
  const redShapeStats = useMemo(() => getShapeStats(lotteryStats.draws, true), [lotteryStats.draws]);
  const coverage = useMemo(() => getCoverage(lotteryStats.draws), [lotteryStats.draws]);
  const redCoverage = useMemo(() => getCoverage(lotteryStats.draws, true), [lotteryStats.draws]);
  const recentDraws = useMemo(() => getRecentDraws(lotteryStats.draws, 12), [lotteryStats.draws]);
  const blueFrequency = useMemo(() => buildFrequency(lotteryStats.draws, 'blue'), [lotteryStats.draws]);
  const maxBlueCount = Math.max(1, ...blueFrequency.map(item => item.count));
  const hottestPixel = useMemo(
    () => [...pixelCells].sort((left, right) => right.count - left.count || left.index - right.index)[0],
    [pixelCells]
  );
  const dominantRow = useMemo(
    () => [...coverage.rows].sort((left, right) => right.count - left.count || left.index - right.index)[0],
    [coverage.rows]
  );
  const dominantColumn = useMemo(
    () => [...coverage.columns].sort((left, right) => right.count - left.count || left.index - right.index)[0],
    [coverage.columns]
  );
  const dominantRedShape = redShapeStats[0];
  const hottestBlue = blueFrequency[0];

  return (
    <div className="themed-route-page lottery-universe-page">
      <section className="lottery-universe-shell">
        <header className="lottery-universe-header">
          <div>
            <h1>{t('像素宇宙')}</h1>
            <span>{t('双色球数据分析')}</span>
          </div>
          <div className="lottery-universe-header-actions">
            <span><DotChartOutlined /> {t('像素矩阵')}</span>
            <span><BorderOutlined /> {t('行列分析')}</span>
            <span><DatabaseOutlined /> {t('数据工具')}</span>
          </div>
        </header>

        <section className="lottery-universe-kpis">
          <div>
            <span>{t('最热像素')}</span>
            <strong>
              {hottestPixel
                ? hottestPixel.type === 'red'
                  ? t('红{{number}}', { number: hottestPixel.label })
                  : t('蓝{{number}}', { number: hottestPixel.label })
                : '--'}
            </strong>
          </div>
          <div>
            <span>{t('主导行')}</span>
            <strong>{dominantRow ? t('第 {{index}} 行', { index: dominantRow.index + 1 }) : '--'}</strong>
          </div>
          <div>
            <span>{t('主导列')}</span>
            <strong>{dominantColumn ? t('第 {{index}} 列', { index: dominantColumn.index + 1 }) : '--'}</strong>
          </div>
          <div>
            <span>{t('红球形态')}</span>
            <strong>{dominantRedShape ? formatShapeLabel(dominantRedShape, t) : '--'}</strong>
          </div>
          <div>
            <span>{t('蓝球热点')}</span>
            <strong>{hottestBlue ? t('蓝{{number}}', { number: hottestBlue.number }) : '--'}</strong>
          </div>
        </section>

        <main className="lottery-universe-grid">
          <aside className="lottery-universe-panel lottery-universe-side-panel">
            <h2>{t('行覆盖')}</h2>
            <div className="lottery-universe-bar-list">
              {coverage.rows.map(row => (
                <div className="lottery-universe-bar-row" key={row.index}>
                  <span>{t('第 {{index}} 行', { index: row.index + 1 })}</span>
                  <i><b style={{ width: `${(row.count / coverage.maxCount) * 100}%` }} /></i>
                  <em>{row.count}</em>
                </div>
              ))}
            </div>
            <h2>{t('列覆盖')}</h2>
            <div className="lottery-universe-bar-list">
              {coverage.columns.map(column => (
                <div className="lottery-universe-bar-row" key={column.index}>
                  <span>{t('第 {{index}} 列', { index: column.index + 1 })}</span>
                  <i><b style={{ width: `${(column.count / coverage.maxCount) * 100}%` }} /></i>
                  <em>{column.count}</em>
                </div>
              ))}
            </div>
            <h2>{t('蓝球分布')}</h2>
            <div className="lottery-universe-blue-bars">
              {blueFrequency
                .slice()
                .sort((left, right) => Number(left.number) - Number(right.number))
                .map(item => (
                  <span key={item.number} title={`${item.number}: ${item.count}`}>
                    <b style={{ height: `${Math.max(8, (item.count / maxBlueCount) * 100)}%` }} />
                    <em>{Number(item.number)}</em>
                  </span>
                ))}
            </div>
          </aside>

          <section className="lottery-universe-panel lottery-universe-matrix-panel">
            <div className="lottery-universe-panel-title">
              <h2>{t('双色球 7x7 像素矩阵')}</h2>
              <span>{t('红球 01-33 · 蓝球 01-16')}</span>
            </div>
            <div className="lottery-universe-matrix">
              {pixelCells.map(cell => (
                <div
                  key={cell.index}
                  className={`lottery-universe-cell lottery-universe-cell-${cell.type}`}
                  title={cell.type === 'red'
                    ? t('红球 {{number}}：{{count}} 次', {
                        number: cell.label,
                        count: cell.count
                      })
                    : t('蓝球 {{number}}：{{count}} 次', {
                        number: cell.label,
                        count: cell.count
                      })}
                  style={{ '--cell-alpha': 0.18 + cell.intensity * 0.82 } as CSSProperties}
                >
                  <strong>{cell.label}</strong>
                  <span>{cell.count}</span>
                </div>
              ))}
            </div>
          </section>

          <aside className="lottery-universe-panel lottery-universe-rank-panel">
            <h2>{t('形态排行')}</h2>
            <div className="lottery-universe-rank-list">
              {shapeStats.map((shape, index) => (
                <div className="lottery-universe-rank-item" key={shape.key}>
                  <span className="lottery-universe-rank-index">{index + 1}</span>
                  <MiniPixelPattern indexes={shape.indexes} />
                  <div>
                    <strong>{formatShapeLabel(shape, t)}</strong>
                    <span>{t('{{count}} 期开奖', { count: shape.count })}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </main>

        <section className="lottery-universe-mobile-stack">
          <div className="lottery-universe-panel">
            <h2>{t('红球覆盖')}</h2>
            <div className="lottery-universe-mobile-bars">
              {redCoverage.rows.map(row => (
                <span key={row.index}>
                  <b style={{ height: `${(row.count / redCoverage.maxCount) * 100}%` }} />
                  <em>{t('第 {{index}} 行', { index: row.index + 1 })}</em>
                </span>
              ))}
            </div>
          </div>
          <div className="lottery-universe-panel">
            <h2>{t('红球形态')}</h2>
            <div className="lottery-universe-rank-list lottery-universe-rank-list-compact">
              {redShapeStats.slice(0, 5).map((shape, index) => (
                <div className="lottery-universe-rank-item" key={shape.key}>
                  <span className="lottery-universe-rank-index">{index + 1}</span>
                  <div>
                    <strong>{formatShapeLabel(shape, t)}</strong>
                    <span>{t('{{count}} 期开奖', { count: shape.count })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lottery-universe-panel lottery-universe-trace-panel">
          <div className="lottery-universe-panel-title">
            <h2>{t('近期轨迹')}</h2>
            <span>
              {t('最近 {{count}} 期开奖', { count: recentDraws.length })}
            </span>
          </div>
          <div className="lottery-universe-trace-list">
            {recentDraws.map((draw, index) => (
              <RecentPixel key={draw.id} draw={draw} active={index === recentDraws.length - 1} />
            ))}
          </div>
        </section>
      </section>
    </div>
  );
};

export default LotteryPixelUniversePage;
