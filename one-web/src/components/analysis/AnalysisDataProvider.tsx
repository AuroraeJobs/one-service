import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  OpenAIOutlined,
  LinuxOutlined,
  DribbbleOutlined,
  DingdingOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { useRecordContext } from '../../contexts/RecordContext';
import { GLOBAL_COMBINATION_COLORS } from '../../constants/colors';
import { HEXAGRAMS } from '../../constants/hexagrams';

interface ChartDataItem {
  period: number;
  number: string;
  count: number;
}

const globalCombinationColors = GLOBAL_COMBINATION_COLORS;

const getAnalysisTabKey = (search: string, pathname?: string) => {
  // First try query param (?tab=illusion)
  const tab = new URLSearchParams(search).get('tab');
  const tabMap: Record<string, string> = {
    accumulate: '1',
    planet: '2',
    energy: '3',
    illusion: '4',
    prediction: '5',
    position: '6',
    collect: '7'
  };
  if (tab && tabMap[tab]) return tabMap[tab];

  // Then try pathname (/lottery/analysis/illusion)
  if (pathname) {
    const pathToKey: Record<string, string> = {
      illusion: '4',
      planet: '2',
      energy: '3',
      accumulate: '1',
      prediction: '5',
      position: '6',
      collect: '7'
    };
    const match = pathname.match(/\/lottery\/analysis\/(\w+)/);
    if (match && pathToKey[match[1]]) return pathToKey[match[1]];
  }

  return undefined;
};

interface PositionAnalysisItem {
  position: number;
  numberCounts: Record<string, number>;
}

export interface AnalysisDataContextType {
  allRecords: string[];
  setAllRecords: React.Dispatch<React.SetStateAction<string[]>>;
  sliderRange: [number, number];
  setSliderRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  statisticType: 'red' | 'blue';
  setStatisticType: React.Dispatch<React.SetStateAction<'red' | 'blue'>>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  isHiddenIconDragging: boolean;
  setIsHiddenIconDragging: React.Dispatch<React.SetStateAction<boolean>>;
  hiddenIconPosition: { x: number; y: number };
  setHiddenIconPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  hiddenIconDragOffset: { x: number; y: number };
  setHiddenIconDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  buttonPosition: { x: number; y: number };
  setButtonPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  dragOffset: { x: number; y: number };
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  isSliderDragging: boolean;
  setIsSliderDragging: React.Dispatch<React.SetStateAction<boolean>>;
  sliderPosition: { x: number; y: number };
  setSliderPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  sliderDragOffset: { x: number; y: number };
  setSliderDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  isSliderFixed: boolean;
  setIsSliderFixed: React.Dispatch<React.SetStateAction<boolean>>;
  sliderSize: { width: number; height: number };
  isSliderHidden: boolean;
  setIsSliderHidden: React.Dispatch<React.SetStateAction<boolean>>;
  selectedNumbers: string[];
  setSelectedNumbers: React.Dispatch<React.SetStateAction<string[]>>;
  showNumberSelector: boolean;
  setShowNumberSelector: React.Dispatch<React.SetStateAction<boolean>>;
  isSelectorDragging: boolean;
  setIsSelectorDragging: React.Dispatch<React.SetStateAction<boolean>>;
  isButtonDragging: boolean;
  setIsButtonDragging: React.Dispatch<React.SetStateAction<boolean>>;
  selectorPosition: { x: number; y: number };
  setSelectorPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  floatingButtonPosition: { x: number; y: number };
  setFloatingButtonPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  selectorDragOffset: { x: number; y: number };
  setSelectorDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  buttonDragOffset: { x: number; y: number };
  setButtonDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  isTabContainerDragging: boolean;
  setIsTabContainerDragging: React.Dispatch<React.SetStateAction<boolean>>;
  tabContainerPosition: { x: number; y: number };
  setTabContainerPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  tabContainerDragOffset: { x: number; y: number };
  setTabContainerDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  chartData: ChartDataItem[];
  setChartData: React.Dispatch<React.SetStateAction<ChartDataItem[]>>;
  oddEvenData: Array<{ period: number; oddCount: number; evenCount: number }>;
  setOddEvenData: React.Dispatch<React.SetStateAction<Array<{ period: number; oddCount: number; evenCount: number }>>>;
  oddEvenCombinationData: Array<{ combination: string; count: number }>;
  setOddEvenCombinationData: React.Dispatch<React.SetStateAction<Array<{ combination: string; count: number }>>>;
  oddEvenCombinationAccumulatedData: Array<{ period: number; combinations: { [key: string]: number } }>;
  setOddEvenCombinationAccumulatedData: React.Dispatch<React.SetStateAction<Array<{ period: number; combinations: { [key: string]: number } }>>>;
  sumData: Array<{ period: number; sum: number }>;
  setSumData: React.Dispatch<React.SetStateAction<Array<{ period: number; sum: number }>>>;
  sumCountData: Array<{ sum: number; count: number }>;
  setSumCountData: React.Dispatch<React.SetStateAction<Array<{ sum: number; count: number }>>>;
  sumCombinationCountData: Array<{ sum: number; combinationCount: number }>;
  setSumCombinationCountData: React.Dispatch<React.SetStateAction<Array<{ sum: number; combinationCount: number }>>>;
  currentCombination: string;
  setCurrentCombination: React.Dispatch<React.SetStateAction<string>>;
  positionAnalysisData: PositionAnalysisItem[];
  setPositionAnalysisData: React.Dispatch<React.SetStateAction<PositionAnalysisItem[]>>;
  numberAccumulatedCountData: Array<{ number: string; count: number }>;
  setNumberAccumulatedCountData: React.Dispatch<React.SetStateAction<Array<{ number: string; count: number }>>>;
  selectedPeriod: number | null;
  setSelectedPeriod: React.Dispatch<React.SetStateAction<number | null>>;
  popupPosition: { x: number; y: number };
  setPopupPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  isPopupVisible: boolean;
  setIsPopupVisible: React.Dispatch<React.SetStateAction<boolean>>;
  selectedSums: number[];
  setSelectedSums: React.Dispatch<React.SetStateAction<number[]>>;
  sumMode: 'northern' | 'southern';
  setSumMode: React.Dispatch<React.SetStateAction<'northern' | 'southern'>>;
  isSumButtonDragging: boolean;
  setIsSumButtonDragging: React.Dispatch<React.SetStateAction<boolean>>;
  sumButtonPosition: { x: number; y: number };
  setSumButtonPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  sumButtonDragOffset: { x: number; y: number };
  setSumButtonDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  hexagonCurrentPage: number;
  setHexagonCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  hexagonPageSize: number;
  sumHexagonCurrentPage: number;
  setSumHexagonCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  sumHexagonPageSize: number;
  predictionRedNumbers: string[];
  setPredictionRedNumbers: React.Dispatch<React.SetStateAction<string[]>>;
  predictionBlueNumber: string;
  setPredictionBlueNumber: React.Dispatch<React.SetStateAction<string>>;
  isShaking: boolean;
  setIsShaking: React.Dispatch<React.SetStateAction<boolean>>;
  activeTabKey: string;
  setActiveTabKey: React.Dispatch<React.SetStateAction<string>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  currentPeriod: number;
  setCurrentPeriod: React.Dispatch<React.SetStateAction<number>>;
  globalCombinationColors: typeof GLOBAL_COMBINATION_COLORS;
  contextAllRecords: string[] | string;
  hasFetchedRef: React.MutableRefObject<boolean>;
  collectRulerRef: React.RefObject<HTMLDivElement | null>;
  trackMenuItems: Array<{ key: string; label: string; icon: any }>;
  activeTrackMenuItem: { key: string; label: string; icon: any };
  isTrackMenuActive: boolean;
  ActiveTrackIcon: any;
  handleSliderChange: (value: number[]) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleTabContainerMouseDown: (e: React.MouseEvent) => void;
  handleSliderMouseDown: (e: React.MouseEvent) => void;
  handleSliderDoubleClick: () => void;
  handleNumberSelect: (number: string) => void;
  clearAllSelections: () => void;
  generateNumberList: () => string[];
  parseRecords: (records: string[]) => void;
  location: ReturnType<typeof useLocation>;
  navigate: ReturnType<typeof useNavigate>;
}

const AnalysisDataContext = createContext<AnalysisDataContextType | null>(null);

export const useAnalysisData = () => {
  const context = useContext(AnalysisDataContext);
  if (!context) throw new Error('useAnalysisData must be used within AnalysisDataProvider');
  return context;
};

export const AnalysisDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [allRecords, setAllRecords] = useState<string[]>([]);
  const [sliderRange, setSliderRange] = useState<[number, number]>([0, 0]);
  const [statisticType, setStatisticType] = useState<'red' | 'blue'>('red');
  const hasFetchedRef = useRef(false);
  const collectRulerRef = useRef<HTMLDivElement>(null);
  const { allRecords: contextAllRecords } = useRecordContext();

  const [isDragging, setIsDragging] = useState(false);
  const [isHiddenIconDragging, setIsHiddenIconDragging] = useState(false);
  const [hiddenIconPosition, setHiddenIconPosition] = useState({
    x: window.innerWidth - 90,
    y: window.innerHeight - 200
  });
  const [hiddenIconDragOffset, setHiddenIconDragOffset] = useState({ x: 0, y: 0 });

  const [buttonPosition, setButtonPosition] = useState({
    x: window.innerWidth - 105,
    y: window.innerHeight - 140
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState({
    x: window.innerWidth - window.innerWidth / 3 - 20,
    y: window.innerHeight - 150 - 150
  });
  const [sliderDragOffset, setSliderDragOffset] = useState({ x: 0, y: 0 });
  const [isSliderFixed, setIsSliderFixed] = useState(true);
  const sliderSize = {
    width: window.innerWidth / 3,
    height: 150
  };
  const [isSliderHidden, setIsSliderHidden] = useState(true);
  const handleSliderDoubleClick = () => {
    setIsSliderHidden(!isSliderHidden);
  };

  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [showNumberSelector, setShowNumberSelector] = useState(false);
  const [isSelectorDragging, setIsSelectorDragging] = useState(false);
  const [isButtonDragging, setIsButtonDragging] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState({ x: 200, y: 0 });
  const [floatingButtonPosition, setFloatingButtonPosition] = useState({
    x: window.innerWidth - 90,
    y: window.innerHeight - 260
  });
  const [selectorDragOffset, setSelectorDragOffset] = useState({ x: 0, y: 0 });
  const [buttonDragOffset, setButtonDragOffset] = useState({ x: 0, y: 0 });
  const [isTabContainerDragging, setIsTabContainerDragging] = useState(false);
  const [tabContainerPosition, setTabContainerPosition] = useState({
    x: window.innerWidth / 2 - 200,
    y: window.innerHeight - 140
  });
  const [tabContainerDragOffset, setTabContainerDragOffset] = useState({ x: 0, y: 0 });

  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [oddEvenData, setOddEvenData] = useState<Array<{ period: number; oddCount: number; evenCount: number }>>([]);
  const [oddEvenCombinationData, setOddEvenCombinationData] = useState<Array<{ combination: string; count: number }>>([]);
  const [oddEvenCombinationAccumulatedData, setOddEvenCombinationAccumulatedData] = useState<Array<{ period: number; combinations: { [key: string]: number } }>>([]);

  const [sumData, setSumData] = useState<Array<{ period: number; sum: number }>>([]);
  const [sumCountData, setSumCountData] = useState<Array<{ sum: number; count: number }>>([]);
  const [sumCombinationCountData, setSumCombinationCountData] = useState<Array<{ sum: number; combinationCount: number }>>([]);
  const [currentCombination, setCurrentCombination] = useState<string>('3奇3偶');

  const [positionAnalysisData, setPositionAnalysisData] = useState<PositionAnalysisItem[]>([]);

  const [numberAccumulatedCountData, setNumberAccumulatedCountData] = useState<Array<{ number: string; count: number }>>([]);

  useEffect(() => {
    let allPossibleCombinations: string[];
    if (statisticType === 'red') {
      allPossibleCombinations = ['地球', '水星', '金星', '火星', '木星', '土星', '天王星'];
    } else {
      allPossibleCombinations = ['太阳', '月亮'];
    }

    if (!allPossibleCombinations.includes(currentCombination)) {
      setCurrentCombination(allPossibleCombinations[0]);
    }
  }, [statisticType, currentCombination]);

  useEffect(() => {
    setHexagonCurrentPage(1);
  }, [currentCombination]);

  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [selectedSums, setSelectedSums] = useState<number[]>([]);
  const [sumMode, setSumMode] = useState<'northern' | 'southern'>('northern');
  const [isSumButtonDragging, setIsSumButtonDragging] = useState(false);
  const [sumButtonPosition, setSumButtonPosition] = useState({
    x: window.innerWidth - 105,
    y: window.innerHeight - 260
  });
  const [sumButtonDragOffset, setSumButtonDragOffset] = useState({ x: 0, y: 0 });
  const [hexagonCurrentPage, setHexagonCurrentPage] = useState(1);
  const [hexagonPageSize] = useState(48);
  const [sumHexagonCurrentPage, setSumHexagonCurrentPage] = useState(1);
  const [sumHexagonPageSize] = useState(48);

  useEffect(() => {
    const handleClickOutside = () => {
      setIsPopupVisible(false);
    };

    if (isPopupVisible) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isPopupVisible]);

  const handleNumberSelect = (number: string) => {
    const newSelectedNumbers = selectedNumbers.includes(number)
      ? selectedNumbers.filter(n => n !== number)
      : [...selectedNumbers, number];

    setSelectedNumbers(newSelectedNumbers);
  };

  const clearAllSelections = () => {
    setSelectedNumbers([]);
  };

  const parseRecords = (records: string[]) => {
    if (!records || records.length === 0) return;

    const parsedOddEvenData: Array<{ period: number; oddCount: number; evenCount: number }> = [];

    const combinationCount: { [key: string]: number } = {};

    const combinationToNameMap: { [key: string]: string } = {};

    const numberCount: { [key: string]: number } = {};
    const allNumbers = generateNumberList();
    allNumbers.forEach(number => {
      numberCount[number] = 0;
    });

    if (statisticType === 'red') {
      combinationToNameMap['0奇6偶'] = '地球';
      combinationToNameMap['1奇5偶'] = '水星';
      combinationToNameMap['2奇4偶'] = '金星';
      combinationToNameMap['3奇3偶'] = '火星';
      combinationToNameMap['4奇2偶'] = '木星';
      combinationToNameMap['5奇1偶'] = '土星';
      combinationToNameMap['6奇0偶'] = '天王星';

      combinationCount['水星'] = 0;
      combinationCount['金星'] = 0;
      combinationCount['地球'] = 0;
      combinationCount['火星'] = 0;
      combinationCount['木星'] = 0;
      combinationCount['土星'] = 0;
      combinationCount['天王星'] = 0;
    } else {
      combinationToNameMap['1奇0偶'] = '太阳';
      combinationToNameMap['0奇1偶'] = '月亮';

      combinationCount['太阳'] = 0;
      combinationCount['月亮'] = 0;
    }

    const hexagramCount: { [key: string]: number } = {};
    Object.values(HEXAGRAMS).forEach(hexagram => {
      hexagramCount[hexagram.name] = 0;
    });

    const parsedOddEvenCombinationAccumulatedData: Array<{ period: number; combinations: { [key: string]: number } }> = [];

    const accumulatedCount: { [key: string]: number } = { ...combinationCount };

    records.forEach((record, index) => {
      if (typeof record === 'string') {
        let numbers: string[];

        if (statisticType === 'red') {
          numbers = [];
          for (let i = 0; i < 12; i += 2) {
            numbers.push(record.substring(i, i + 2));
          }
        } else {
          numbers = [record.substring(12, 14)];
        }

        let oddCount = 0;
        let evenCount = 0;

        numbers.forEach(number => {
          const num = parseInt(number, 10);
          if (num % 2 === 0) {
            evenCount++;
          } else {
            oddCount++;
          }

          if (numberCount[number] !== undefined) {
            numberCount[number]++;
          }
        });

        parsedOddEvenData.push({
          period: index + 1,
          oddCount,
          evenCount
        });

        const originalCombination = `${oddCount}奇${evenCount}偶`;
        const combination = combinationToNameMap[originalCombination] || originalCombination;
        if (combination in combinationCount) {
          combinationCount[combination]++;
          accumulatedCount[combination]++;
        }

        if (statisticType === 'red') {
          const hexagramCode = numbers.map(num => {
            const n = parseInt(num, 10);
            return n % 2 === 1 ? '1' : '0';
          }).join('');

          const hexagram = HEXAGRAMS[hexagramCode as keyof typeof HEXAGRAMS] || { name: '坤' };
          if (hexagramCount[hexagram.name] !== undefined) {
            hexagramCount[hexagram.name]++;
          }
        }

        parsedOddEvenCombinationAccumulatedData.push({
          period: index + 1,
          combinations: { ...accumulatedCount }
        });
      }
    });

    setOddEvenData(parsedOddEvenData);

    const combinationData = Object.entries(combinationCount).map(([combination, count]) => ({
      combination,
      count
    }));

    setOddEvenCombinationData(combinationData);

    setOddEvenCombinationAccumulatedData(parsedOddEvenCombinationAccumulatedData);

    const numberAccumulatedData = Object.entries(numberCount).map(([number, count]) => ({
      number,
      count
    }))
    .sort((a, b) => parseInt(a.number) - parseInt(b.number));

    setNumberAccumulatedCountData(numberAccumulatedData);
  };

  const generateNumberList = () => {
    if (statisticType === 'red') {
      return Array.from({ length: 33 }, (_, i) => {
        const num = i + 1;
        return num < 10 ? `0${num}` : `${num}`;
      });
    } else {
      return Array.from({ length: 16 }, (_, i) => {
        const num = i + 1;
        return num < 10 ? `0${num}` : `${num}`;
      });
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setTabContainerPosition(prev => ({
        x: window.innerWidth / 2 - 150,
        y: prev.y
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [predictionRedNumbers, setPredictionRedNumbers] = useState<string[]>([]);
  const [predictionBlueNumber, setPredictionBlueNumber] = useState<string>('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!contextAllRecords || contextAllRecords.length === 0) return;
    hasFetchedRef.current = true;

    try {
      let recordsToUse: string[];
      if (typeof contextAllRecords === 'string') {
        recordsToUse = contextAllRecords
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
        message.success(`成功获取 ${recordsToUse.length} 条记录`);
      } else if (Array.isArray(contextAllRecords)) {
        recordsToUse = contextAllRecords;
        message.success(`成功获取 ${recordsToUse.length} 条记录`);
      } else {
        recordsToUse = [
          '01020304050607',
          '08091011121301',
          '14151617181902',
          '20212223242503',
          '26272829303104',
          '32330102030405',
          '05060708091006',
          '11121314151607',
          '17181920212208',
          '23242526272809',
          '29303132330110',
          '02030405060711',
          '08091011121312',
          '14151617181913',
          '20212223242514',
          '26272829303115',
          '32330102030416',
          '05060708091001',
          '11121314151602',
          '17181920212203'
        ];
        message.info(`使用模拟数据，共 ${recordsToUse.length} 条记录`);
      }

      setAllRecords(recordsToUse);
      const initialRange: [number, number] = [0, Math.max(0, recordsToUse.length - 1)];
      setSliderRange(initialRange);
      parseRecords(recordsToUse);
    } catch (error) {
      console.error('处理记录失败:', error);
      const recordsToUse = [
        '01020304050607',
        '08091011121301',
        '14151617181902',
        '20212223242503',
        '26272829303104',
        '32330102030405',
        '05060708091006',
        '11121314151607',
        '17181920212208',
        '23242526272809',
        '29303132330110',
        '02030405060711',
        '08091011121312',
        '14151617181913',
        '20212223242514',
        '26272829303115',
        '32330102030416',
        '05060708091001',
        '11121314151602',
        '17181920212203'
      ];
      setAllRecords(recordsToUse);
      const initialRange: [number, number] = [0, recordsToUse.length - 1];
      setSliderRange(initialRange);
      parseRecords(recordsToUse);
      message.info(`处理记录失败，使用模拟数据，共 ${recordsToUse.length} 条记录`);
    }
  }, [contextAllRecords]);

  useEffect(() => {
    setOddEvenCombinationData([]);
    setOddEvenCombinationAccumulatedData([]);
    setSumData([]);
    setSumCountData([]);
    setSumCombinationCountData([]);
  }, [statisticType]);

  useEffect(() => {
    if (allRecords.length > 0) {
      const [startIndex, endIndex] = sliderRange;
      const selectedRangeRecords = allRecords.slice(startIndex, endIndex + 1);
      parseRecords(selectedRangeRecords);
    }
  }, [statisticType, allRecords, sliderRange]);

  useEffect(() => {
    if (selectedNumbers.length === 0 || allRecords.length === 0) {
      setChartData([]);
      return;
    }

    const [startIndex, endIndex] = sliderRange;
    const selectedRangeRecords = allRecords.slice(startIndex, endIndex + 1);

    const chartData: ChartDataItem[] = [];
    const cumulativeCounts: { [key: string]: number } = {};

    selectedNumbers.forEach(num => {
      cumulativeCounts[num] = 0;
    });

    selectedRangeRecords.forEach((record, index) => {
      const period = startIndex + index + 1;

      const isRed = statisticType === 'red';
      const currentNumbers: string[] = [];

      if (isRed) {
        for (let i = 0; i < 12; i += 2) {
          currentNumbers.push(record.substring(i, i + 2));
        }
      } else {
        currentNumbers.push(record.substring(12, 14));
      }

      selectedNumbers.forEach(num => {
        if (currentNumbers.includes(num)) {
          cumulativeCounts[num]++;
        }

        chartData.push({
          period: period,
          number: num,
          count: cumulativeCounts[num]
        });
      });
    });

    setChartData(chartData);
  }, [selectedNumbers, allRecords, statisticType, sliderRange]);

  useEffect(() => {
    if (allRecords.length === 0) {
      setOddEvenData([]);
      return;
    }

    const [startIndex, endIndex] = sliderRange;
    const selectedRangeRecords = allRecords.slice(startIndex, endIndex + 1);

    const oddEvenData = selectedRangeRecords.map((record, index) => {
      const period = startIndex + index + 1;
      const isRed = statisticType === 'red';
      const numbers: string[] = [];

      if (isRed) {
        for (let i = 0; i < 12; i += 2) {
          numbers.push(record.substring(i, i + 2));
        }
      } else {
        numbers.push(record.substring(12, 14));
      }

      let oddCount = 0;
      let evenCount = 0;

      numbers.forEach(number => {
        const num = parseInt(number);
        if (num % 2 === 0) {
          evenCount++;
        } else {
          oddCount++;
        }
      });

      return { period, oddCount, evenCount };
    });

    setOddEvenData(oddEvenData);
  }, [allRecords, statisticType, sliderRange]);

  useEffect(() => {
    if (allRecords.length === 0) {
      setSumData([]);
      setSumCountData([]);
      return;
    }

    const [startIndex, endIndex] = sliderRange;
    const selectedRangeRecords = allRecords.slice(startIndex, endIndex + 1);

    const sumData = selectedRangeRecords.map((record, index) => {
      const period = startIndex + index + 1;
      const isRed = statisticType === 'red';
      const numbers: string[] = [];

      if (isRed) {
        for (let i = 0; i < 12; i += 2) {
          numbers.push(record.substring(i, i + 2));
        }
      } else {
        numbers.push(record.substring(12, 14));
      }

      const sum = numbers.reduce((total, number) => {
        return total + parseInt(number);
      }, 0);

      return { period, sum };
    });

    setSumData(sumData);

    const sumCountMap: { [key: number]: number } = {};
    sumData.forEach(item => {
      const sum = item.sum;
      sumCountMap[sum] = (sumCountMap[sum] || 0) + 1;
    });

    const sumCountArray = Object.entries(sumCountMap)
      .map(([sum, count]) => ({ sum: parseInt(sum), count }))
      .sort((a, b) => a.sum - b.sum);

    setSumCountData(sumCountArray);
  }, [allRecords, statisticType, sliderRange]);

  useEffect(() => {
    if (allRecords.length === 0) {
      setPositionAnalysisData([]);
      return;
    }

    const [startIndex, endIndex] = sliderRange;
    const selectedRangeRecords = allRecords.slice(startIndex, endIndex + 1);

    const positionCount = statisticType === 'red' ? 6 : 1;
    const initialPositionData: PositionAnalysisItem[] = Array.from({ length: positionCount }, (_, i) => ({
      position: i + 1,
      numberCounts: {}
    }));

    selectedRangeRecords.forEach(record => {
      if (typeof record === 'string') {
        for (let position = 0; position < positionCount; position++) {
          let number: string;
          if (statisticType === 'red') {
            number = record.substring(position * 2, position * 2 + 2);
          } else {
            number = record.substring(12, 14);
          }

          initialPositionData[position].numberCounts[number] =
            (initialPositionData[position].numberCounts[number] || 0) + 1;
        }
      }
    });

    setPositionAnalysisData(initialPositionData);
  }, [allRecords, statisticType, sliderRange]);

  useEffect(() => {
    if (statisticType === 'red') {
      const redBalls = Array.from({ length: 33 }, (_, i) => i + 1);
      const combinations: number[][] = [];

      const generateCombinations = (arr: number[], len: number, start: number, current: number[]) => {
        if (current.length === len) {
          combinations.push([...current]);
          return;
        }
        for (let i = start; i < arr.length; i++) {
          current.push(arr[i]);
          generateCombinations(arr, len, i + 1, current);
          current.pop();
        }
      };

      generateCombinations(redBalls, 6, 0, []);

      const sumCombinationMap: { [key: number]: number } = {};
      combinations.forEach(combination => {
        const sum = combination.reduce((total, num) => total + num, 0);
        sumCombinationMap[sum] = (sumCombinationMap[sum] || 0) + 1;
      });

      const sumCombinationArray = Object.entries(sumCombinationMap)
        .map(([sum, combinationCount]) => ({ sum: parseInt(sum), combinationCount }))
        .sort((a, b) => a.sum - b.sum);

      setSumCombinationCountData(sumCombinationArray);
    } else {
      const blueBalls = Array.from({ length: 16 }, (_, i) => i + 1);
      const sumCombinationArray = blueBalls.map(ball => ({
        sum: ball,
        combinationCount: 1
      }));

      setSumCombinationCountData(sumCombinationArray);
    }
  }, [statisticType]);

  const handleSliderChange = (value: number[]) => {
    const range = value as [number, number];
    setSliderRange(range);
    const selectedRecords = allRecords.slice(range[0], range[1] + 1);
    parseRecords(selectedRecords);
  };

  const [activeTabKey, setActiveTabKey] = useState<string>('4');
  const trackMenuItems = [
    { key: '2', label: '星球', icon: OpenAIOutlined },
    { key: '3', label: '能量', icon: LinuxOutlined },
    { key: '1', label: '累计', icon: DribbbleOutlined },
    { key: '7', label: '集齐', icon: DingdingOutlined },
    { key: '6', label: '位置', icon: ExperimentOutlined }
  ];
  const activeTrackMenuItem = trackMenuItems.find(item => item.key === activeTabKey) || trackMenuItems[0];
  const isTrackMenuActive = trackMenuItems.some(item => item.key === activeTabKey);
  const ActiveTrackIcon = activeTrackMenuItem.icon;

  useEffect(() => {
    const nextTabKey = getAnalysisTabKey(location.search, location.pathname);
    if (nextTabKey) {
      setActiveTabKey(nextTabKey);
    }
  }, [location.search, location.pathname]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  const [currentPeriod, setCurrentPeriod] = useState<number>(0);

  useEffect(() => {
    if (activeTabKey !== '7') return;

    const rulerElement = collectRulerRef.current;
    if (!rulerElement) return;

    const handleCollectRulerWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      setCurrentPeriod(previousPeriod => {
        if (event.deltaX > 0 && previousPeriod < allRecords.length - 1) {
          return previousPeriod + 1;
        }
        if (event.deltaX < 0 && previousPeriod > 0) {
          return previousPeriod - 1;
        }
        return previousPeriod;
      });
    };

    rulerElement.addEventListener('wheel', handleCollectRulerWheel, { passive: false });
    return () => {
      rulerElement.removeEventListener('wheel', handleCollectRulerWheel);
    };
  }, [activeTabKey, allRecords.length]);

  useEffect(() => {
    if (activeTabKey !== '1') {
      setShowNumberSelector(false);
    }
    if (activeTabKey === '4') {
      setCurrentPage(1);
    }
  }, [activeTabKey, statisticType]);

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    if (!isSliderFixed) {
      setIsSliderFixed(true);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setSliderPosition({
        x: rect.left,
        y: rect.top
      });
    }

    setIsSliderDragging(true);
    setSliderDragOffset({
      x: e.clientX - sliderPosition.x,
      y: e.clientY - sliderPosition.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const maxX = window.innerWidth - 70;
      const maxY = window.innerHeight - 50;

      setButtonPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    } else if (isSumButtonDragging) {
      const newX = e.clientX - sumButtonDragOffset.x;
      const newY = e.clientY - sumButtonDragOffset.y;

      const maxX = window.innerWidth - 70;
      const maxY = window.innerHeight - 50;

      setSumButtonPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    } else if (isHiddenIconDragging) {
      const newX = e.clientX - hiddenIconDragOffset.x;
      const newY = e.clientY - hiddenIconDragOffset.y;

      const maxX = window.innerWidth - 50;
      const maxY = window.innerHeight - 50;

      setHiddenIconPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });

    } else if (isSliderDragging) {
      const newX = e.clientX - sliderDragOffset.x;
      const newY = e.clientY - sliderDragOffset.y;

      const maxX = window.innerWidth - sliderSize.width;
      const maxY = window.innerHeight - sliderSize.height;

      setSliderPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });

    } else if (isSelectorDragging) {
      const newX = e.clientX - selectorDragOffset.x;
      const newY = e.clientY - selectorDragOffset.y;

      setSelectorPosition({
        x: newX,
        y: newY
      });
    } else if (isButtonDragging) {
      const newX = e.clientX - buttonDragOffset.x;
      const newY = e.clientY - buttonDragOffset.y;

      const maxX = window.innerWidth - 150;
      const maxY = window.innerHeight - 40;

      setFloatingButtonPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    } else if (isTabContainerDragging) {
      const newX = e.clientX - tabContainerDragOffset.x;
      const newY = e.clientY - tabContainerDragOffset.y;

      const maxX = window.innerWidth - 300;
      const maxY = window.innerHeight - 60;

      setTabContainerPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsSumButtonDragging(false);
    setIsHiddenIconDragging(false);
    setIsSliderDragging(false);
    setIsSelectorDragging(false);
    setIsButtonDragging(false);
    setIsTabContainerDragging(false);
  };

  useEffect(() => {
    if (isDragging || isSumButtonDragging || isHiddenIconDragging || isSliderDragging || isSelectorDragging || isButtonDragging || isTabContainerDragging) {
      document.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isSumButtonDragging, isHiddenIconDragging, isSliderDragging, isSelectorDragging, isButtonDragging, isTabContainerDragging]);

  useEffect(() => {
    const handleResize = () => {
      setSliderPosition(prev => ({
        ...prev,
        y: window.innerHeight - sliderSize.height - 150
      }));

      const buttonY = window.innerHeight - 140;
      const hiddenIconY = window.innerHeight - 200;
      const sumButtonY = window.innerHeight - 260;

      setFloatingButtonPosition({
        x: window.innerWidth - 90,
        y: window.innerHeight - 320
      });

      setHiddenIconPosition({
        x: window.innerWidth - 90,
        y: hiddenIconY
      });

      setSumButtonPosition({
        x: window.innerWidth - 105,
        y: sumButtonY
      });

      setButtonPosition({
        x: window.innerWidth - 105,
        y: buttonY
      });

      const isRed = statisticType === 'red';
      const selectorHeight = isRed ? 392 : 252;

      setSelectorPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 20),
        y: Math.min(prev.y, window.innerHeight - selectorHeight - 20)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sliderSize.height, sliderSize.width, statisticType]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - buttonPosition.x,
      y: e.clientY - buttonPosition.y
    });
  };

  const handleTabContainerMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTabContainerDragging(true);
    setTabContainerDragOffset({
      x: e.clientX - tabContainerPosition.x,
      y: e.clientY - tabContainerPosition.y
    });
  };

  const contextValue: AnalysisDataContextType = {
    allRecords,
    setAllRecords,
    sliderRange,
    setSliderRange,
    statisticType,
    setStatisticType,
    isDragging,
    setIsDragging,
    isHiddenIconDragging,
    setIsHiddenIconDragging,
    hiddenIconPosition,
    setHiddenIconPosition,
    hiddenIconDragOffset,
    setHiddenIconDragOffset,
    buttonPosition,
    setButtonPosition,
    dragOffset,
    setDragOffset,
    isSliderDragging,
    setIsSliderDragging,
    sliderPosition,
    setSliderPosition,
    sliderDragOffset,
    setSliderDragOffset,
    isSliderFixed,
    setIsSliderFixed,
    sliderSize,
    isSliderHidden,
    setIsSliderHidden,
    selectedNumbers,
    setSelectedNumbers,
    showNumberSelector,
    setShowNumberSelector,
    isSelectorDragging,
    setIsSelectorDragging,
    isButtonDragging,
    setIsButtonDragging,
    selectorPosition,
    setSelectorPosition,
    floatingButtonPosition,
    setFloatingButtonPosition,
    selectorDragOffset,
    setSelectorDragOffset,
    buttonDragOffset,
    setButtonDragOffset,
    isTabContainerDragging,
    setIsTabContainerDragging,
    tabContainerPosition,
    setTabContainerPosition,
    tabContainerDragOffset,
    setTabContainerDragOffset,
    chartData,
    setChartData,
    oddEvenData,
    setOddEvenData,
    oddEvenCombinationData,
    setOddEvenCombinationData,
    oddEvenCombinationAccumulatedData,
    setOddEvenCombinationAccumulatedData,
    sumData,
    setSumData,
    sumCountData,
    setSumCountData,
    sumCombinationCountData,
    setSumCombinationCountData,
    currentCombination,
    setCurrentCombination,
    positionAnalysisData,
    setPositionAnalysisData,
    numberAccumulatedCountData,
    setNumberAccumulatedCountData,
    selectedPeriod,
    setSelectedPeriod,
    popupPosition,
    setPopupPosition,
    isPopupVisible,
    setIsPopupVisible,
    selectedSums,
    setSelectedSums,
    sumMode,
    setSumMode,
    isSumButtonDragging,
    setIsSumButtonDragging,
    sumButtonPosition,
    setSumButtonPosition,
    sumButtonDragOffset,
    setSumButtonDragOffset,
    hexagonCurrentPage,
    setHexagonCurrentPage,
    hexagonPageSize,
    sumHexagonCurrentPage,
    setSumHexagonCurrentPage,
    sumHexagonPageSize,
    predictionRedNumbers,
    setPredictionRedNumbers,
    predictionBlueNumber,
    setPredictionBlueNumber,
    isShaking,
    setIsShaking,
    activeTabKey,
    setActiveTabKey,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    currentPeriod,
    setCurrentPeriod,
    globalCombinationColors,
    contextAllRecords,
    hasFetchedRef,
    collectRulerRef,
    trackMenuItems,
    activeTrackMenuItem,
    isTrackMenuActive,
    ActiveTrackIcon,
    handleSliderChange,
    handleMouseMove,
    handleMouseUp,
    handleMouseDown,
    handleTabContainerMouseDown,
    handleSliderMouseDown,
    handleSliderDoubleClick,
    handleNumberSelect,
    clearAllSelections,
    generateNumberList,
    parseRecords,
    location,
    navigate
  };

  return (
    <AnalysisDataContext.Provider value={contextValue}>
      {children}
    </AnalysisDataContext.Provider>
  );
};
