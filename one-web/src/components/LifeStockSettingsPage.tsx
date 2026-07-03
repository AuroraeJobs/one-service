import { Card, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SettingOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';

interface SettingRow {
  key: string;
  name: string;
  value: string;
  status: string;
  note: string;
}

const settingRows: SettingRow[] = [
  {
    key: 'provider',
    name: 'stock.market.provider',
    value: 'sina',
    status: '配置项',
    note: '当前由后端配置决定，页面只展示规划，不直接写配置。'
  },
  {
    key: 'fallback',
    name: 'stock.market.fallback-providers',
    value: '[]',
    status: '配置项',
    note: '后续接入第二数据源后展示主备顺序。'
  },
  {
    key: 'quoteTtl',
    name: 'quote-cache-ttl-seconds',
    value: '10',
    status: '配置项',
    note: 'Redis 最新行情缓存 TTL。'
  },
  {
    key: 'fallbackTtl',
    name: 'fallback-cache-ttl-seconds',
    value: '604800',
    status: '配置项',
    note: 'Redis last-success fallback 快照 TTL。'
  },
  {
    key: 'klineCron',
    name: 'kline-sync-cron',
    value: '0 30 15 * * MON-FRI',
    status: '配置项',
    note: 'K线定时同步计划。'
  },
  {
    key: 'alertCron',
    name: 'alert-evaluation-cron',
    value: '0 */5 9-15 * * MON-FRI',
    status: '配置项',
    note: '告警定时评估计划。'
  }
];

const futureRows: SettingRow[] = [
  {
    key: 'defaultAccount',
    name: '默认账户',
    value: '-',
    status: '待设计',
    note: '需要用户偏好持久化。'
  },
  {
    key: 'defaultCurrency',
    name: '默认币种',
    value: 'CNY',
    status: '待设计',
    note: '需要和账户/组合模型统一。'
  },
  {
    key: 'chartPeriod',
    name: '默认K线周期',
    value: 'daily',
    status: '待设计',
    note: '需要前端偏好或后端偏好 API。'
  },
  {
    key: 'refreshInterval',
    name: '行情刷新间隔',
    value: '-',
    status: '待设计',
    note: '需要避免绕过后端 Redis TTL 策略。'
  }
];

const LifeStockSettingsPage = () => {
  const columns: ColumnsType<SettingRow> = [
    {
      title: '设置项',
      dataIndex: 'name',
      key: 'name',
      render: value => (
        <span>
          <SettingOutlined /> {value}
        </span>
      )
    },
    {
      title: '当前值',
      dataIndex: 'value',
      key: 'value',
      render: value => <code>{value}</code>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: value => <Tag color={value === '配置项' ? 'blue' : 'orange'}>{value}</Tag>
    },
    {
      title: '说明',
      dataIndex: 'note',
      key: 'note'
    }
  ];

  return (
    <LifePageShell
      className="life-investment-page"
      eyebrow="股票设置"
      title="先把配置边界说明清楚，再设计可持久化的用户偏好。"
    >
      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>后端配置项</h2>
            <p>这些值由 Spring 配置和后端默认值控制，当前页面只读展示规划，避免前端写入不可持久化的假设置。</p>
          </div>
        </div>
        <Table
          rowKey={record => record.key}
          columns={columns}
          dataSource={settingRows}
          pagination={false}
          scroll={{ x: 760 }}
          rowClassName="stock-quote-row"
        />
      </Card>

      <Card className="life-panel-card stock-market-panel">
        <div className="stock-market-toolbar">
          <div>
            <h2>后续用户偏好</h2>
            <p>这些设置需要先设计 MongoDB 持久化模型和 API，再接入可编辑控件。</p>
          </div>
        </div>
        <Table
          rowKey={record => record.key}
          columns={columns}
          dataSource={futureRows}
          pagination={false}
          scroll={{ x: 760 }}
          rowClassName="stock-quote-row"
        />
      </Card>
    </LifePageShell>
  );
};

export default LifeStockSettingsPage;
