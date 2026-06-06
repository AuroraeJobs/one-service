import { useMemo, useState } from 'react';
import { Empty, Pagination, Segmented, Select } from 'antd';
import { useRecordContext } from '../contexts/RecordContext';
import { buildLotteryStats, type LotteryDraw } from '../utils/lotteryStats';
import './LotteryOverviewPage.css';

const RED_TOTAL = 33;
const DEFAULT_PAGE_SIZE = 40;
const RED_PAGE_SIZE = 45;
const BLUE_PAGE_SIZE = 84;
const PAGE_SIZE_OPTIONS = [40, 80, 120, 160, 320, 640];
const RED_PAGE_SIZE_OPTIONS = [45, 90, 135, 180, 360, 720];
const BLUE_PAGE_SIZE_OPTIONS = [84, 168, 252, 336, 672];
const PIXEL_MODE_OPTIONS = [
  { value: 'redBlue', label: '红蓝 7x7' },
  { value: 'red', label: '红 6x6' },
  { value: 'blue', label: '蓝 4x4' }
] as const;

type PixelMode = typeof PIXEL_MODE_OPTIONS[number]['value'];

const pixelModeConfig: Record<PixelMode, { columns: number; total: number; label: string }> = {
  redBlue: { columns: 7, total: 49, label: '红蓝 7x7' },
  red: { columns: 6, total: 36, label: '红 6x6' },
  blue: { columns: 4, total: 16, label: '蓝 4x4' }
};

const createBallNumber = (index: number) => String(index + 1).padStart(2, '0');

const createLotteryPixelCells = (mode: PixelMode) => {
  const config = pixelModeConfig[mode];

  return Array.from({ length: config.total }, (_, index) => {
    if (mode === 'redBlue') {
      const isRed = index < RED_TOTAL;
      const numberIndex = isRed ? index : index - RED_TOTAL;

      return {
        id: `${isRed ? 'red' : 'blue'}-${numberIndex + 1}`,
        number: createBallNumber(numberIndex),
        type: isRed ? 'red' : 'blue',
        empty: false
      };
    }

    if (mode === 'red') {
      return {
        id: `red-${index + 1}`,
        number: index < RED_TOTAL ? createBallNumber(index) : '',
        type: 'red',
        empty: index >= RED_TOTAL
      };
    }

    return {
      id: `blue-${index + 1}`,
      number: createBallNumber(index),
      type: 'blue',
      empty: false
    };
  });
};

interface LotteryPixelCardProps {
  draw: LotteryDraw;
  mode: PixelMode;
}

const LotteryPixelCard = ({ draw, mode }: LotteryPixelCardProps) => {
  const redSet = useMemo(() => new Set(draw.redNumbers), [draw.redNumbers]);
  const config = pixelModeConfig[mode];
  const lotteryPixelCells = useMemo(() => createLotteryPixelCells(mode), [mode]);

  return (
    <div className={`lottery-pixel-card lottery-pixel-card-${mode}`} title={`第 ${draw.period} 期`}>
      <div
        className={`lottery-pixel-grid lottery-pixel-grid-${mode}`}
        style={{ gridTemplateColumns: `repeat(${config.columns}, var(--lottery-pixel-dot))` }}
        role="img"
        aria-label={`第 ${draw.period} 期${config.label}像素图`}
      >
        {lotteryPixelCells.map(cell => {
          const isHit = !cell.empty && (cell.type === 'red' ? redSet.has(cell.number) : draw.blueNumber === cell.number);

          return (
            <span
              key={cell.id}
              className={[
                'lottery-pixel-dot',
                `lottery-pixel-dot-${cell.type}`,
                cell.empty ? 'lottery-pixel-dot-empty' : '',
                isHit ? 'lottery-pixel-dot-hit' : ''
              ].filter(Boolean).join(' ')}
              title={cell.empty ? '空位' : `${cell.type === 'red' ? '红球' : '蓝球'} ${cell.number}${isHit ? ' 已中奖' : ''}`}
            >
              {isHit ? cell.number : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const LotteryPixelCardPage = () => {
  const { allRecords } = useRecordContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pixelMode, setPixelMode] = useState<PixelMode>('redBlue');
  const pageSizeOptions = pixelMode === 'red'
    ? RED_PAGE_SIZE_OPTIONS
    : pixelMode === 'blue'
      ? BLUE_PAGE_SIZE_OPTIONS
      : PAGE_SIZE_OPTIONS;
  const stats = useMemo(() => buildLotteryStats(allRecords), [allRecords]);
  const sortedDraws = useMemo(() => [...stats.draws].reverse(), [stats.draws]);
  const visibleDraws = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDraws.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedDraws]);

  return (
    <div className="themed-route-page lottery-pixel-card-page">
      {visibleDraws.length > 0 ? (
        <>
          <div className="lottery-pixel-mode-switch">
            <Segmented<PixelMode>
              value={pixelMode}
              options={[...PIXEL_MODE_OPTIONS]}
              onChange={value => {
                setPixelMode(value);
                setPageSize(value === 'red' ? RED_PAGE_SIZE : value === 'blue' ? BLUE_PAGE_SIZE : DEFAULT_PAGE_SIZE);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className={`lottery-pixel-page-grid lottery-pixel-page-grid-${pageSize} lottery-pixel-page-grid-${pixelMode}`}>
            {visibleDraws.map(draw => (
              <LotteryPixelCard key={draw.id} draw={draw} mode={pixelMode} />
            ))}
          </div>
          <div className="lottery-pixel-pagination-row">
            <Pagination
              className="lottery-pixel-pagination"
              current={currentPage}
              pageSize={pageSize}
              total={sortedDraws.length}
              showSizeChanger={false}
              showLessItems
              onChange={setCurrentPage}
            />
            <Select
              className="lottery-pixel-page-size-select"
              value={pageSize}
              options={pageSizeOptions.map(value => ({ value, label: `${value}` }))}
              onChange={value => {
                setPageSize(value);
                setCurrentPage(1);
              }}
            />
          </div>
        </>
      ) : (
        <Empty description={false} />
      )}
    </div>
  );
};

export default LotteryPixelCardPage;
