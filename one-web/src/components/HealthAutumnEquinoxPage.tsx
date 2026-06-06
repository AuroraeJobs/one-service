import React, { useState } from 'react';
import { Card, Progress } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useRecordContext } from '../contexts/RecordContext';

const HealthAutumnEquinoxPage: React.FC = () => {
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
            boxShadow: '0 0 20px rgba(255, 87, 34, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 87, 34, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 87, 34, 0.4)',
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
            color: '#FF5722',
            marginBottom: '16px'
          }}>
            立秋健康管理
          </div>
          <div style={{
            fontSize: '14px', 
            color: '#CCCCCC',
            marginBottom: '24px'
          }}>
            立秋时节，暑气渐收，是调养身心的重要时期
          </div>
          <Progress 
            percent={90} 
            strokeColor="#FF5722" 
            size="small"
            format={() => '90% 完成度'}
            strokeWidth={8}
            status="active"
          />
        </Card>

        {/* 立秋特色内容卡片 */}
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
              boxShadow: '0 0 20px rgba(255, 87, 34, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 87, 34, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 87, 34, 0.4)',
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
                backgroundColor: 'rgba(255, 87, 34, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(255, 87, 34, 0.4)'
              }}>
                <CalendarOutlined style={{ fontSize: '40px', color: '#FF5722' }} />
              </div>
              <div style={{
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#FF5722'
              }}>
                良好
              </div>
              <div style={{
                fontSize: '14px', 
                color: '#CCCCCC',
                textAlign: 'center'
              }}>
                立秋时节，暑气渐收，身体状态稳定
              </div>
            </div>
          </Card>

          {/* 节气特点卡片 */}
          <Card 
            style={{
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(255, 87, 34, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 87, 34, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 87, 34, 0.4)',
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
                  backgroundColor: '#FF5722'
                }} />
                <span style={{ color: '#CCCCCC' }}>昼夜平分，阴阳平衡</span>
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
                  backgroundColor: '#FF5722'
                }} />
                <span style={{ color: '#CCCCCC' }}>气温下降，气候干燥</span>
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
                  backgroundColor: '#FF5722'
                }} />
                <span style={{ color: '#CCCCCC' }}>肺气旺盛，易伤津液</span>
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
                  backgroundColor: '#FF5722'
                }} />
                <span style={{ color: '#CCCCCC' }}>秋收冬藏，调理脾胃</span>
              </div>
            </div>
          </Card>

          {/* 健康建议卡片 */}
          <Card 
            style={{
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(255, 87, 34, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 87, 34, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 87, 34, 0.4)',
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
                  backgroundColor: '#FF5722'
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
                  backgroundColor: '#FF5722'
                }} />
                <span style={{ color: '#CCCCCC' }}>饮食清淡，多吃润肺食物</span>
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
                  backgroundColor: '#FF5722'
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
                  backgroundColor: '#FF5722'
                }} />
                <span style={{ color: '#CCCCCC' }}>规律作息，保证充足睡眠</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 立秋养生计划卡片 */}
        <Card 
          style={{
            width: '100%', 
            borderRadius: '20px', 
            boxShadow: '0 0 20px rgba(255, 87, 34, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 87, 34, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 87, 34, 0.4)',
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
              立秋养生计划
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
              backgroundColor: 'rgba(255, 87, 34, 0.1)',
              border: '1px solid rgba(255, 87, 34, 0.2)'
            }}>
              <div style={{
                fontSize: '14px', 
                color: '#FF5722',
                marginBottom: '8px'
              }}>
                晨起锻炼
              </div>
              <div style={{
                fontSize: '12px', 
                color: '#CCCCCC'
              }}>
                6:00-7:00
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 87, 34, 0.1)',
              border: '1px solid rgba(255, 87, 34, 0.2)'
            }}>
              <div style={{
                fontSize: '14px', 
                color: '#FF5722',
                marginBottom: '8px'
              }}>
                早餐营养
              </div>
              <div style={{
                fontSize: '12px', 
                color: '#CCCCCC'
              }}>
                7:00-8:00
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 87, 34, 0.1)',
              border: '1px solid rgba(255, 87, 34, 0.2)'
            }}>
              <div style={{
                fontSize: '14px', 
                color: '#FF5722',
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
              backgroundColor: 'rgba(255, 87, 34, 0.1)',
              border: '1px solid rgba(255, 87, 34, 0.2)'
            }}>
              <div style={{
                fontSize: '14px', 
                color: '#FF5722',
                marginBottom: '8px'
              }}>
                傍晚散步
              </div>
              <div style={{
                fontSize: '12px', 
                color: '#CCCCCC'
              }}>
                17:00-18:00
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 87, 34, 0.1)',
              border: '1px solid rgba(255, 87, 34, 0.2)'
            }}>
              <div style={{
                fontSize: '14px', 
                color: '#FF5722',
                marginBottom: '8px'
              }}>
                睡前放松
              </div>
              <div style={{
                fontSize: '12px', 
                color: '#CCCCCC'
              }}>
                21:00-22:00
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HealthAutumnEquinoxPage;
