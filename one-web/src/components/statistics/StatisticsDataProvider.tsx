import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { message } from 'antd';

import {
  ChromeOutlined,
  DockerOutlined,
  RubyOutlined
} from '@ant-design/icons';
import { useRecordContext } from '../../contexts/RecordContext';

export interface AnalysisResult {
  [key: string]: {
    count: number;
    percent: number;
  };
}

const getTabStateFromPathname = (pathname: string) => {
  if (pathname.includes('/frequency')) return { statisticType: 'red' as const, activeTabKey: '1' };
  if (pathname.includes('/distribution')) return { statisticType: 'red' as const, activeTabKey: '3' };
  if (pathname.includes('/group')) return { statisticType: 'red' as const, activeTabKey: '5' };
  return { statisticType: 'red' as const, activeTabKey: '1' };
};

export interface StatisticsDataContextType {
  loading: boolean;
  totalRecords: number;
  redBallFrequency: AnalysisResult;
  blueBallFrequency: AnalysisResult;
  redBallOddEven: AnalysisResult;
  redBallSize: AnalysisResult;
  blueBallOddEven: AnalysisResult;
  blueBallSize: AnalysisResult;
  lastWinningNumbersTotalRed: AnalysisResult;
  lastWinningNumbersTotalBlue: AnalysisResult;
  specialRedStats: {
    individual: AnalysisResult;
    groups: AnalysisResult;
    absentCounts: { [key: string]: number };
  };
  specialBlueStats: {
    individual: AnalysisResult;
    groups: AnalysisResult;
    absentCounts: { [key: string]: number };
  };
  winningNumbersSum: { redSum: number; blueSum: number };
  allRecords: string[];
  setAllRecords: React.Dispatch<React.SetStateAction<string[]>>;
  sliderRange: [number, number];
  setSliderRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  statisticType: 'red' | 'blue';
  setStatisticType: React.Dispatch<React.SetStateAction<'red' | 'blue'>>;
  endLineNumbers: string[];
  showOnlyLastWinning: boolean;
  setShowOnlyLastWinning: React.Dispatch<React.SetStateAction<boolean>>;
  isDragging: boolean;
  isHiddenIconDragging: boolean;
  setIsHiddenIconDragging: React.Dispatch<React.SetStateAction<boolean>>;
  hiddenIconDragOffset: { x: number; y: number };
  setHiddenIconDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  isSliderDragging: boolean;
  isTabContainerDragging: boolean;
  hiddenIconPosition: { x: number; y: number };
  buttonPosition: { x: number; y: number };
  sliderPosition: { x: number; y: number };
  setSliderPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  tabContainerPosition: { x: number; y: number };
  isSliderFixed: boolean;
  isSliderHidden: boolean;
  setIsSliderHidden: React.Dispatch<React.SetStateAction<boolean>>;
  sliderSize: { width: number; height: number };
  activeTabKey: string;
  setActiveTabKey: React.Dispatch<React.SetStateAction<string>>;
  handleSliderChange: (value: number[]) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleSliderMouseDown: (e: React.MouseEvent) => void;
  handleHiddenIconMouseDown: (e: React.MouseEvent) => void;
  handleTabContainerMouseDown: (e: React.MouseEvent) => void;
  handleSliderDoubleClick: () => void;
  redBallConfig: {
    numberToName: { [key: string]: string };
    groups: { name: string; numbers: string[] }[];
  };
  blueBallConfig: {
    numberToName: { [key: string]: string };
    groups: { name: string; numbers: string[] }[];
  };
  parseRecords: (records: string[]) => void;
  statisticMenuItems: {
    key: string;
    label: string;
    icon: React.ComponentType;
    redTabKey: string;
    blueTabKey: string;
  }[];
  activeStatisticMenuItem: {
    key: string;
    label: string;
    icon: React.ComponentType;
    redTabKey: string;
    blueTabKey: string;
  };
  isStatisticMenuActive: boolean;
  ActiveStatisticIcon: React.ComponentType;
}

const StatisticsDataContext = createContext<StatisticsDataContextType | null>(null);

export const useStatisticsData = () => {
  const ctx = useContext(StatisticsDataContext);
  if (!ctx) throw new Error('useStatisticsData must be used within StatisticsDataProvider');
  return ctx;
};

export const StatisticsDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [redBallFrequency, setRedBallFrequency] = useState<AnalysisResult>({});
  const [blueBallFrequency, setBlueBallFrequency] = useState<AnalysisResult>({});
  const [redBallOddEven, setRedBallOddEven] = useState<AnalysisResult>({});
  const [redBallSize, setRedBallSize] = useState<AnalysisResult>({});
  const [blueBallOddEven, setBlueBallOddEven] = useState<AnalysisResult>({});
  const [blueBallSize, setBlueBallSize] = useState<AnalysisResult>({});
  const [lastWinningNumbersTotalRed, setLastWinningNumbersTotalRed] = useState<AnalysisResult>({});
  const [lastWinningNumbersTotalBlue, setLastWinningNumbersTotalBlue] = useState<AnalysisResult>({});
  const [specialRedStats, setSpecialRedStats] = useState<{
    individual: AnalysisResult;
    groups: AnalysisResult;
    absentCounts: { [key: string]: number };
  }>({ individual: {}, groups: {}, absentCounts: {} });
  const [specialBlueStats, setSpecialBlueStats] = useState<{
    individual: AnalysisResult;
    groups: AnalysisResult;
    absentCounts: { [key: string]: number };
  }>({ individual: {}, groups: {}, absentCounts: {} });
  const [winningNumbersSum, setWinningNumbersSum] = useState<{
    redSum: number;
    blueSum: number;
  }>({ redSum: 0, blueSum: 0 });
  const [allRecords, setAllRecords] = useState<string[]>([]);
  const [sliderRange, setSliderRange] = useState<[number, number]>([0, 0]);
  const initialTabState = getTabStateFromPathname(location.pathname);
  const [statisticType, setStatisticType] = useState<'red' | 'blue'>(initialTabState.statisticType);
  const [endLineNumbers, setEndLineNumbers] = useState<string[]>([]);
  const [showOnlyLastWinning, setShowOnlyLastWinning] = useState(true);
  const { allRecords: contextAllRecords, loading: contextLoading } = useRecordContext();

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

  const [isTabContainerDragging, setIsTabContainerDragging] = useState(false);
  const [tabContainerPosition, setTabContainerPosition] = useState({
    x: window.innerWidth / 2 - 200,
    y: window.innerHeight - 140
  });
  const [tabContainerDragOffset, setTabContainerDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      setSliderPosition(prev => ({
        ...prev,
        y: window.innerHeight - sliderSize.height - 150
      }));

      const buttonY = window.innerHeight - 140;
      const hiddenIconY = window.innerHeight - 200;

      setHiddenIconPosition({
        x: window.innerWidth - 90,
        y: hiddenIconY
      });

      setButtonPosition({
        x: window.innerWidth - 105,
        y: buttonY
      });

      setTabContainerPosition(prev => ({
        x: window.innerWidth / 2 - 200,
        y: prev.y
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

  const handleHiddenIconMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHiddenIconDragging(true);
    setHiddenIconDragOffset({
      x: e.clientX - hiddenIconPosition.x,
      y: e.clientY - hiddenIconPosition.y
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
    } else if (isTabContainerDragging) {
      const newX = e.clientX - tabContainerDragOffset.x;
      const newY = e.clientY - tabContainerDragOffset.y;

      const maxX = window.innerWidth - 400;
      const maxY = window.innerHeight - 80;

      setTabContainerPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsHiddenIconDragging(false);
    setIsSliderDragging(false);
    setIsTabContainerDragging(false);
  };

  useEffect(() => {
    if (isDragging || isHiddenIconDragging || isSliderDragging || isTabContainerDragging) {
      document.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isHiddenIconDragging, isSliderDragging, isTabContainerDragging]);

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

  const mockRecords = [
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

  const redBallConfig = {
    numberToName: {
      '01': '薛宝钗', '02': '贾元春', '03': '贾探春', '04': '史湘云', '05': '妙玉',
      '06': '贾迎春', '07': '贾惜春', '08': '王熙凤', '09': '贾巧姐', '10': '李纨',
      '11': '秦可卿', '12': '薛宝琴', '13': '尤二姐', '14': '尤三姐', '15': '邢岫烟',
      '16': '李纹', '17': '李绮', '18': '夏金桂', '19': '秋桐', '20': '小红',
      '21': '龄官', '22': '娇杏', '23': '袭人', '24': '平儿', '25': '鸳鸯',
      '26': '紫鹃', '27': '莺儿', '28': '玉钏', '29': '金钏', '30': '彩云',
      '31': '司棋', '32': '芳官', '33': '麝月'
    },
    groups: [
      { name: '林黛玉', numbers: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'] },
      { name: '香菱', numbers: ['12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'] },
      { name: '晴雯', numbers: ['23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33'] }
    ]
  };

  const blueBallConfig = {
    numberToName: {
      '01': '雨水', '02': '惊蛰', '03': '清明', '04': '谷雨',
      '05': '小满', '06': '芒种', '07': '小暑', '08': '大暑',
      '09': '处暑', '10': '白露', '11': '寒露', '12': '霜降',
      '13': '小雪', '14': '大雪', '15': '小寒', '16': '大寒'
    },
    groups: [
      { name: '立春', numbers: ['01', '02'] },
      { name: '春分', numbers: ['03', '04'] },
      { name: '立夏', numbers: ['05', '06'] },
      { name: '夏至', numbers: ['07', '08'] },
      { name: '立秋', numbers: ['09', '10'] },
      { name: '秋分', numbers: ['11', '12'] },
      { name: '立冬', numbers: ['13', '14'] },
      { name: '冬至', numbers: ['15', '16'] }
    ]
  };

  const parseRecords = (records: string[]) => {
    const redBallCount: { [key: string]: number } = {};
    const blueBallCount: { [key: string]: number } = {};
    const redOddEvenCount = { odd: 0, even: 0 };
    const redSizeCount = { small: 0, large: 0 };
    const blueOddEvenCount = { odd: 0, even: 0 };
    const blueSizeCount = { small: 0, large: 0 };

    let totalRedBalls = 0;
    let totalBlueBalls = 0;

    let redSum = 0;
    let blueSum = 0;

    const redBallLastPosition: { [key: string]: number } = {};
    const blueBallLastPosition: { [key: string]: number } = {};
    const redBallAbsentCounts: { [key: string]: number } = {};
    const blueBallAbsentCounts: { [key: string]: number } = {};

    for (let i = 1; i <= 33; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      redBallAbsentCounts[number] = 0;
    }
    for (let i = 1; i <= 16; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      blueBallAbsentCounts[number] = 0;
    }

    records.forEach((record, recordIndex) => {
      if (record.length < 14) return;

      const currentRedBalls: string[] = [];
      for (let i = 0; i < 12; i += 2) {
        currentRedBalls.push(record.substring(i, i + 2));
      }
      const currentBlueBall = record.substring(12, 14);

      for (let i = 1; i <= 33; i++) {
        const number = i < 10 ? `0${i}` : `${i}`;
        if (currentRedBalls.includes(number)) {
          redBallAbsentCounts[number] = 0;
          redBallLastPosition[number] = recordIndex;
        } else {
          if (redBallLastPosition[number] !== undefined) {
            redBallAbsentCounts[number]++;
          }
        }
      }

      for (let i = 1; i <= 16; i++) {
        const number = i < 10 ? `0${i}` : `${i}`;
        if (currentBlueBall === number) {
          blueBallAbsentCounts[number] = 0;
          blueBallLastPosition[number] = recordIndex;
        } else {
          if (blueBallLastPosition[number] !== undefined) {
            blueBallAbsentCounts[number]++;
          }
        }
      }

      for (let i = 0; i < 12; i += 2) {
        const redBall = record.substring(i, i + 2);
        redBallCount[redBall] = (redBallCount[redBall] || 0) + 1;
        totalRedBalls++;

        const redNum = parseInt(redBall);
        redSum += redNum;

        if (redNum % 2 === 0) {
          redOddEvenCount.even++;
        } else {
          redOddEvenCount.odd++;
        }

        if (redNum <= 16) {
          redSizeCount.small++;
        } else {
          redSizeCount.large++;
        }
      }

      const blueBall = record.substring(12, 14);
      blueBallCount[blueBall] = (blueBallCount[blueBall] || 0) + 1;
      totalBlueBalls++;

      const blueNum = parseInt(blueBall);
      blueSum += blueNum;

      if (blueNum % 2 === 0) {
        blueOddEvenCount.even++;
      } else {
        blueOddEvenCount.odd++;
      }

      if (blueNum <= 8) {
        blueSizeCount.small++;
      } else {
        blueSizeCount.large++;
      }
    });

    setWinningNumbersSum({ redSum, blueSum });

    const calculatePercent = (count: number, total: number) => {
      return Math.round((count / total) * 100);
    };

    const redBallResult: AnalysisResult = {};
    for (let i = 1; i <= 33; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      redBallResult[number] = {
        count: redBallCount[number] || 0,
        percent: calculatePercent(redBallCount[number] || 0, totalRedBalls)
      };
    }

    const blueBallResult: AnalysisResult = {};
    for (let i = 1; i <= 16; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      blueBallResult[number] = {
        count: blueBallCount[number] || 0,
        percent: calculatePercent(blueBallCount[number] || 0, totalBlueBalls)
      };
    }

    const redOddEvenResult: AnalysisResult = {
      odd: {
        count: redOddEvenCount.odd,
        percent: calculatePercent(redOddEvenCount.odd, totalRedBalls)
      },
      even: {
        count: redOddEvenCount.even,
        percent: calculatePercent(redOddEvenCount.even, totalRedBalls)
      }
    };

    const redSizeResult: AnalysisResult = {
      small: {
        count: redSizeCount.small,
        percent: calculatePercent(redSizeCount.small, totalRedBalls)
      },
      large: {
        count: redSizeCount.large,
        percent: calculatePercent(redSizeCount.large, totalRedBalls)
      }
    };

    const blueOddEvenResult: AnalysisResult = {
      odd: {
        count: blueOddEvenCount.odd,
        percent: calculatePercent(blueOddEvenCount.odd, totalBlueBalls)
      },
      even: {
        count: blueOddEvenCount.even,
        percent: calculatePercent(blueOddEvenCount.even, totalBlueBalls)
      }
    };

    const blueSizeResult: AnalysisResult = {
      small: {
        count: blueSizeCount.small,
        percent: calculatePercent(blueSizeCount.small, totalBlueBalls)
      },
      large: {
        count: blueSizeCount.large,
        percent: calculatePercent(blueSizeCount.large, totalBlueBalls)
      }
    };

    if (records.length > 0) {
      const lastRecord = records[records.length - 1];
      if (lastRecord && lastRecord.length >= 14) {
        const lastRedBalls: string[] = [];
        for (let i = 0; i < 12; i += 2) {
          lastRedBalls.push(lastRecord.substring(i, i + 2));
        }
        const lastBlueBall = lastRecord.substring(12, 14);

        const allRedBalls = Array.from({ length: 33 }, (_, i) => {
          const num = i + 1;
          return num < 10 ? `0${num}` : `${num}`;
        });
        const allBlueBalls = Array.from({ length: 16 }, (_, i) => {
          const num = i + 1;
          return num < 10 ? `0${num}` : `${num}`;
        });

        const totalRedCount = lastRedBalls.reduce((sum, redBall) => sum + (redBallCount[redBall] || 0), 0);

        const nonWinningRedBalls = allRedBalls.filter(redBall => !lastRedBalls.includes(redBall));
        const nonWinningRedCount = nonWinningRedBalls.reduce((sum, redBall) => sum + (redBallCount[redBall] || 0), 0);
        setLastWinningNumbersTotalRed({
          'total': {
            count: totalRedCount,
            percent: calculatePercent(totalRedCount, totalRedBalls)
          },
          'non_winning_total': {
            count: nonWinningRedCount,
            percent: calculatePercent(nonWinningRedCount, totalRedBalls)
          }
        });

        const nonWinningBlueBalls = allBlueBalls.filter(blueBall => blueBall !== lastBlueBall);
        const nonWinningBlueCount = nonWinningBlueBalls.reduce((sum, blueBall) => sum + (blueBallCount[blueBall] || 0), 0);
        setLastWinningNumbersTotalBlue({
          'total': {
            count: blueBallCount[lastBlueBall] || 0,
            percent: calculatePercent(blueBallCount[lastBlueBall] || 0, totalBlueBalls)
          },
          'non_winning_total': {
            count: nonWinningBlueCount,
            percent: calculatePercent(nonWinningBlueCount, totalBlueBalls)
          }
        });
      }
    }

    const specialRedIndividual: AnalysisResult = {};
    const specialRedGroups: AnalysisResult = {};

    for (let i = 1; i <= 33; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      specialRedIndividual[number] = {
        count: redBallCount[number] || 0,
        percent: calculatePercent(redBallCount[number] || 0, totalRedBalls)
      };
    }

    redBallConfig.groups.forEach(group => {
      const groupCount = group.numbers.reduce((sum, number) => sum + (redBallCount[number] || 0), 0);
      specialRedGroups[group.name] = {
        count: groupCount,
        percent: calculatePercent(groupCount, totalRedBalls)
      };
    });
    setSpecialRedStats({
      individual: specialRedIndividual,
      groups: specialRedGroups,
      absentCounts: redBallAbsentCounts
    });

    const specialBlueIndividual: AnalysisResult = {};
    const specialBlueGroups: AnalysisResult = {};

    for (let i = 1; i <= 16; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      specialBlueIndividual[number] = {
        count: blueBallCount[number] || 0,
        percent: calculatePercent(blueBallCount[number] || 0, totalBlueBalls)
      };
    }

    blueBallConfig.groups.forEach(group => {
      const groupCount = group.numbers.reduce((sum, number) => sum + (blueBallCount[number] || 0), 0);
      specialBlueGroups[group.name] = {
        count: groupCount,
        percent: calculatePercent(groupCount, totalBlueBalls)
      };
    });
    setSpecialBlueStats({
      individual: specialBlueIndividual,
      groups: specialBlueGroups,
      absentCounts: blueBallAbsentCounts
    });

    setTotalRecords(records.length);
    setRedBallFrequency(redBallResult);
    setBlueBallFrequency(blueBallResult);
    setRedBallOddEven(redOddEvenResult);
    setRedBallSize(redSizeResult);
    setBlueBallOddEven(blueOddEvenResult);
    setBlueBallSize(blueSizeResult);

    console.log('统计结果更新：');
    console.log('总记录数:', records.length);
    console.log('红球频率统计:', redBallResult);
    console.log('蓝球频率统计:', blueBallResult);
    console.log('红球奇偶分布:', redOddEvenResult);
    console.log('红球大小分布:', redSizeResult);
    console.log('蓝球奇偶分布:', blueOddEvenResult);
    console.log('蓝球大小分布:', blueSizeResult);
    console.log('红球分组统计:', specialRedStats);
    console.log('蓝球分组统计:', specialBlueStats);
  };

  useEffect(() => {
    if (contextAllRecords && contextAllRecords.length > 0) {
      setLoading(contextLoading);

      let recordsToUse: string[];
      if (typeof contextAllRecords === 'string') {
        recordsToUse = contextAllRecords
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
        console.log('字符串分割后记录数据长度:', recordsToUse.length);
      } else if (Array.isArray(contextAllRecords)) {
        recordsToUse = contextAllRecords;
        console.log('数组记录数据长度:', recordsToUse.length);
      } else {
        console.error('获取到的数据不是字符串或数组，使用模拟数据:', contextAllRecords);
        recordsToUse = mockRecords;
        message.info(`使用模拟数据，共 ${mockRecords.length} 条记录`);
      }

      setAllRecords(recordsToUse);
      const initialRange: [number, number] = [0, Math.max(0, recordsToUse.length - 1)];
      setSliderRange(initialRange);
      parseRecords(recordsToUse);

      if (recordsToUse.length > 0) {
        const endIndex = initialRange[1];
        const endRecord = recordsToUse[endIndex];
        if (endRecord && endRecord.length >= 14) {
          const redBalls = [];
          for (let i = 0; i < 12; i += 2) {
            redBalls.push(endRecord.substring(i, i + 2));
          }
          const blueBall = endRecord.substring(12, 14);
          if (statisticType === 'red') {
            setEndLineNumbers(redBalls);
          } else {
            setEndLineNumbers([blueBall]);
          }
        }
      }

      setLoading(false);
    }
  }, [contextAllRecords, contextLoading, statisticType]);

  useEffect(() => {
    if (allRecords.length > 0 && sliderRange[1] < allRecords.length) {
      const endIndex = sliderRange[1];
      const endRecord = allRecords[endIndex];
      if (endRecord && endRecord.length >= 14) {
        const redBalls = [];
        for (let i = 0; i < 12; i += 2) {
          redBalls.push(endRecord.substring(i, i + 2));
        }
        const blueBall = endRecord.substring(12, 14);
        if (statisticType === 'red') {
          setEndLineNumbers(redBalls);
        } else {
          setEndLineNumbers([blueBall]);
        }
      }
    }
  }, [statisticType, allRecords, sliderRange]);

  const handleSliderChange = (value: number[]) => {
    const range = value as [number, number];
    setSliderRange(range);
    const selectedRecords = allRecords.slice(range[0], range[1] + 1);
    parseRecords(selectedRecords);

    if (allRecords.length > 0) {
      const endIndex = range[1];
      const endRecord = allRecords[endIndex];
      if (endRecord && endRecord.length >= 14) {
        const redBalls = [];
        for (let i = 0; i < 12; i += 2) {
          redBalls.push(endRecord.substring(i, i + 2));
        }
        const blueBall = endRecord.substring(12, 14);

        if (statisticType === 'red') {
          setEndLineNumbers(redBalls);
        } else {
          setEndLineNumbers([blueBall]);
        }
      }
    }
  };

  const [activeTabKey, setActiveTabKey] = useState<string>(getTabStateFromPathname(location.pathname).activeTabKey);

  useEffect(() => {
    const state = getTabStateFromPathname(location.pathname);
    setStatisticType(state.statisticType);
    setActiveTabKey(state.activeTabKey);
  }, [location.pathname]);

  const statisticMenuItems = [
    {
      key: 'frequency',
      label: '频率',
      icon: ChromeOutlined,
      redTabKey: '1',
      blueTabKey: '2'
    },
    {
      key: 'group',
      label: '分组',
      icon: DockerOutlined,
      redTabKey: '5',
      blueTabKey: '6'
    },
    {
      key: 'distribution',
      label: '分布',
      icon: RubyOutlined,
      redTabKey: '3',
      blueTabKey: '4'
    }
  ];
  const activeStatisticMenuItem = statisticMenuItems.find(item =>
    activeTabKey === (statisticType === 'red' ? item.redTabKey : item.blueTabKey)
  ) || statisticMenuItems[0];
  const isStatisticMenuActive = statisticMenuItems.some(item =>
    activeTabKey === (statisticType === 'red' ? item.redTabKey : item.blueTabKey)
  );
  const ActiveStatisticIcon = activeStatisticMenuItem.icon;

  const contextValue: StatisticsDataContextType = {
    loading,
    totalRecords,
    redBallFrequency,
    blueBallFrequency,
    redBallOddEven,
    redBallSize,
    blueBallOddEven,
    blueBallSize,
    lastWinningNumbersTotalRed,
    lastWinningNumbersTotalBlue,
    specialRedStats,
    specialBlueStats,
    winningNumbersSum,
    allRecords,
    setAllRecords,
    sliderRange,
    setSliderRange,
    statisticType,
    setStatisticType,
    endLineNumbers,
    showOnlyLastWinning,
    setShowOnlyLastWinning,
    isDragging,
    isHiddenIconDragging,
    setIsHiddenIconDragging,
    hiddenIconDragOffset,
    setHiddenIconDragOffset,
    isSliderDragging,
    isTabContainerDragging,
    hiddenIconPosition,
    buttonPosition,
    sliderPosition,
    setSliderPosition,
    tabContainerPosition,
    isSliderFixed,
    isSliderHidden,
    setIsSliderHidden,
    sliderSize,
    activeTabKey,
    setActiveTabKey,
    handleSliderChange,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleSliderMouseDown,
    handleHiddenIconMouseDown,
    handleTabContainerMouseDown,
    handleSliderDoubleClick,
    redBallConfig,
    blueBallConfig,
    parseRecords,
    statisticMenuItems,
    activeStatisticMenuItem,
    isStatisticMenuActive,
    ActiveStatisticIcon
  };

  return (
    <StatisticsDataContext.Provider value={contextValue}>
      {children}
    </StatisticsDataContext.Provider>
  );
};
