import React, { useState } from 'react';
import { Card, Progress } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useRecordContext } from '../contexts/RecordContext';

const HealthWinterSolsticePage: React.FC = () => {
  const { allRecords, loading } = useRecordContext();
  const [currentRightPage, setCurrentRightPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
  const [showFullPage, setShowFullPage] = useState(false);

  return (
    <div className="themed-route-page health-fitness-page" style={{
      padding: '20px', 
      backgroundColor: '#000', 
      minHeight: '100vh',
      paddingBottom: '100px' // 为页脚留出空间
    }}>
      <div style={{
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* 标题卡片 */}
        <Card 
          style={{
            width: '100%', 
            textAlign: 'center',
            borderRadius: '20px', 
            boxShadow: '0 0 20px rgba(33, 150, 243, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(33, 150, 243, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(33, 150, 243, 0.4)',
            backgroundColor: '#2D2D2D',
            backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
            marginBottom: '32px',
            padding: '24px'
          }}
          title={null}
        >
          <div style={{
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#2196F3',
            marginBottom: '16px'
          }}>
            立冬健康管理
          </div>
          <div style={{
            fontSize: '14px', 
            color: '#CCCCCC',
            marginBottom: '24px'
          }}>
            立冬时节，寒意渐起，是调养身心的重要时期
          </div>
          <Progress 
            percent={95} 
            strokeColor="#2196F3" 
            size="small"
            format={() => '95% 完成度'}
            strokeWidth={8}
            status="active"
          />
        </Card>

        {/* 立冬特色内容卡片 */}
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          width: '100%',
          marginBottom: '32px'
        }}>
          {/* 健康状态卡片 */}
          <Card 
            style={{
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(33, 150, 243, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(33, 150, 243, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(33, 150, 243, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
              padding: '20px'
            }}
            title={
              <div style={{
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: '#FFFFFF',
                textAlign: 'center'
              }}>
                健康状态
              </div>
            }
          >
            <div style={{
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '80px', 
                height: '80px', 
                borderRadius: '50%',
                backgroundColor: 'rgba(33, 150, 243, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(33, 150, 243, 0.4)'
              }}>
                <ClockCircleOutlined style={{ fontSize: '40px', color: '#2196F3' }} />
              </div>
              <div style={{
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#2196F3'
              }}>
                良好
              </div>
              <div style={{
                fontSize: '14px', 
                color: '#CCCCCC',
                textAlign: 'center'
              }}>
                立冬时节，寒意渐起，身体状态稳定
              </div>
            </div>
          </Card>

          {/* 节气特点卡片 */}
          <Card 
            style={{
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(33, 150, 243, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(33, 150, 243, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(33, 150, 243, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
              padding: '20px'
            }}
            title={
              <div style={{
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: '#FFFFFF',
                textAlign: 'center'
              }}>
                节气特点
              </div>
            }
          >
            <div style={{
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px'
            }}>
              <div style={{
                display: 'flex', 
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#2196F3'
                }} />
                <span style={{ color: '#CCCCCC' }}>白昼最短，黑夜最长</span>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#2196F3'
                }} />
                <span style={{ color: '#CCCCCC' }}>气温最低，天气寒冷</span>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#2196F3'
                }} />
                <span style={{ color: '#CCCCCC' }}>阳气始生，万物潜藏</span>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#2196F3'
                }} />
                <span style={{ color: '#CCCCCC' }}>肾气虚衰，易生疾病</span>
              </div>
            </div>
          </Card>

          {/* 健康建议卡片 */}
          <Card 
            style={{
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(33, 150, 243, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(33, 150, 243, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(33, 150, 243, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
              padding: '20px'
            }}
            title={
              <div style={{
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: '#FFFFFF',
                textAlign: 'center'
              }}>
                健康建议
              </div>
            }
          >
            <div style={{
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px'
            }}>
              <div style={{
                display: 'flex', 
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#2196F3'
                }} />
                <span style={{ color: '#CCCCCC' }}>适量运动，增强体质</span>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#2196F3'
                }} />
                <span style={{ color: '#CCCCCC' }}>饮食温热，多吃补肾食物</span>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#2196F3'
                }} />
                <span style={{ color: '#CCCCCC' }}>保持心情舒畅，避免忧郁</span>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#2196F3'
                }} />
                <span style={{ color: '#CCCCCC' }}>规律作息，保证充足睡眠</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 立冬养生计划卡片 */}
        <Card 
          style={{
            width: '100%', 
            borderRadius: '20px', 
            boxShadow: '0 0 20px rgba(33, 150, 243, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(33, 150, 243, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(33, 150, 243, 0.4)',
            backgroundColor: '#2D2D2D',
            backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
            padding: '24px'
          }}
          title={
            <div style={{
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#FFFFFF',
              textAlign: 'center'
            }}>
              立冬养生计划
            </div>
          }
        >
          <div style={{
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.2)'
            }}>
              <div style={{
                fontSize: '14px', 
                color: '#2196F3',
                marginBottom: '8px'
              }}>
                晨起锻炼
              </div>
              <div style={{
                fontSize: '12px', 
                color: '#CCCCCC'
              }}>
                6:30-7:30
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.2)'
            }}>
              <div style={{
                fontSize: '14px', 
                color: '#2196F3',
                marginBottom: '8px'
              }}>
                早餐营养
              </div>
              <div style={{
                fontSize: '12px', 
                color: '#CCCCCC'
              }}>
                7:30-8:30
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.2)'
            }}>
              <div style={{
                fontSize: '14px', 
                color: '#2196F3',
                marginBottom: '8px'
              }}>
                午后休息
              </div>
              <div style={{
                fontSize: '12px', 
                color: '#CCCCCC'
              }}>
                12:00-13:00
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.2)'
            }}>
              <div style={{
                fontSize: '14px', 
                color: '#2196F3',
                marginBottom: '8px'
              }}>
                傍晚散步
              </div>
              <div style={{
                fontSize: '12px', 
                color: '#CCCCCC'
              }}>
                16:00-17:00
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.2)'
            }}>
              <div style={{
                fontSize: '14px', 
                color: '#2196F3',
                marginBottom: '8px'
              }}>
                睡前放松
              </div>
              <div style={{
                fontSize: '12px', 
                color: '#CCCCCC'
              }}>
                20:30-21:30
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HealthWinterSolsticePage;
