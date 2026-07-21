interface LotteryNumberSelectorProps {
  selectedRedNumbers: string[];
  selectedBlueNumber: string;
  onRedNumberClick: (number: string) => void;
  onBlueNumberClick: (number: string) => void;
}

const RED_NUMBERS = Array.from({ length: 33 }, (_, i) => String(i + 1).padStart(2, '0'));
const BLUE_NUMBERS = Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(2, '0'));
const MAX_RED_SELECTIONS = 6;

const LotteryNumberSelector = ({
  selectedRedNumbers,
  selectedBlueNumber,
  onRedNumberClick,
  onBlueNumberClick
}: LotteryNumberSelectorProps) => {
  const selectedRedSet = new Set(selectedRedNumbers);

  const handleRedClick = (number: string) => {
    if (selectedRedSet.has(number)) {
      onRedNumberClick(number);
    } else if (selectedRedNumbers.length < MAX_RED_SELECTIONS) {
      onRedNumberClick(number);
    }
  };

  return (
    <div className="lottery-number-selector">
      <div className="lottery-number-selector-section">
        <div className="lottery-number-selector-section-head">
          <strong>红球 01-33</strong>
          <span>已选 {selectedRedNumbers.length}/{MAX_RED_SELECTIONS}</span>
        </div>
        <div className="lottery-number-selector-grid lottery-number-selector-grid-red">
          {RED_NUMBERS.map(number => {
            const isSelected = selectedRedSet.has(number);
            return (
              <button
                key={number}
                type="button"
                className={`lottery-number-selector-ball lottery-number-selector-ball-red${isSelected ? ' lottery-number-selector-ball-selected' : ''}`}
                onClick={() => handleRedClick(number)}
                disabled={!isSelected && selectedRedNumbers.length >= MAX_RED_SELECTIONS}
              >
                {number}
              </button>
            );
          })}
        </div>
      </div>
      <div className="lottery-number-selector-section">
        <div className="lottery-number-selector-section-head">
          <strong>蓝球 01-16</strong>
          <span>{selectedBlueNumber ? `已选 ${selectedBlueNumber}` : '未选择'}</span>
        </div>
        <div className="lottery-number-selector-grid lottery-number-selector-grid-blue">
          {BLUE_NUMBERS.map(number => {
            const isSelected = selectedBlueNumber === number;
            return (
              <button
                key={number}
                type="button"
                className={`lottery-number-selector-ball lottery-number-selector-ball-blue${isSelected ? ' lottery-number-selector-ball-selected' : ''}`}
                onClick={() => onBlueNumberClick(number)}
              >
                {number}
              </button>
            );
          })}
        </div>
      </div>
      {selectedRedNumbers.length > 0 && (
        <div className="lottery-number-selector-summary">
          <div className="lottery-number-selector-summary-row">
            <span>已选红球</span>
            <div className="lottery-number-selector-summary-balls">
              {selectedRedNumbers.map(number => (
                <span key={number} className="lottery-number-selector-summary-ball lottery-number-selector-summary-ball-red">
                  {number}
                </span>
              ))}
            </div>
          </div>
          {selectedBlueNumber && (
            <div className="lottery-number-selector-summary-row">
              <span>已选蓝球</span>
              <span className="lottery-number-selector-summary-ball lottery-number-selector-summary-ball-blue">
                {selectedBlueNumber}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LotteryNumberSelector;