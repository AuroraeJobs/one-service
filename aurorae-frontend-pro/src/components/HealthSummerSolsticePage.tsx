import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Progress } from 'antd';
import { CloudFilled, HeartFilled, FireFilled, CalendarOutlined, ClockCircleOutlined, MessageOutlined } from '@ant-design/icons';
import { useRecordContext } from '../contexts/RecordContext';

const HealthSummerSolsticePage: React.FC = () => {
  const { allRecords, loading } = useRecordContext();
  const navigate = useNavigate();
  const [currentRightPage, setCurrentRightPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
  const [showFullPage, setShowFullPage] = useState(false);

  return (
    <div style={{ 
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
            boxShadow: '0 0 20px rgba(255, 152, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 152, 0, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 152, 0, 0.4)',
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
            color: '#FF9800',
            marginBottom: '16px'
          }}>
            夏至健康管理
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#CCCCCC',
            marginBottom: '24px'
          }}>
            夏至时节，阳气旺盛，是调养身心的重要时期
          </div>
          <Progress 
            percent={85} 
            strokeColor="#FF9800" 
            size="small"
            format={() => '85% 完成度'}
            strokeWidth={8}
            status="active"
          />
        </Card>

        {/* 夏至特色内容卡片 */}
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
              boxShadow: '0 0 20px rgba(255, 152, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 152, 0, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 152, 0, 0.4)',
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
                backgroundColor: 'rgba(255, 152, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(255, 152, 0, 0.4)'
              }}>
                <FireFilled style={{ fontSize: '40px', color: '#FF9800' }} />
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#FF9800'
              }}>
                良好
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#CCCCCC',
                textAlign: 'center'
              }}>
                夏至时节，阳气旺盛，身体代谢加快
              </div>
            </div>
          </Card>

          {/* 节气特点卡片 */}
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(255, 152, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 152, 0, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 152, 0, 0.4)',
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
                  backgroundColor: '#FF9800'
                }} />
                <span style={{ color: '#CCCCCC' }}>阳气最盛，白昼最长</span>
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
                  backgroundColor: '#FF9800'
                }} />
                <span style={{ color: '#CCCCCC' }}>气温升高，湿度增大</span>
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
                  backgroundColor: '#FF9800'
                }} />
                <span style={{ color: '#CCCCCC' }}>心火旺盛，易烦躁不安</span>
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
                  backgroundColor: '#FF9800'
                }} />
                <span style={{ color: '#CCCCCC' }}>新陈代谢加快，消耗增加</span>
              </div>
            </div>
          </Card>

          {/* 健康建议卡片 */}
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(255, 152, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 152, 0, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 152, 0, 0.4)',
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
                  backgroundColor: '#FF9800'
                }} />
                <span style={{ color: '#CCCCCC' }}>适量运动，避免烈日暴晒</span>
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
                  backgroundColor: '#FF9800'
                }} />
                <span style={{ color: '#CCCCCC' }}>饮食清淡，多吃清热解暑食物</span>
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
                  backgroundColor: '#FF9800'
                }} />
                <span style={{ color: '#CCCCCC' }}>保持心情舒畅，避免急躁易怒</span>
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
                  backgroundColor: '#FF9800'
                }} />
                <span style={{ color: '#CCCCCC' }}>规律作息，保证充足睡眠</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 夏至养生计划卡片 */}
        <Card 
          style={{ 
            width: '100%', 
            borderRadius: '20px', 
            boxShadow: '0 0 20px rgba(255, 152, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 152, 0, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 152, 0, 0.4)',
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
              夏至养生计划
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
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.2)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#FF9800',
                marginBottom: '8px'
              }}>
                晨起锻炼
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#CCCCCC'
              }}>
                5:30-6:30
              </div>
            </div>
            <div style={{ 
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.2)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#FF9800',
                marginBottom: '8px'
              }}>
                早餐营养
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
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.2)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#FF9800',
                marginBottom: '8px'
              }}>
                午后休息
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#CCCCCC'
              }}>
                12:00-14:00
              </div>
            </div>
            <div style={{ 
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.2)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#FF9800',
                marginBottom: '8px'
              }}>
                傍晚散步
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#CCCCCC'
              }}>
                18:00-19:00
              </div>
            </div>
            <div style={{ 
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.2)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#FF9800',
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

      {/* 页脚 */}
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
        color: '#e2e8f0',
        zIndex: 1000,
        padding: '0 20px',
        boxSizing: 'border-box',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.3)'
      }}>
        {/* 图标 - 点击回到首页 */}
        <CloudFilled 
          style={{ fontSize: '24px', color: '#e2e8f0', cursor: 'pointer', marginRight: '20px' }} 
        />
        {/* 功能菜单 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '12px'
        }}>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/health')}
          >
            <HeartFilled style={{ color: '#4CAF50', transition: 'color 0.3s ease' }} /> 立春
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/hexagram')}
          >
            <FireFilled style={{ color: '#FF0000', transition: 'color 0.3s ease' }} /> 立夏
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/health/third')}
          >
            <CalendarOutlined style={{ color: '#9C27B0', transition: 'color 0.3s ease' }} /> 立秋
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/health/fourth')}
          >
            <ClockCircleOutlined style={{ color: '#FFEB3B', transition: 'color 0.3s ease' }} /> 立冬
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/health/spring-equinox')}
          >
            <MessageOutlined style={{ color: '#4CAF50', transition: 'color 0.3s ease' }} /> 春分
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#1890ff',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/health/summer-solstice')}
          >
            <FireFilled style={{ color: '#FF9800', transition: 'color 0.3s ease' }} /> 夏至
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/health/autumn-equinox')}
          >
            <CalendarOutlined style={{ color: '#FF5722', transition: 'color 0.3s ease' }} /> 秋分
          </div>
          <div 
            style={{ 
              fontSize: '14px', 
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'normal',
              transition: 'color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              userSelect: 'none'
            }}
            onClick={() => navigate('/health/winter-solstice')}
          >
            <ClockCircleOutlined style={{ color: '#2196F3', transition: 'color 0.3s ease' }} /> 冬至
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HealthSummerSolsticePage;