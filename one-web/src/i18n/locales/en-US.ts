import enUS from 'antd/locale/en_US';
import { defineLocale } from '../defineLocale';
import type { MessageTemplate } from '../types';
import { authMessages } from './en-US/auth';
import { lifeOverviewMessages } from './en-US/lifeOverview';
import { lotteryDecisionMessages } from './en-US/lotteryDecision';
import { lotteryExportMessages } from './en-US/lotteryExports';
import { lotteryInsightsMessages } from './en-US/lotteryInsights';
import { lotteryOverviewMessages } from './en-US/lotteryOverview';
import { lotteryReplayMessages } from './en-US/lotteryReplay';
import { translateCompleteEnglishText } from './en-US/lotteryText';
import { lotteryVisualMessages } from './en-US/lotteryVisuals';
import { lotteryWorkbenchMessages } from './en-US/lotteryWorkbench';
import { personalSettingsMessages } from './en-US/personalSettings';

const messages: Record<string, MessageTemplate> = {
  ...authMessages,
  ...lifeOverviewMessages,
  ...lotteryDecisionMessages,
  ...lotteryExportMessages,
  ...lotteryInsightsMessages,
  ...lotteryOverviewMessages,
  ...lotteryReplayMessages,
  ...lotteryVisualMessages,
  ...lotteryWorkbenchMessages,
  ...personalSettingsMessages,
  '返回首页': 'Back to home',
  '主导航': 'Main navigation',
  '用户': 'User',
  '用户设置': 'User Settings',
  '用户管理': 'User Management',
  '日间模式': 'Light Mode',
  '夜间模式': 'Dark Mode',
  '语言': 'Language',
  '退出登录': 'Log Out',
  'OneAI': 'OneAI',
  'OpenAI': 'OpenAI',
  'ChatGPT': 'ChatGPT',
  'MiniGPT': 'MiniGPT',
  'GitHub': 'GitHub',
  '{{name}}头像': '{{name}} avatar',
  '打开{{label}}': 'Open {{label}}',
  '第 {{period}} 期': 'Issue {{period}}',
  '{{odd}}奇{{even}}偶': '{{odd}} Odd / {{even}} Even',
  '第 {{generation}} 代正在回放 {{target}}': 'Generation {{generation}}: replaying {{target}}',
  '正在基于前 {{historyCount}} 期预测第 {{period}} 期': 'Predicting Issue {{period}} using the previous {{historyCount}} issues',
  '第 {{period}} 期：{{redNumbers}} + {{blueNumber}}': 'Issue {{period}}: {{redNumbers}} + {{blueNumber}}',
  '已保存第 {{period}} 期': 'Saved issue {{period}}',
  '红球 {{hits}}/6': 'Red balls {{hits}}/6',
  '评分 {{score}}': 'Score {{score}}',
  '{{count}} 次': { one: '{{count}} voyage', other: '{{count}} voyages' },
  '{{count}} 位宇航员': { one: '{{count}} astronaut', other: '{{count}} astronauts' },
  '保留期号、号码、奇偶、和值和卦象，点击查看完整结构。': 'Shows the issue, numbers, odd/even split, sum, and hexagram. Click a card to view the full structure.',
  '暂无开奖数据': 'No Draw Data',
  '训练完成后会自动刷新本期预测。': 'The current-issue prediction refreshes automatically when training completes.',
  '手动录入最新期开奖，保存到 Redis 后用于给训练后预测打分。': 'Enter the latest draw manually. It is saved to Redis and used to score post-training predictions.',
  '蓝球命中': 'Blue Ball Hit',
  '蓝球未中': 'Blue Ball Miss',
  '保存后会对训练后预测进行评分': 'Post-training predictions will be scored after saving.',
  '宇航员名单加载失败': 'Failed to load the astronaut roster',
  '出行次数统计已更新': 'Voyage statistics updated',
  '出行次数统计失败': 'Failed to update voyage statistics',
  '暂无宇航员名单': 'No astronauts',
  '中奖期数': 'Winning Issues',
};

export default defineLocale({
  code: 'en-US',
  name: 'English',
  nativeName: 'English',
  antdLocale: enUS,
  messages,
  fallbackTranslate: translateCompleteEnglishText,
  order: 10,
});
