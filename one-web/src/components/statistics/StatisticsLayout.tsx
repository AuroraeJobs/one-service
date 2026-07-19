import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Slider } from 'antd';
import {
  FastBackwardOutlined,
  FastForwardOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  WomanOutlined,
  ManOutlined,
  SettingOutlined,
  CloudFilled,
  ChromeOutlined,
  DockerOutlined,
  RubyOutlined
} from '@ant-design/icons';
import { useStatisticsData } from './StatisticsDataProvider';

const tabKeyToPath: Record<string, string> = {
  '1': '/lottery/statistics/frequency',
  '2': '/lottery/statistics/frequency',
  '3': '/lottery/statistics/distribution',
  '4': '/lottery/statistics/distribution',
  '5': '/lottery/statistics/group',
  '6': '/lottery/statistics/group',
};

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

const RedBlueToggle: React.FC = () => {
  const data = useStatisticsData();

  return (
    <div style={{
      position: 'fixed',
      left: `${data.buttonPosition.x}px`,
      top: `${data.buttonPosition.y}px`,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderRadius: '4px',
      width: '80px',
      height: '50px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
      cursor: data.isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      touchAction: 'none'
    }}
    onMouseDown={data.handleMouseDown}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: data.statisticType === 'red' ? '#f5222d' : '#1890ff',
        borderRadius: '15px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        width: '45px',
        height: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={() => {
        const newType = data.statisticType === 'red' ? 'blue' : 'red';
        data.setStatisticType(newType);
        if (data.activeTabKey === '1' || data.activeTabKey === '2') {
          data.setActiveTabKey(newType === 'red' ? '1' : '2');
        } else if (data.activeTabKey === '3' || data.activeTabKey === '4') {
          data.setActiveTabKey(newType === 'red' ? '3' : '4');
        } else if (data.activeTabKey === '5' || data.activeTabKey === '6') {
          data.setActiveTabKey(newType === 'red' ? '5' : '6');
        }
      }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          top: '2px',
          left: data.statisticType === 'red' ? '2px' : '23px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#fff',
          color: data.statisticType === 'red' ? '#f5222d' : '#1890ff',
          fontWeight: 'bold',
          transition: 'left 0.3s',
          fontSize: '12px',
          zIndex: 1
        }}>
          {data.statisticType === 'red' ? <WomanOutlined /> : <ManOutlined />}
        </div>
      </div>
    </div>
  );
};

const SliderArea: React.FC = () => {
  const data = useStatisticsData();

  return (
    <>
      {data.allRecords.length > 0 && (
        <>
          {data.isSliderHidden ? (
            <div style={{
              position: 'fixed',
              left: `${data.hiddenIconPosition.x}px`,
              top: `${data.hiddenIconPosition.y}px`,
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: data.isHiddenIconDragging ? 'grabbing' : 'grab',
              zIndex: 1000,
              transition: 'all 0.3s ease',
              userSelect: 'none',
              touchAction: 'none'
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              data.setIsHiddenIconDragging(true);
              data.setHiddenIconDragOffset({
                x: e.clientX - data.hiddenIconPosition.x,
                y: e.clientY - data.hiddenIconPosition.y
              });
            }}
            onClick={() => {
              const isHiddenIconOnRight = data.hiddenIconPosition.x > window.innerWidth / 2;
              const newX = isHiddenIconOnRight
                ? data.hiddenIconPosition.x - data.sliderSize.width - 20
                : data.hiddenIconPosition.x + 50 + 20;

              data.setSliderPosition({
                x: Math.max(0, Math.min(newX, window.innerWidth - data.sliderSize.width - 20)),
                y: data.hiddenIconPosition.y - data.sliderSize.height / 2 + 25
              });
              data.setIsSliderHidden(false);
            }}
            >
              <SettingOutlined style={{ fontSize: '24px', color: data.statisticType === 'red' ? '#f5222d' : '#1890ff' }} />
            </div>
          ) : (
            <div style={{
              position: 'fixed',
              left: `${data.sliderPosition.x}px`,
              top: `${data.sliderPosition.y}px`,
              padding: '16px',
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
              borderRadius: 20,
              boxShadow: `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)`,
              textAlign: 'center',
              cursor: data.isSliderDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              zIndex: 999,
              width: `${data.sliderSize.width}px`,
              height: `${data.sliderSize.height}px`,
              overflow: 'auto',
              boxSizing: 'border-box',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onMouseDown={data.handleSliderMouseDown}
            onDoubleClick={data.handleSliderDoubleClick}
            >
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '0 20px',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
                  <div style={{
                    cursor: data.sliderRange[0] <= 0 ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    border: `1px solid ${data.sliderRange[0] <= 0 ? 'rgba(102, 102, 102, 0.5)' : `rgba(${data.statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`}`,
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                    color: data.sliderRange[0] <= 0 ? '#999999' : (data.statisticType === 'red' ? '#f5222d' : '#1890ff'),
                    borderColor: data.sliderRange[0] <= 0 ? '#666666' : (data.statisticType === 'red' ? '#f5222d' : '#1890ff'),
                    padding: 0,
                    margin: 0,
                    opacity: data.sliderRange[0] <= 0 ? 0.6 : 1,
                    backgroundColor: data.sliderRange[0] <= 0 ? '#222222' : '#1A1A1A',
                    backgroundImage: data.sliderRange[0] <= 0 ? 'linear-gradient(145deg, #333333, #111111)' : 'linear-gradient(145deg, #252525, #101010)',
                    boxShadow: data.sliderRange[0] <= 0 ?
                      `0 0 8px rgba(102, 102, 102, 0.3), 0 3px 8px rgba(0, 0, 0, 0.3), inset 0 0 3px rgba(102, 102, 102, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.05), inset 0 -2px 4px rgba(0, 0, 0, 0.3)` :
                      `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 6px 20px rgba(0, 0, 0, 0.5), inset 0 0 8px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 4px 8px rgba(255, 255, 255, 0.15), inset 0 -4px 8px rgba(0, 0, 0, 0.4)`,
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    transform: data.sliderRange[0] <= 0 ? 'translateZ(0) scale(0.95)' : 'translateZ(0) scale(1)'
                  }}
                  onClick={() => {
                    if (data.sliderRange[0] > 0) {
                      const newRange: [number, number] = [0, data.sliderRange[1]];
                      data.setSliderRange(newRange);
                      data.handleSliderChange(newRange);
                    }
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}>
                    <FastBackwardOutlined style={{ fontSize: '18px' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        if (data.sliderRange[0] > 0) {
                          const newRange: [number, number] = [data.sliderRange[0] - 1, data.sliderRange[1]];
                          data.setSliderRange(newRange);
                          data.handleSliderChange(newRange);
                        }
                      }}
                      onDoubleClick={(e) => e.stopPropagation()}
                      disabled={data.sliderRange[0] <= 0}
                      style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: `1px solid ${data.sliderRange[0] <= 0 ? 'rgba(102, 102, 102, 0.5)' : `rgba(${data.statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`}`,
                          backgroundColor: data.sliderRange[0] <= 0 ? '#222222' : '#1A1A1A',
                          backgroundImage: data.sliderRange[0] <= 0 ? 'linear-gradient(145deg, #333333, #111111)' : 'linear-gradient(145deg, #252525, #101010)',
                          color: data.sliderRange[0] <= 0 ? '#999999' : (data.statisticType === 'red' ? '#f5222d' : '#1890ff'),
                          cursor: data.sliderRange[0] <= 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          padding: 0,
                          margin: 0,
                          opacity: data.sliderRange[0] <= 0 ? 0.6 : 1,
                          transition: 'all 0.3s ease',
                          boxShadow: data.sliderRange[0] <= 0 ?
                            `0 0 6px rgba(102, 102, 102, 0.3), 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 0 2px rgba(102, 102, 102, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.05), inset 0 -1px 3px rgba(0, 0, 0, 0.3)` :
                            `0 0 15px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 5px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 2px 5px rgba(255, 255, 255, 0.15), inset 0 -2px 5px rgba(0, 0, 0, 0.4)`,
                          transformStyle: 'preserve-3d',
                          perspective: '1000px',
                          transform: data.sliderRange[0] <= 0 ? 'translateZ(0) scale(0.9)' : 'translateZ(0) scale(1)'
                        }}
                    >
                      <StepBackwardOutlined style={{ fontSize: '14px' }} />
                    </button>

                    <button
                      onClick={() => {
                        if (data.sliderRange[0] < data.sliderRange[1]) {
                          const newRange: [number, number] = [data.sliderRange[0] + 1, data.sliderRange[1]];
                          data.setSliderRange(newRange);
                          data.handleSliderChange(newRange);
                        }
                      }}
                      onDoubleClick={(e) => e.stopPropagation()}
                      disabled={data.sliderRange[0] >= data.sliderRange[1]}
                      style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: `1px solid ${data.sliderRange[0] >= data.sliderRange[1] ? 'rgba(102, 102, 102, 0.5)' : `rgba(${data.statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`}`,
                          backgroundColor: data.sliderRange[0] >= data.sliderRange[1] ? '#222222' : '#1A1A1A',
                          backgroundImage: data.sliderRange[0] >= data.sliderRange[1] ? 'linear-gradient(145deg, #333333, #111111)' : 'linear-gradient(145deg, #252525, #101010)',
                          color: data.sliderRange[0] >= data.sliderRange[1] ? '#999999' : (data.statisticType === 'red' ? '#f5222d' : '#1890ff'),
                          cursor: data.sliderRange[0] >= data.sliderRange[1] ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          padding: 0,
                          margin: 0,
                          opacity: data.sliderRange[0] >= data.sliderRange[1] ? 0.6 : 1,
                          transition: 'all 0.3s ease',
                          boxShadow: data.sliderRange[0] >= data.sliderRange[1] ?
                            `0 0 6px rgba(102, 102, 102, 0.3), 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 0 2px rgba(102, 102, 102, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.05), inset 0 -1px 3px rgba(0, 0, 0, 0.3)` :
                            `0 0 15px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 5px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 2px 5px rgba(255, 255, 255, 0.15), inset 0 -2px 5px rgba(0, 0, 0, 0.4)`,
                          transformStyle: 'preserve-3d',
                          perspective: '1000px',
                          transform: data.sliderRange[0] >= data.sliderRange[1] ? 'translateZ(0) scale(0.9)' : 'translateZ(0) scale(1)'
                        }}
                    >
                      <StepForwardOutlined style={{ fontSize: '14px' }} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        if (data.sliderRange[1] > data.sliderRange[0]) {
                          const newRange: [number, number] = [data.sliderRange[0], data.sliderRange[1] - 1];
                          data.setSliderRange(newRange);
                          data.handleSliderChange(newRange);
                        }
                      }}
                      onDoubleClick={(e) => e.stopPropagation()}
                      disabled={data.sliderRange[1] <= data.sliderRange[0]}
                      style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: `1px solid ${data.sliderRange[1] <= data.sliderRange[0] ? 'rgba(102, 102, 102, 0.5)' : `rgba(${data.statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`}`,
                          backgroundColor: data.sliderRange[1] <= data.sliderRange[0] ? '#222222' : '#1A1A1A',
                          backgroundImage: data.sliderRange[1] <= data.sliderRange[0] ? 'linear-gradient(145deg, #333333, #111111)' : 'linear-gradient(145deg, #252525, #101010)',
                          color: data.sliderRange[1] <= data.sliderRange[0] ? '#999999' : (data.statisticType === 'red' ? '#f5222d' : '#1890ff'),
                          cursor: data.sliderRange[1] <= data.sliderRange[0] ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          padding: 0,
                          margin: 0,
                          opacity: data.sliderRange[1] <= data.sliderRange[0] ? 0.6 : 1,
                          transition: 'all 0.3s ease',
                          boxShadow: data.sliderRange[1] <= data.sliderRange[0] ?
                            `0 0 6px rgba(102, 102, 102, 0.3), 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 0 2px rgba(102, 102, 102, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.05), inset 0 -1px 3px rgba(0, 0, 0, 0.3)` :
                            `0 0 15px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 5px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 2px 5px rgba(255, 255, 255, 0.15), inset 0 -2px 5px rgba(0, 0, 0, 0.4)`,
                          transformStyle: 'preserve-3d',
                          perspective: '1000px',
                          transform: data.sliderRange[1] <= data.sliderRange[0] ? 'translateZ(0) scale(0.9)' : 'translateZ(0) scale(1)'
                        }}
                    >
                      <StepBackwardOutlined style={{ fontSize: '14px' }} />
                    </button>

                    <button
                      onClick={() => {
                        if (data.sliderRange[1] < data.allRecords.length - 1) {
                          const newRange: [number, number] = [data.sliderRange[0], data.sliderRange[1] + 1];
                          data.setSliderRange(newRange);
                          data.handleSliderChange(newRange);
                        }
                      }}
                      onDoubleClick={(e) => e.stopPropagation()}
                      disabled={data.sliderRange[1] >= data.allRecords.length - 1}
                      style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: `1px solid ${data.sliderRange[1] >= data.allRecords.length - 1 ? 'rgba(102, 102, 102, 0.5)' : `rgba(${data.statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`}`,
                          backgroundColor: data.sliderRange[1] >= data.allRecords.length - 1 ? '#222222' : '#1A1A1A',
                          backgroundImage: data.sliderRange[1] >= data.allRecords.length - 1 ? 'linear-gradient(145deg, #333333, #111111)' : 'linear-gradient(145deg, #252525, #101010)',
                          color: data.sliderRange[1] >= data.allRecords.length - 1 ? '#999999' : (data.statisticType === 'red' ? '#f5222d' : '#1890ff'),
                          cursor: data.sliderRange[1] >= data.allRecords.length - 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          padding: 0,
                          margin: 0,
                          opacity: data.sliderRange[1] >= data.allRecords.length - 1 ? 0.6 : 1,
                          transition: 'all 0.3s ease',
                          boxShadow: data.sliderRange[1] >= data.allRecords.length - 1 ?
                            `0 0 6px rgba(102, 102, 102, 0.3), 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 0 2px rgba(102, 102, 102, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.05), inset 0 -1px 3px rgba(0, 0, 0, 0.3)` :
                            `0 0 15px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 5px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 2px 5px rgba(255, 255, 255, 0.15), inset 0 -2px 5px rgba(0, 0, 0, 0.4)`,
                          transformStyle: 'preserve-3d',
                          perspective: '1000px',
                          transform: data.sliderRange[1] >= data.allRecords.length - 1 ? 'translateZ(0) scale(0.9)' : 'translateZ(0) scale(1)'
                        }}
                    >
                      <StepForwardOutlined style={{ fontSize: '14px' }} />
                    </button>
                  </div>

                  <div style={{
                    cursor: data.sliderRange[1] >= data.allRecords.length - 1 ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    border: `1px solid ${data.sliderRange[1] >= data.allRecords.length - 1 ? 'rgba(102, 102, 102, 0.5)' : `rgba(${data.statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`}`,
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                    color: data.sliderRange[1] >= data.allRecords.length - 1 ? '#999999' : (data.statisticType === 'red' ? '#f5222d' : '#1890ff'),
                    borderColor: data.sliderRange[1] >= data.allRecords.length - 1 ? 'rgba(102, 102, 102, 0.5)' : `rgba(${data.statisticType === 'red' ? '245, 34, 45' : '24, 144, 255'}, 0.7)`,
                    padding: 0,
                    margin: 0,
                    opacity: data.sliderRange[1] >= data.allRecords.length - 1 ? 0.6 : 1,
                    backgroundColor: data.sliderRange[1] >= data.allRecords.length - 1 ? '#222222' : '#1A1A1A',
                    backgroundImage: data.sliderRange[1] >= data.allRecords.length - 1 ? 'linear-gradient(145deg, #333333, #111111)' : 'linear-gradient(145deg, #252525, #101010)',
                    boxShadow: data.sliderRange[1] >= data.allRecords.length - 1 ?
                      `0 0 8px rgba(102, 102, 102, 0.3), 0 3px 8px rgba(0, 0, 0, 0.3), inset 0 0 3px rgba(102, 102, 102, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.05), inset 0 -2px 4px rgba(0, 0, 0, 0.3)` :
                      `0 0 20px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}60, 0 6px 20px rgba(0, 0, 0, 0.5), inset 0 0 8px ${data.statisticType === 'red' ? '#f5222d' : '#1890ff'}20, inset 0 4px 8px rgba(255, 255, 255, 0.15), inset 0 -4px 8px rgba(0, 0, 0, 0.4)`,
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    transform: data.sliderRange[1] >= data.allRecords.length - 1 ? 'translateZ(0) scale(0.95)' : 'translateZ(0) scale(1)'
                  }}
                  onClick={() => {
                    if (data.sliderRange[1] < data.allRecords.length - 1) {
                      const newRange: [number, number] = [data.sliderRange[0], data.allRecords.length - 1];
                      data.setSliderRange(newRange);
                      data.handleSliderChange(newRange);
                    }
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}>
                    <FastForwardOutlined style={{ fontSize: '18px' }} />
                  </div>
                </div>

                <div style={{
                  width: '100%',
                  margin: '0 auto',
                  padding: '0 6px',
                  position: 'relative',
                  boxSizing: 'border-box'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '6px',
                    right: '6px',
                    height: '6px',
                    transform: 'translateY(-50%)',
                    zIndex: -1,
                    background: data.statisticType === 'red'
                      ? 'rgba(245, 34, 45, 0.15)'
                      : 'rgba(24, 144, 255, 0.15)',
                    borderRadius: '3px'
                  }} />

                  <Slider
                    range
                    min={0}
                    max={data.allRecords.length - 1}
                    value={data.sliderRange}
                    onChange={data.handleSliderChange}
                    style={{
                      width: '100%',
                      margin: 0,
                      backgroundColor: 'transparent'
                    }}
                    trackStyle={[
                      {
                        background: data.statisticType === 'red'
                          ? 'linear-gradient(90deg, #f5222d 0%, #cf1322 100%)'
                          : 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)',
                        height: '4px',
                        borderRadius: '2px',
                        boxShadow: 'none'
                      }
                    ]}
                    handleStyle={[
                      {
                        backgroundColor: 'transparent',
                        borderColor: data.statisticType === 'red' ? '#f5222d' : '#1890ff'
                      },
                      {
                        backgroundColor: 'transparent',
                        borderColor: data.statisticType === 'red' ? '#f5222d' : '#1890ff'
                      }
                    ]}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

const BottomFloatingTabs: React.FC<{ isTabVisible: boolean }> = ({ isTabVisible }) => {
  const data = useStatisticsData();
  const navigate = useNavigate();

  return (
    <>
      {isTabVisible && (
        <div
          style={{
          position: 'fixed',
          left: `${data.tabContainerPosition.x}px`,
          top: `${data.tabContainerPosition.y}px`,
          backgroundColor: '#2a2a2a',
          borderRadius: '24px',
          boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.5)',
          padding: '8px 24px',
          width: 'fit-content',
          minWidth: '400px',
          maxWidth: '500px',
          cursor: data.isTabContainerDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
          onMouseDown={data.handleTabContainerMouseDown}
        >
          <Tabs
            activeKey={data.activeTabKey}
            onChange={(key) => navigate(tabKeyToPath[key] || '/lottery/statistics/frequency')}
            items={[
              ...(data.statisticType === 'red' ? [
                {
                  key: '1',
                  label: (
                    <div style={{
                      display: 'inline-block',
                      color: data.activeTabKey === '1' ? '#fff' : '#f5222d',
                      backgroundColor: data.activeTabKey === '1' ? '#f5222d' : '#3a3a3a',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      marginRight: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      频率统计
                    </div>
                  ),
                  children: null
                },
                {
                  key: '5',
                  label: (
                    <div style={{
                      display: 'inline-block',
                      color: data.activeTabKey === '5' ? '#fff' : '#f5222d',
                      backgroundColor: data.activeTabKey === '5' ? '#f5222d' : '#f0f0f0',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      marginRight: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      分组统计
                    </div>
                  ),
                  children: null
                },
                {
                  key: '3',
                  label: (
                    <div style={{
                      display: 'inline-block',
                      color: data.activeTabKey === '3' ? '#fff' : '#f5222d',
                      backgroundColor: data.activeTabKey === '3' ? '#f5222d' : '#f0f0f0',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      分布统计
                    </div>
                  ),
                  children: null
                },

              ] : [
                {
                  key: '2',
                  label: (
                    <div style={{
                      display: 'inline-block',
                      color: data.activeTabKey === '2' ? '#fff' : '#1890ff',
                      backgroundColor: data.activeTabKey === '2' ? '#1890ff' : '#f0f0f0',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      marginRight: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      频率统计
                    </div>
                  ),
                  children: null
                },
                {
                  key: '6',
                  label: (
                    <div style={{
                      display: 'inline-block',
                      color: data.activeTabKey === '6' ? '#fff' : '#1890ff',
                      backgroundColor: data.activeTabKey === '6' ? '#1890ff' : '#f0f0f0',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      marginRight: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      分组统计
                    </div>
                  ),
                  children: null
                },
                {
                  key: '4',
                  label: (
                    <div style={{
                      display: 'inline-block',
                      color: data.activeTabKey === '4' ? '#fff' : '#1890ff',
                      backgroundColor: data.activeTabKey === '4' ? '#1890ff' : '#f0f0f0',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      分布统计
                    </div>
                  ),
                  children: null
                },

              ])
            ]}
            style={{
              width: '100%',
              margin: 0,
              border: 'none',
              boxShadow: 'none'
            }}
            tabBarStyle={{
              borderBottom: 'none',
              backgroundColor: 'transparent',
              padding: '0',
              margin: '0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          />
        </div>
      )}
    </>
  );
};

const Footer: React.FC = () => {
  const data = useStatisticsData();
  const navigate = useNavigate();

  const activeStatisticMenuItem = statisticMenuItems.find(item =>
    data.activeTabKey === (data.statisticType === 'red' ? item.redTabKey : item.blueTabKey)
  ) || statisticMenuItems[0];
  const isStatisticMenuActive = statisticMenuItems.some(item =>
    data.activeTabKey === (data.statisticType === 'red' ? item.redTabKey : item.blueTabKey)
  );
  const ActiveStatisticIcon = activeStatisticMenuItem.icon;

  return (
    <footer className="app-footer" style={{
      textAlign: 'center',
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      height: '64px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backgroundImage: 'linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(0, 0, 0, 0.9))',
      zIndex: 1000,
      padding: '0 20px',
      boxSizing: 'border-box',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderBottom: '1px solid rgba(0, 0, 0, 0.3)'
    }}>
      <CloudFilled
        style={{ fontSize: '24px', color: '#fff', cursor: 'pointer', marginRight: '20px' }}
        onClick={() => navigate('/lottery/statistics/frequency')}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div
          className="footer-menu-item lottery-statistic-menu"
          style={{
            position: 'relative',
            fontSize: '14px',
            color: isStatisticMenuActive ? '#1890ff' : '#fff',
            cursor: 'pointer',
            fontWeight: isStatisticMenuActive ? 'bold' : 'normal',
            transition: 'color 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 12px',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            userSelect: 'none',
            overflow: 'visible'
          }}
          onClick={() => navigate(tabKeyToPath[data.statisticType === 'red' ? activeStatisticMenuItem.redTabKey : activeStatisticMenuItem.blueTabKey] || '/lottery/statistics/frequency')}
        >
          <ActiveStatisticIcon style={{ color: isStatisticMenuActive ? '#1890ff' : '#fff', transition: 'color 0.3s ease' }} /> 统计
          <div
            className="lottery-statistic-submenu"
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '100%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '92px',
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.88)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.36)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              opacity: 0,
              pointerEvents: 'none',
              transition: 'opacity 0.2s ease',
              zIndex: 1001
            }}
          >
            {statisticMenuItems.map(item => {
              const MenuIcon = item.icon;
              const tabKey = data.statisticType === 'red' ? item.redTabKey : item.blueTabKey;
              const isActive = data.activeTabKey === tabKey;

              return (
                <button
                  key={item.key}
                  type="button"
                  style={{
                    border: 0,
                    borderRadius: '6px',
                    background: isActive ? 'rgba(24, 144, 255, 0.18)' : 'transparent',
                    color: isActive ? '#1890ff' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 9px',
                    font: 'inherit',
                    fontSize: '13px',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(tabKeyToPath[tabKey] || '/lottery/statistics/frequency');
                  }}
                >
                  <MenuIcon style={{ color: isActive ? '#1890ff' : '#fff' }} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

interface StatisticsLayoutProps {
  isTabVisible: boolean;
  children: React.ReactNode;
  hideToggle?: boolean;
}

const StatisticsLayout: React.FC<StatisticsLayoutProps> = ({ isTabVisible, children, hideToggle }) => {
  return (
    <>
      {!hideToggle && <RedBlueToggle />}
      {!hideToggle && <SliderArea />}
      <div className="themed-route-page legacy-page-shell lottery-statistics-page">
        <div style={{ marginBottom: '80px' }}>
          {children}
        </div>
      </div>
      <BottomFloatingTabs isTabVisible={isTabVisible} />
      <Footer />
    </>
  );
};

export default StatisticsLayout;
