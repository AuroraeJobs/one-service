import { useMemo, useState } from 'react';
import { Button, Segmented, Space, Tag } from 'antd';
import { FileTextOutlined, PictureOutlined } from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import {
  wechatPublishingChecklist,
  wechatPublishingPlan,
  type WechatPlannedArticle
} from '../constants/wechatOfficialAccountPlan';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import './WechatOfficialAccountPage.css';

const getStatusColor = (status: WechatPlannedArticle['status']) => {
  if (status === 'Published') return 'green';
  if (status === 'Drafted') return 'blue';
  return 'orange';
};

const WechatOfficialAccountPlanPage = () => {
  const { isEnglish } = useAppPreferences();
  const [selectedDate, setSelectedDate] = useState(wechatPublishingPlan[0]?.date);
  const selectedArticle = useMemo(
    () => wechatPublishingPlan.find(item => item.date === selectedDate) || wechatPublishingPlan[0],
    [selectedDate]
  );
  const text = {
    title: isEnglish ? 'Publishing Plan' : '发布规划',
    articleUnit: isEnglish ? 'articles' : '篇',
    calendar: isEnglish ? 'Publishing Calendar' : '发布日历',
    todayFocus: isEnglish ? "Today's Focus" : '今日关注',
    deepRead: isEnglish ? 'Deep Reads' : '深读',
    observation: isEnglish ? 'OneAI Observation' : 'OneAI 观察',
    imagePlan: isEnglish ? 'Image Plan' : '配图计划',
    imageUnit: isEnglish ? 'images' : '张',
    releaseCheck: isEnglish ? 'Release Check' : '发布检查',
    status: (status: WechatPlannedArticle['status']) => {
      if (status === 'Published') return isEnglish ? 'Published' : '已发布';
      if (status === 'Drafted') return isEnglish ? 'Drafted' : '已成稿';
      return isEnglish ? 'Planned' : '计划中';
    }
  };

  return (
    <LifePageShell
      eyebrow="OneAI Daily"
      title={text.title}
      actions={(
        <Space wrap>
          <Tag color="blue">2026-07</Tag>
          <Tag>{wechatPublishingPlan.length} {text.articleUnit}</Tag>
        </Space>
      )}
    >
      <section className="wechat-official-account-panel">
        <div className="wechat-official-account-panel-header">
          <strong>{text.calendar}</strong>
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
              <Tag color={getStatusColor(item.status)}>{text.status(item.status)}</Tag>
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
            <Tag color={getStatusColor(selectedArticle.status)}>{text.status(selectedArticle.status)}</Tag>
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
            <h3>{text.todayFocus}</h3>
            <ul>
              {selectedArticle.focus.map(item => <li key={item}>{item}</li>)}
            </ul>
            <h3>{text.deepRead}</h3>
            <div className="wechat-plan-section-list">
              {selectedArticle.sections.map(section => (
                <article key={section.title}>
                  <strong>{section.title}</strong>
                  <p>{section.summary}</p>
                </article>
              ))}
            </div>
            <h3>{text.observation}</h3>
            <p>{selectedArticle.observation}</p>
          </div>
        </section>

        <section className="wechat-official-account-panel">
          <div className="wechat-official-account-panel-header">
            <Space>
              <PictureOutlined />
              <strong>{text.imagePlan}</strong>
            </Space>
            <Tag>{selectedArticle.images.length} {text.imageUnit}</Tag>
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
          <strong>{text.releaseCheck}</strong>
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
