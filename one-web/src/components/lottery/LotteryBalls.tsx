interface LotteryBallsProps {
  redNumbers: string[];
  blueNumber: string;
}

const LotteryBalls = ({ redNumbers, blueNumber }: LotteryBallsProps) => (
  <div className="lottery-balls">
    {redNumbers.map(number => (
      <span key={number} className="lottery-ball lottery-ball-red">
        {number}
      </span>
    ))}
    <span className="lottery-ball lottery-ball-blue">{blueNumber}</span>
  </div>
);

export default LotteryBalls;
