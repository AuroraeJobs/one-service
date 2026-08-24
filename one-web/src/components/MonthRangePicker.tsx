import { useState } from 'react';
import { Button, Popover } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { addMonths, monthToIndex, type MonthRangeValue, type MonthValue } from '../utils/monthRange';

interface MonthRangePickerProps {
  value?: MonthRangeValue;
  onChange: (value?: MonthRangeValue) => void;
  isEnglish?: boolean;
}

const MONTH_NAMES_ZH = Array.from({ length: 12 }, (_, index) => `${index + 1}月`);
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MonthRangePicker = ({ value, onChange, isEnglish = false }: MonthRangePickerProps) => {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [panelYear, setPanelYear] = useState(value?.[0].year ?? today.getFullYear());
  const [selectionTarget, setSelectionTarget] = useState<'start' | 'end'>('start');

  const text = {
    title: isEnglish ? 'Time Range' : '时间范围',
    start: isEnglish ? 'START' : '开始',
    end: isEnglish ? 'END' : '结束',
    months: isEnglish ? 'months' : '个月',
    allTime: isEnglish ? 'All time' : '全部时间',
    currentYear: isEnglish ? 'This year' : '本年',
    threeMonths: isEnglish ? '3 months' : '3个月',
    sixMonths: isEnglish ? '6 months' : '6个月',
    oneYear: isEnglish ? '1 year' : '1年',
    clear: isEnglish ? 'Clear' : '清除'
  };
  const monthNames = isEnglish ? MONTH_NAMES_EN : MONTH_NAMES_ZH;
  const startIndex = value ? monthToIndex(value[0]) : undefined;
  const endIndex = value ? monthToIndex(value[1]) : undefined;
  const monthCount = value ? (endIndex! - startIndex! + 1) : 0;

  const formatMonth = (monthValue?: MonthValue) => {
    if (!monthValue) return '—';
    return isEnglish
      ? `${MONTH_NAMES_EN[monthValue.month - 1]} ${monthValue.year}`
      : `${monthValue.year}年${monthValue.month}月`;
  };

  const triggerLabel = value
    ? `${formatMonth(value[0])} — ${formatMonth(value[1])}`
    : text.allTime;

  const selectMonth = (month: number) => {
    const selected = { year: panelYear, month };
    if (!value || selectionTarget === 'start') {
      onChange([selected, selected]);
      setSelectionTarget('end');
      return;
    }
    const start = value[0];
    const nextRange: MonthRangeValue = monthToIndex(selected) < monthToIndex(start)
      ? [selected, start]
      : [start, selected];
    onChange(nextRange);
    setSelectionTarget('start');
  };

  const applyRecentMonths = (count: number) => {
    const end = value?.[1] ?? { year: today.getFullYear(), month: today.getMonth() + 1 };
    const start = addMonths(end, -(count - 1));
    onChange([start, end]);
    setPanelYear(start.year);
    setSelectionTarget('start');
  };

  const panel = (
    <div className="month-range-panel">
      <div className="month-range-panel-header">
        <strong>{text.title}</strong>
        {value && <span>{monthCount} {text.months}</span>}
      </div>

      <div className="month-range-calendar">
        <div className="month-range-summary">
          <button
            type="button"
            className={selectionTarget === 'start' ? 'is-active' : ''}
            onClick={() => {
              setSelectionTarget('start');
              if (value) setPanelYear(value[0].year);
            }}
          >
            <small>{text.start}</small>
            <strong>{formatMonth(value?.[0])}</strong>
          </button>
          <i />
          <button
            type="button"
            className={selectionTarget === 'end' ? 'is-active' : ''}
            onClick={() => {
              setSelectionTarget('end');
              if (value) setPanelYear(value[1].year);
            }}
          >
            <small>{text.end}</small>
            <strong>{formatMonth(value?.[1])}</strong>
          </button>
        </div>

        <div className="month-range-year-row">
          <Button type="text" aria-label={isEnglish ? 'Previous year' : '上一年'} icon={<LeftOutlined />} onClick={() => setPanelYear(year => year - 1)} />
          <strong>{isEnglish ? panelYear : `${panelYear}年`}</strong>
          <Button type="text" aria-label={isEnglish ? 'Next year' : '下一年'} icon={<RightOutlined />} onClick={() => setPanelYear(year => year + 1)} />
        </div>

        <div className="month-range-grid">
          {monthNames.map((label, index) => {
            const month = index + 1;
            const currentIndex = monthToIndex({ year: panelYear, month });
            const isStart = startIndex === currentIndex;
            const isEnd = endIndex === currentIndex;
            const isRange = startIndex !== undefined && endIndex !== undefined && currentIndex >= startIndex && currentIndex <= endIndex;
            return (
              <button
                type="button"
                key={month}
                aria-label={`${panelYear}-${String(month).padStart(2, '0')}`}
                aria-pressed={isStart || isEnd}
                className={`${isRange ? 'is-range' : ''} ${isStart ? 'is-start' : ''} ${isEnd ? 'is-end' : ''}`.trim()}
                onClick={() => selectMonth(month)}
              >
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="month-range-presets">
        <Button onClick={() => onChange([{ year: panelYear, month: 1 }, { year: panelYear, month: 12 }])}>{text.currentYear}</Button>
        <Button onClick={() => applyRecentMonths(3)}>{text.threeMonths}</Button>
        <Button onClick={() => applyRecentMonths(6)}>{text.sixMonths}</Button>
        <Button onClick={() => applyRecentMonths(12)}>{text.oneYear}</Button>
        <Button type="text" onClick={() => { onChange(undefined); setSelectionTarget('start'); }}>{text.clear}</Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={panel}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      open={open}
      onOpenChange={nextOpen => {
        setOpen(nextOpen);
        if (nextOpen && value) setPanelYear(value[0].year);
      }}
      rootClassName="month-range-popover"
    >
      <Button className="month-range-trigger" aria-label={text.title}>
        {triggerLabel}
      </Button>
    </Popover>
  );
};

export default MonthRangePicker;
