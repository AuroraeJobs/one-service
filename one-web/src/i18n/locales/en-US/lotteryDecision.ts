import type { MessageTemplate } from '../../types';

export const lotteryDecisionMessages: Record<string, MessageTemplate> = {
  '第 {{issue}} 期保存后票据数量超过上限 {{limit}}': 'Issue {{issue}} would exceed the ticket limit of {{limit}} after saving.',
  '第 {{issue}} 期预测': 'Prediction for Issue {{issue}}',
  '候选 {{index}}': 'Candidate {{index}}',
  '{{prize}} · 红球 {{redHits}}/6 · {{blueResult}}': '{{prize}} · Red Balls {{redHits}}/6 · {{blueResult}}',
  '已转 {{count}} 注': '{{count}} Tickets Converted',
  '第 {{issue}} 期决策集': 'Issue {{issue}} Decision Set',
  '已保存 {{savedCount}} 注，跳过重复 {{duplicateCount}} 注': 'Saved {{savedCount}} tickets; skipped {{duplicateCount}} duplicates.',
  '第 {{issue}} 期': 'Issue {{issue}}',
  '最佳红球命中 · 蓝球命中 {{count}}': 'Best Red Ball Hits · Blue Ball Hits {{count}}',
  '第 {{issue}} 期 · 命中 {{winningCount}}/{{candidateCount}}': 'Issue {{issue}} · Hits {{winningCount}}/{{candidateCount}}',
  '已选候选': 'Selected Candidates',
};
