import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Progress } from 'antd';
import { CloudFilled, HeartFilled, FireFilled, CalendarOutlined, ClockCircleOutlined, MessageOutlined } from '@ant-design/icons';

// 隐藏滚动条的全局样式
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `;
  document.head.appendChild(style);
}

const HealthSpringEquinoxPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#000', 
      minHeight: '100vh',
      paddingBottom: '100px' // 为页脚留出空间
    }}>
      <div style={{ 
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        height: 'calc(100vh - 140px)' // 计算可用高度
      }}>
        {/* 右侧内容区 */}
        <div style={{ 
          width: '100%',
          height: '100%',
          overflowY: 'auto', // 允许右侧内容独立滚动
          overflowX: 'hidden', // 防止水平滚动
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE
          WebkitOverflowScrolling: 'touch', // 优化iOS设备的滚动
          paddingRight: '8px' // 为隐藏的滚动条留出空间
        }} className="no-scrollbar">
        {/* 标题卡片 */}
        <Card 
          style={{ 
            width: '100%', 
            textAlign: 'center',
            borderRadius: '20px', 
            boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(76, 175, 80, 0.4)',
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
            color: '#4CAF50',
            marginBottom: '16px'
          }}>
            春分健康管理
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#CCCCCC',
            marginBottom: '24px'
          }}>
            春分时节，万物复苏，是调理身体的最佳时机
          </div>
          <Progress 
            percent={75} 
            strokeColor="#4CAF50" 
            size="small"
            format={() => '75% 完成度'}
            strokeWidth={8}
            status="active"
          />
        </Card>

        {/* 春分特色内容卡片 */}
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
              boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
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
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(76, 175, 80, 0.4)'
              }}>
                <HeartFilled style={{ fontSize: '40px', color: '#4CAF50' }} />
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#4CAF50'
              }}>
                良好
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#CCCCCC',
                textAlign: 'center'
              }}>
                春分时节，阳气升发，身体状态良好
              </div>
            </div>
          </Card>

          {/* 节气特点卡片 */}
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
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
                  backgroundColor: '#4CAF50'
                }} />
                <span style={{ color: '#CCCCCC' }}>昼夜平分，阳气升发</span>
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
                  backgroundColor: '#4CAF50'
                }} />
                <span style={{ color: '#CCCCCC' }}>万物复苏，生机盎然</span>
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
                  backgroundColor: '#4CAF50'
                }} />
                <span style={{ color: '#CCCCCC' }}>肝气旺盛，宜疏肝理气</span>
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
                  backgroundColor: '#4CAF50'
                }} />
                <span style={{ color: '#CCCCCC' }}>天气多变，注意保暖</span>
              </div>
            </div>
          </Card>

          {/* 健康建议卡片 */}
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
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
                  backgroundColor: '#4CAF50'
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
                  backgroundColor: '#4CAF50'
                }} />
                <span style={{ color: '#CCCCCC' }}>饮食清淡，多吃时令蔬果</span>
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
                  backgroundColor: '#4CAF50'
                }} />
                <span style={{ color: '#CCCCCC' }}>保持心情舒畅，避免抑郁</span>
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
                  backgroundColor: '#4CAF50'
                }} />
                <span style={{ color: '#CCCCCC' }}>规律作息，保证充足睡眠</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 春分养生计划卡片 */}
        <Card 
          style={{ 
            width: '100%', 
            borderRadius: '20px', 
            boxShadow: '0 0 20px rgba(76, 175, 80, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(76, 175, 80, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(76, 175, 80, 0.4)',
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
              春分养生计划
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
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.2)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#4CAF50',
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
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.2)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#4CAF50',
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
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.2)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#4CAF50',
                marginBottom: '8px'
              }}>
                午间休息
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
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.2)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#4CAF50',
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
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.2)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#4CAF50',
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
            onClick={() => navigate('/health/spring-equinox')}
          >
            <MessageOutlined style={{ color: '#4CAF50', transition: 'color 0.3s ease' }} /> 春分
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

export default HealthSpringEquinoxPage;