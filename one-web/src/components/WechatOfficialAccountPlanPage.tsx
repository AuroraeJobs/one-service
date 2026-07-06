import { useMemo, useState } from 'react';
import { Button, Segmented, Space, Tag } from 'antd';
import { FileTextOutlined, PictureOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import {
  wechatPublishingChecklist,
  wechatPublishingPlan,
  type WechatPlannedArticle
} from '../constants/wechatOfficialAccountPlan';
import './WechatOfficialAccountPage.css';

const getStatusColor = (status: WechatPlannedArticle['status']) => {
  if (status === 'Published') return 'green';
  if (status === 'Drafted') return 'blue';
  return 'orange';
};

const WechatOfficialAccountPlanPage = () => {
  const [selectedDate, setSelectedDate] = useState(wechatPublishingPlan[0]?.date);
  const selectedArticle = useMemo(
    () => wechatPublishingPlan.find(item => item.date === selectedDate) || wechatPublishingPlan[0],
    [selectedDate]
  );

  return (
    <LifePageShell
      eyebrow="OneAI Daily"
      title="发布规划"
      actions={(
        <Space wrap>
          <Tag color="blue">2026-07</Tag>
          <Tag>{wechatPublishingPlan.length} 篇</Tag>
        </Space>
      )}
    >
      <section className="wechat-official-account-panel">
        <div className="wechat-official-account-panel-header">
          <strong>发布日历</strong>
          <Segmented
            size="small"
            value={selectedDate}
            onChange={(value) => setSelectedDate(String(value))}
            options={wechatPublishingPlan.map(item => ({
              label: item.date.slice(5),
              value: item.date
            }))}
          />
        </div>
        <div className="wechat-plan-calendar-grid">
          {wechatPublishingPlan.map(item => (
            <button
              key={item.date}
              type="button"
              className={`wechat-plan-calendar-card ${item.date === selectedArticle.date ? 'is-active' : ''}`}
              onClick={() => setSelectedDate(item.date)}
            >
              <span>{item.date}</span>
              <strong>{item.title}</strong>
              <em>{item.theme}</em>
              <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
            </button>
          ))}
        </div>
      </section>

      <div className="wechat-plan-detail-grid">
        <section className="wechat-official-account-panel">
          <div className="wechat-official-account-panel-header">
            <Space>
              <FileTextOutlined />
              <strong>{selectedArticle.title}</strong>
            </Space>
            <Tag color={getStatusColor(selectedArticle.status)}>{selectedArticle.status}</Tag>
          </div>
          <div className="wechat-plan-detail">
            <p className="wechat-plan-digest">{selectedArticle.digest}</p>
            <dl className="wechat-plan-meta">
              <div>
                <dt>Article</dt>
                <dd>{selectedArticle.articlePath}</dd>
              </div>
              <div>
                <dt>Images</dt>
                <dd>{selectedArticle.imagePlanPath}</dd>
              </div>
              <div>
                <dt>Notes</dt>
                <dd>{selectedArticle.notes}</dd>
              </div>
            </dl>
            <h3>今日关注</h3>
            <ul>
              {selectedArticle.focus.map(item => <li key={item}>{item}</li>)}
            </ul>
            <h3>深读</h3>
            <div className="wechat-plan-section-list">
              {selectedArticle.sections.map(section => (
                <article key={section.title}>
                  <strong>{section.title}</strong>
                  <p>{section.summary}</p>
                </article>
              ))}
            </div>
            <h3>OneAI 观察</h3>
            <p>{selectedArticle.observation}</p>
          </div>
        </section>

        <section className="wechat-official-account-panel">
          <div className="wechat-official-account-panel-header">
            <Space>
              <PictureOutlined />
              <strong>配图计划</strong>
            </Space>
            <Tag>{selectedArticle.images.length} 张</Tag>
          </div>
          <div className="wechat-plan-image-list">
            {selectedArticle.images.map(image => (
              <article key={`${image.slot}-${image.filename}`} className="wechat-plan-image-card">
                <div>
                  <Tag color={image.slot === 'Cover' ? 'blue' : 'default'}>{image.slot}</Tag>
                  <strong>{image.filename}</strong>
                </div>
                <p>{image.purpose}</p>
                <span>{image.direction}</span>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="wechat-official-account-panel">
        <div className="wechat-official-account-panel-header">
          <strong>发布检查</strong>
          <Button size="small" type="text">Checklist</Button>
        </div>
        <div className="wechat-plan-checklist">
          {wechatPublishingChecklist.map(item => (
            <label key={item}>
              <input type="checkbox" readOnly />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </section>
    </LifePageShell>
  );
};

export default WechatOfficialAccountPlanPage;
