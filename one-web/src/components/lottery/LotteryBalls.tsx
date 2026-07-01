interface LotteryBallsProps {
  redNumbers: string[];
  blueNumber: string;
  hitRedNumbers?: string[];
  hitBlueNumber?: string;
}

const LotteryBalls = ({ redNumbers, blueNumber, hitRedNumbers = [], hitBlueNumber }: LotteryBallsProps) => {
  const hitRedSet = new Set(hitRedNumbers);
  const hasHitReference = hitRedNumbers.length > 0 || Boolean(hitBlueNumber);

  return (
    <div className="lottery-balls">
      {redNumbers.map(number => {
        const isHit = hitRedSet.has(number);
        return (
          <span
            key={number}
            className={`lottery-ball lottery-ball-red${isHit ? ' lottery-ball-hit' : ''}${hasHitReference && !isHit ? ' lottery-ball-miss' : ''}`}
          >
            {number}
          </span>
        );
      })}
      <span
        className={`lottery-ball lottery-ball-blue${blueNumber === hitBlueNumber ? ' lottery-ball-hit' : ''}${hasHitReference && blueNumber !== hitBlueNumber ? ' lottery-ball-miss' : ''}`}
      >
        {blueNumber}
      </span>
    </div>
  );
};

export default LotteryBalls;
