import { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, message, DatePicker, Input } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { recordApi } from '../services/api';

// 记录类型定义
interface RecordItem {
  code: string;
  date: string;
  week: string;
  red: string;
  blue: string;
  sales: string;
  poolmoney: string;
}

// 查询参数类型定义
interface QueryParams {
  name?: string;
  dayStart?: string;
  dayEnd?: string;
  issueStart?: string;
  issueEnd?: string;
}

const RecordList: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [issueRange, setIssueRange] = useState<[string, string]>(['', '']);
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  // 分页状态管理
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 使用ref防止useEffect在StrictMode下运行两次
  const hasFetchedRef = useRef(false);

  // 组件加载时获取最新记录
  useEffect(() => {
    // 防止在StrictMode下运行两次
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    // 获取最新记录
    recordApi.getLast()
      .then((data) => {
        if (data && data.code) {
          // 解析最新期号，计算起始期号
          const latestIssue = data.code;
          if (latestIssue.length === 7) {
            // 期号格式：YYYYNNN（YYYY为年份，NNN为期数）
            const year = latestIssue.slice(0, 4);
            const issueNumber = parseInt(latestIssue.slice(4));
            // 计算起始期号：最新期号减10，最小为该年第一期
            const startIssueNumber = Math.max(issueNumber - 10, 1);
            // 格式化为3位数字，不足补零
            const formattedStartIssueNumber = startIssueNumber.toString().padStart(3, '0');
            const startIssue = `${year}${formattedStartIssueNumber}`;
            
            // 设置期号范围：起始期号到最新期号
            setIssueRange([startIssue, latestIssue]);
            // 自动查询
            fetchRecords(startIssue, latestIssue);
          }
        }
      })
      .catch((error) => {
        console.error('获取最新记录失败:', error);
        message.error('获取最新记录失败，请稍后重试');
      });
  }, []);

  // 获取记录数据
  const fetchRecords = (start: string, end: string, isDateRange = false) => {
    setLoading(true);

    // 构建请求体
    const requestBody: QueryParams = {
      name: 'ssq', // 默认值
      ...(isDateRange
        ? {
            dayStart: start,
            dayEnd: end,
          }
        : {
            issueStart: start,
            issueEnd: end,
          }),
    };

    recordApi.find(requestBody)
      .then((data) => {
        if (Array.isArray(data)) {
          // 按期号倒序排序
          const sortedData = data.sort((a: RecordItem, b: RecordItem) => {
            return b.code.localeCompare(a.code);
          });
          setRecords(sortedData);
          message.success(`查询成功，共${sortedData.length}条记录`);
          
          // 设置日期组件的初始日期：第一条记录（最新）的日期作为结束日期，最后一条记录（最旧）的日期作为开始日期
          if (sortedData.length > 0) {
            const latestRecord = sortedData[0]; // 第一条是最新记录
            const oldestRecord = sortedData[sortedData.length - 1]; // 最后一条是最旧记录
            setStartDate(dayjs(oldestRecord.date)); // 开始日期是最旧记录的日期
            setEndDate(dayjs(latestRecord.date)); // 结束日期是最新记录的日期
            
            // 将返回记录对应的开始期号和结束期号回显到期号查询输入框内
            setIssueRange([oldestRecord.code, latestRecord.code]);
          }
        } else {
          setRecords([]);
          message.warning('查询结果格式不正确');
        }
      })
      .catch((error) => {
        console.error('获取记录失败:', error);
        message.error('获取记录失败，请稍后重试');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // 根据期号范围查询
  const handleIssueQuery = () => {
    const [start, end] = issueRange;
    if (!start || !end) {
      message.warning('请输入完整的期号范围');
      return;
    }
    fetchRecords(start, end, false);
  };

  // 移除未使用的handleDateQuery函数，日期查询直接在onChange事件中处理

  // 处理输入变化
  const handleInputChange = (index: number, value: string) => {
    const newRange = [...issueRange];
    newRange[index] = value;
    setIssueRange(newRange as [string, string]);
  };

  // 表格列配置
  const columns = [
    {
      title: '期号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      ellipsis: true,
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      ellipsis: true,
    },
    {
      title: '红球',
      dataIndex: 'red',
      key: 'red',
      width: 200,
      ellipsis: true,
      render: (_: React.ReactNode, record: RecordItem) => {
        const text = record.red;
        if (!text) return null;
        const redBalls = text.split(',');
        return (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {redBalls.map((ball, index) => (
              <span
                key={index}
                style={{
                  display: 'inline-block',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#f5222d',
                  color: '#fff',
                  textAlign: 'center',
                  lineHeight: '32px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                {ball}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      title: '蓝球',
      dataIndex: 'blue',
      key: 'blue',
      width: 80,
      ellipsis: true,
      render: (_: React.ReactNode, record: RecordItem) => {
        const text = record.blue;
        if (!text) return null;
        return (
          <span
            style={{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#1890ff',
              color: '#fff',
              textAlign: 'center',
              lineHeight: '32px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {text}
          </span>
        );
      },
    },
  ];

  return (
    <Card title="记录查询" bordered={false} style={{ width: '100%' }}>
      {/* 查询条件区域 */}
      <div className="query-container">
        <Row gutter={[16, 16]}>
          {/* 按日期范围查询 */}
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={8}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 500 }}>按日期范围查询</h4>
            <Row gutter={[16, 16]} align="middle" wrap>
              <Col xs={24} sm={20} lg={16}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <DatePicker
                    style={{ width: '100%', flex: 1, minWidth: '120px' }}
                    value={startDate}
                    onChange={(date) => {
                      const newStartDate = date || dayjs();
                      setStartDate(newStartDate);
                      // 确保两个日期都有值才查询
                      if (endDate) {
                        const start = newStartDate.format('YYYY-MM-DD');
                        const end = endDate.format('YYYY-MM-DD');
                        fetchRecords(start, end, true);
                      }
                    }}
                    placeholder="开始日期"
                  />
                  <span style={{ margin: '0 8px', whiteSpace: 'nowrap' }}>至</span>
                  <DatePicker
                    style={{ width: '100%', flex: 1, minWidth: '120px' }}
                    value={endDate}
                    onChange={(date) => {
                      const newEndDate = date || dayjs();
                      setEndDate(newEndDate);
                      // 确保两个日期都有值才查询
                      if (startDate) {
                        const start = startDate.format('YYYY-MM-DD');
                        const end = newEndDate.format('YYYY-MM-DD');
                        fetchRecords(start, end, true);
                      }
                    }}
                    placeholder="结束日期"
                  />
                </div>
              </Col>
            </Row>
          </Col>

          {/* 按期号范围查询 */}
          <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={8}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 500 }}>按期号范围查询</h4>
            <Row gutter={[16, 16]} align="middle" wrap>
              <Col xs={24} sm={20} lg={16}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Input
                    style={{ width: '100%', flex: 1, minWidth: '120px' }}
                    value={issueRange[0]}
                    onChange={(e) => handleInputChange(0, e.target.value)}
                    onPressEnter={handleIssueQuery}
                    placeholder="开始期号"
                  />
                  <span style={{ margin: '0 8px', whiteSpace: 'nowrap' }}>至</span>
                  <Input
                    style={{ width: '100%', flex: 1, minWidth: '120px' }}
                    value={issueRange[1]}
                    onChange={(e) => handleInputChange(1, e.target.value)}
                    onPressEnter={handleIssueQuery}
                    placeholder="结束期号"
                  />
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {/* 记录列表 */}
      <div style={{ marginTop: 24, overflowX: 'auto', width: '100%' }}>
        <ProTable
          columns={columns}
          dataSource={records}
          rowKey="code"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            responsive: true,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            onShowSizeChange: (_, size) => {
              setPageSize(size);
              setCurrentPage(1); // 当页大小变化时，重置到第一页
            },
          }}
          search={false}
          toolBarRender={false}
          scroll={{
            x: 800, // 最小宽度，确保表格在小屏幕上可以横向滚动
            y: 'auto',
          }}
          size="middle"
          bordered={false}
          style={{ width: '100%' }}
        />
      </div>
    </Card>
  );
};

export default RecordList;
