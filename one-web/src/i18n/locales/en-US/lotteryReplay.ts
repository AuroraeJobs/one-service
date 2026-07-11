import type { MessageTemplate } from '../../types';

export const lotteryReplayMessages: Record<string, MessageTemplate> = {
  '预测第 {{period}} 期': 'Prediction for Issue {{period}}',
  '基于前 {{count}} 期数据': 'Based on the Previous {{count}} Issues',
  '结构 {{hits}}/4': 'Structure {{hits}}/4',
  '最近 {{count}} 期': 'Last {{count}} Issues',
  '{{prizeName}} {{count}} 期': '{{prizeName}} {{count}} issues',
  '{{strategy}} 在当前回放窗口内平均表现最好，可提高该策略权重。': '{{strategy}} performed best in the current replay window. Consider increasing its weight.',
  '{{title}}<br/>{{name}} {{number}}: {{count}} 次': '{{title}}<br/>{{name}} {{number}}: {{count}} times',
  '选择第 {{period}} 期：仅使用前 {{historyCount}} 期数据生成预测，再对照第 {{period}} 期开奖。': 'Issue {{period}}: generate a prediction using only the previous {{historyCount}} issues, then compare it with the Issue {{period}} draw.',
  '逐期回到开奖前，只用当时已有数据生成预测，再与真实开奖评分。': 'Replay each issue using only the data available before its draw, then score it against the actual result.',
  '回放期数': 'Replay Issues',
  '请选择目标期号。': 'Select a target issue.',
  '请选择第 2 期或之后的目标期，系统会用目标期之前的数据回放预测': 'Select Issue 2 or later. The system will replay the prediction using only data from before the target issue.',
  '历史期数不足，至少需要 20 期后才能回放评分': 'At least 20 historical issues are required for replay scoring.',
  '综合推荐': 'Composite Recommendation',
  '回补优先': 'Recovery First',
  '稳态结构': 'Stable Structure',
  '历史期数不足，至少需要 20 期后再做回放评分。': 'At least 20 historical issues are required before replay scoring.',
  '红球平均命中偏低，应降低单一热号权重，增加结构和遗漏约束。': 'Average red ball hits are low. Reduce the weight of individual hot numbers and add structure and omission constraints.',
  '蓝球命中率偏低，蓝球规则应减少遗漏比依赖，加入近期频次对照。': 'The blue ball hit rate is low. Reduce reliance on omission ratios and compare recent frequency.',
  '当前规则在回放窗口内有稳定命中，可继续扩大回放期数验证。': 'The current rule is stable within the replay window. Expand the replay range for further validation.',
};
