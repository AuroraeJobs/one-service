import React, { useState } from 'react';
import LeftMenu from './LeftMenu';
import { Card, Progress } from 'antd';
import { useRecordContext } from '../contexts/RecordContext';

const HealthFourthPage: React.FC = () => {
  const { allRecords } = useRecordContext();
  const [currentPage, setCurrentPage] = useState(1);
  
  // 计算总期数
  const calculateTotalPeriods = () => {
    if (!allRecords) return 0;
    if (typeof allRecords === 'string') {
      return allRecords
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .length;
    } else if (Array.isArray(allRecords)) {
      return allRecords.length;
    }
    return 0;
  };
  
  const totalPeriods = calculateTotalPeriods();

  return (
    <div className="health-fourth-page" style={{ 
      minHeight: 'calc(100vh - 64px)', 
      backgroundColor: '#000000',
      color: '#FFFFFF',
      display: 'flex'
    }}>
      {/* 左侧菜单Docker栏 */}
      <LeftMenu />

      {/* 主要内容区域 */}
      <div style={{ flex: 1, marginLeft: '80px', padding: '20px' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#1890ff',
            textShadow: '0 0 20px rgba(24, 144, 255, 0.5)'
          }}>
            健康时间管理
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#CCCCCC',
            marginTop: '8px'
          }}>
            分析您的健康数据时间分布，优化健康管理策略
          </p>
        </div>

        {/* 时间分布概览卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {/* 总期数卡片 */}
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(24, 144, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(24, 144, 255, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(24, 144, 255, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
              height: '200px',
              padding: '16px'
            }}
          >
            <div style={{ 
              height: '160px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: 'bold', 
                  color: '#1890ff',
                  marginBottom: '8px'
                }}>
                  {totalPeriods}
                </div>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#CCCCCC',
                  margin: 0
                }}>
                  总期数
                </p>
              </div>
            </div>
          </Card>

          {/* 平均周期卡片 */}
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(24, 144, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(24, 144, 255, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(24, 144, 255, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
              height: '200px',
              padding: '16px'
            }}
          >
            <div style={{ 
              height: '160px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: 'bold', 
                  color: '#4CAF50',
                  marginBottom: '8px'
                }}>
                  7.2
                </div>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#CCCCCC',
                  margin: 0
                }}>
                  平均周期 (天)
                </p>
              </div>
            </div>
          </Card>

          {/* 时间效率卡片 */}
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(24, 144, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(24, 144, 255, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(24, 144, 255, 0.4)',
              backgroundColor: '#2D2D2D',
              backgroundImage: 'linear-gradient(145deg, #2A2A2A, #1D1D1D)',
              height: '200px',
              padding: '16px'
            }}
          >
            <div style={{ 
              height: '160px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: 'bold', 
                  color: '#FF5722',
                  marginBottom: '8px'
                }}>
                  92%
                </div>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#CCCCCC',
                  margin: 0
                }}>
                  时间效率
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* 时间趋势分析卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
          <Card 
            style={{ 
              borderRadius: '20px', 
              boxShadow: '0 0 20px rgba(24, 144, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(24, 144, 255, 0.1), inset 0 6px 12px rgba(255, 255, 255, 0.15), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(24, 144, 255, 0.4)',
              backgroundColor: '#1A1A1A',
              backgroundImage: 'linear-gradient(145deg, #252525, #101010)',
              padding: '24px'
            }}
            title={
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>
                时间趋势分析
              </span>
            }
          >
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: '#1890ff',
                marginBottom: '16px'
              }}>
                健康数据时间分布
              </h3>
              <div style={{ height: '300px', backgroundColor: '#2D2D2D', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#CCCCCC' }}>时间趋势图表将在此显示</p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: '#1890ff',
                marginBottom: '16px'
              }}>
                时间管理建议
              </h3>
              <div style={{ backgroundColor: '#2D2D2D', borderRadius: '12px', padding: '16px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ 
                    padding: '8px 0', 
                    borderBottom: '1px solid #333333',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: '#1890ff',
                      marginRight: '12px'
                    }}></span>
                    <span>建立固定的健康数据记录时间，提高数据的一致性</span>
                  </li>
                  <li style={{ 
                    padding: '8px 0', 
                    borderBottom: '1px solid #333333',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: '#1890ff',
                      marginRight: '12px'
                    }}></span>
                    <span>分析数据的时间规律，调整健康管理策略</span>
                  </li>
                  <li style={{ 
                    padding: '8px 0', 
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: '#1890ff',
                      marginRight: '12px'
                    }}></span>
                    <span>利用时间趋势预测，提前做好健康干预</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* 分页控件 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '12px',
          marginTop: '32px'
        }}>
          <button 
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#1890ff22',
              color: '#1890ff',
              border: '1px solid #1890ff50',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(24, 144, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              const button = e.currentTarget;
              button.style.transform = 'translateZ(8px) scale(1.05)';
              button.style.boxShadow = '0 0 12px rgba(24, 144, 255, 0.7), 0 8px 20px rgba(0, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              const button = e.currentTarget;
              button.style.transform = 'translateZ(0) scale(1)';
              button.style.boxShadow = '0 0 8px rgba(24, 144, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4)';
            }}
          >
            ←
          </button>
          <span style={{ fontSize: '14px', color: '#CCCCCC' }}>
            {currentPage} / 1
          </span>
          <button 
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#1890ff22',
              color: '#1890ff',
              border: '1px solid #1890ff50',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(24, 144, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              const button = e.currentTarget;
              button.style.transform = 'translateZ(8px) scale(1.05)';
              button.style.boxShadow = '0 0 12px rgba(24, 144, 255, 0.7), 0 8px 20px rgba(0, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              const button = e.currentTarget;
              button.style.transform = 'translateZ(0) scale(1)';
              button.style.boxShadow = '0 0 8px rgba(24, 144, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4)';
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthFourthPage;