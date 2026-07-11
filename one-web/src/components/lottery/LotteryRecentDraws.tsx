import { Card, Empty } from 'antd';
import LotteryBalls from './LotteryBalls';
import { useI18n } from '../../contexts/I18nContext';
import { localizeLotteryCombination } from '../../i18n/formatLotteryText';
import type { LotteryDraw } from '../../utils/lotteryStats';

interface LotteryRecentDrawsProps {
  draws: LotteryDraw[];
  onSelect: (draw: LotteryDraw) => void;
}

const LotteryRecentDraws = ({ draws, onSelect }: LotteryRecentDrawsProps) => {
  const { t, translateText } = useI18n();

  return (
    <Card className="life-panel-card lottery-recent-card">
      <div className="lottery-card-title-row">
        <div>
          <h2>{t('最近开奖')}</h2>
          <p>{t('保留期号、号码、奇偶、和值和卦象，点击查看完整结构。')}</p>
        </div>
      </div>

      {draws.length === 0 ? (
        <Empty description={t('暂无开奖数据')} />
      ) : (
        <div className="lottery-draw-grid">
          {draws.map(draw => (
            <button key={draw.id} type="button" className="lottery-draw-card" onClick={() => onSelect(draw)}>
              <div className="lottery-draw-card-head">
                <strong>{t('第 {{period}} 期', { period: draw.period })}</strong>
                <span>{localizeLotteryCombination(draw.combination, t, translateText)}</span>
              </div>
              <LotteryBalls redNumbers={draw.redNumbers} blueNumber={draw.blueNumber} />
              <div className="lottery-draw-meta">
                <span>{t('和值')} {draw.redSum}</span>
                <span>{translateText(draw.hexagramName)}</span>
                <span>{translateText(draw.planetName)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
};

export default LotteryRecentDraws;
