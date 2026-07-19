import React, { useState } from 'react';
import AnalysisLayout from './AnalysisLayout';

const LotteryAnalysisPredictionPage: React.FC<{ isTabVisible: boolean }> = ({ isTabVisible }) => {

  const [predictionRedNumbers, setPredictionRedNumbers] = useState<string[]>([]);
  const [predictionBlueNumber, setPredictionBlueNumber] = useState<string>('');
  const [isShaking, setIsShaking] = useState(false);

  const generateRandomNumbers = () => {
    const redPool = Array.from({ length: 33 }, (_, i) => {
      const num = i + 1;
      return num < 10 ? `0${num}` : `${num}`;
    });

    const redNumbers: string[] = [];
    const shuffledRed = [...redPool].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 6; i++) {
      redNumbers.push(shuffledRed[i]);
    }
    redNumbers.sort((a, b) => parseInt(a) - parseInt(b));

    const bluePool = Array.from({ length: 16 }, (_, i) => {
      const num = i + 1;
      return num < 10 ? `0${num}` : `${num}`;
    });
    const blueNumber = bluePool[Math.floor(Math.random() * bluePool.length)];

    return { redNumbers, blueNumber };
  };

  const handleShake = () => {
    setIsShaking(true);

    const shakeInterval = setInterval(() => {
      const { redNumbers, blueNumber } = generateRandomNumbers();
      setPredictionRedNumbers(redNumbers);
      setPredictionBlueNumber(blueNumber);
    }, 100);

    setTimeout(() => {
      clearInterval(shakeInterval);
      const { redNumbers, blueNumber } = generateRandomNumbers();
      setPredictionRedNumbers(redNumbers);
      setPredictionBlueNumber(blueNumber);
      setIsShaking(false);
    }, 3000);
  };

  return (
    <AnalysisLayout isTabVisible={isTabVisible}>
      <div style={{ 
        padding: '48px 16px 16px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#f5222d',
          marginBottom: '30px'
        }}>

        </div>

        <div style={{
          position: 'fixed',
          bottom: '160px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'nowrap',
          zIndex: 1000
        }}>
          {predictionRedNumbers.map((num, index) => (
            <div 
              key={`red-${index}`}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #ff6b6b 0%, #f5222d 70%, #c9184a 100%)',
                color: '#000',
                fontSize: '24px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 6px 16px rgba(245, 34, 45, 0.4), 0 2px 8px rgba(245, 34, 45, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(193, 53, 53, 0.5)',
                animation: isShaking ? 'shake 0.5s infinite' : 'none',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              {num}
            </div>
          ))}

          <div 
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #4da6ff 0%, #1890ff 70%, #0050b3 100%)',
              color: '#000',
              fontSize: '32px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 6px 20px rgba(24, 144, 255, 0.4), 0 2px 10px rgba(24, 144, 255, 0.2), inset 0 2px 6px rgba(255, 255, 255, 0.3), inset 0 -2px 6px rgba(0, 72, 186, 0.5)',
              animation: isShaking ? 'shake 0.5s infinite' : 'none',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {predictionBlueNumber}
          </div>
        </div>

        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000
        }}>
          <button
            onClick={handleShake}
            disabled={isShaking}
            style={{
              padding: '16px 48px',
              fontSize: '18px',
              fontWeight: 'bold',
              backgroundColor: isShaking ? '#d9d9d9' : '#52c41a',
              color: '#000',
              border: 'none',
              borderRadius: '32px',
              cursor: isShaking ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: isShaking ? 'none' : '0 4px 16px rgba(82, 196, 26, 0.3)',
              animation: isShaking ? 'pulse 1s infinite' : 'none'
            }}
          >
            {isShaking ? '预测中' : '开始'}
          </button>
        </div>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            25% { transform: translateX(-10px) rotate(-5deg); }
            50% { transform: translateX(10px) rotate(5deg); }
            75% { transform: translateX(-10px) rotate(-5deg); }
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
      </div>
    </AnalysisLayout>
  );
};

export default LotteryAnalysisPredictionPage;
