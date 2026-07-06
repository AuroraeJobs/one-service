export interface WechatPlannedArticle {
  date: string;
  status: 'Planned' | 'Drafted' | 'Published';
  title: string;
  digest: string;
  theme: string;
  notes: string;
  articlePath: string;
  imagePlanPath: string;
  focus: string[];
  sections: Array<{
    title: string;
    summary: string;
  }>;
  observation: string;
  images: Array<{
    slot: string;
    filename: string;
    purpose: string;
    direction: string;
    status: string;
  }>;
}

export const wechatPublishingChecklist = [
  'Article title is final.',
  'Digest fits WeChat summary length.',
  'Cover media id or cover upload plan is present.',
  'Each article image is listed in the date image plan.',
  'Internal notes are below ## 发布备注.',
  'Draft was created from /ai/wechat.',
  'Draft was checked in /ai/wechat/drafts.'
];

export const wechatPublishingPlan: WechatPlannedArticle[] = [
  {
    date: '2026-07-07',
    status: 'Planned',
    title: 'AI 政策与产品可靠性',
    digest: '今天关注 AI 政策、可靠性工程与企业落地中的成本控制。',
    theme: 'AI policy and product reliability',
    notes: 'First planned doc-backed issue.',
    articlePath: 'docs/wechat-official-account/articles/2026-07/2026-07-07-oneai-daily.md',
    imagePlanPath: 'docs/wechat-official-account/images/2026-07/2026-07-07.md',
    focus: [
      'AI 政策讨论从模型能力扩展到安全、审计和责任边界。',
      '企业 AI 产品开始把稳定性、可观测性和成本上限放到更前面。',
      '面向用户的 AI 工具正在从演示能力转向可重复交付。'
    ],
    sections: [
      { title: '政策边界正在变成产品需求', summary: '政策要求最终会落到日志、权限、人工复核和数据留痕上。' },
      { title: '可靠性是 AI 产品的第二条增长曲线', summary: '当模型能力趋同，谁能更稳定地把能力放进真实流程，谁就更容易留下来。' },
      { title: '成本控制影响产品形态', summary: '上下文长度、检索策略、缓存和异步任务都会决定一款 AI 产品是否能持续运行。' }
    ],
    observation: '把 AI 功能上线不是结束，而是开始进入工程纪律：观测、回放、失败兜底和成本复盘。',
    images: [
      { slot: 'Cover', filename: '2026-07-07/cover.png', purpose: 'WeChat cover', direction: 'Editorial image showing AI policy documents, product dashboards, and reliability signals.', status: 'Planned' },
      { slot: '01', filename: '2026-07-07/01-policy-boundary.png', purpose: 'Policy section', direction: 'Clean desk scene with policy checklist, audit log, and AI model card.', status: 'Planned' },
      { slot: '02', filename: '2026-07-07/02-reliability-stack.png', purpose: 'Reliability section', direction: 'Product reliability stack with monitoring panels and alert states.', status: 'Planned' },
      { slot: '03', filename: '2026-07-07/03-cost-control.png', purpose: 'Cost section', direction: 'Cost dashboard balancing tokens, latency, cache, and user traffic.', status: 'Planned' }
    ]
  },
  {
    date: '2026-07-08',
    status: 'Planned',
    title: 'AI 招聘与合规落地',
    digest: '今天关注 AI 招聘工具、企业合规流程和人机协作岗位变化。',
    theme: 'AI hiring and compliance',
    notes: 'Focus on business adoption.',
    articlePath: 'docs/wechat-official-account/articles/2026-07/2026-07-08-oneai-daily.md',
    imagePlanPath: 'docs/wechat-official-account/images/2026-07/2026-07-08.md',
    focus: [
      '招聘场景里的 AI 从简历筛选扩展到岗位画像和面试辅助。',
      '合规要求正在推动企业记录 AI 决策链路。',
      '人机协作岗位更强调业务流程理解和工具编排能力。'
    ],
    sections: [
      { title: '招聘 AI 的关键不是替代判断', summary: '更可持续的价值在于提高信息整理、候选人匹配和沟通效率。' },
      { title: '合规流程需要可解释的操作记录', summary: '企业需要知道模型什么时候参与、输出了什么、谁做了最终决定。' },
      { title: '新岗位更像流程设计师', summary: '会使用 AI 只是起点，能设计可运行的业务流程才是壁垒。' }
    ],
    observation: '招聘工具的 AI 化会让“流程透明”和“候选人体验”同时变得更重要。',
    images: [
      { slot: 'Cover', filename: '2026-07-08/cover.png', purpose: 'WeChat cover', direction: 'Hiring workflow with AI assistant, candidate pipeline, and compliance review.', status: 'Planned' },
      { slot: '01', filename: '2026-07-08/01-ai-recruiting.png', purpose: 'Recruiting section', direction: 'Recruiter dashboard comparing role requirements and candidate signals.', status: 'Planned' },
      { slot: '02', filename: '2026-07-08/02-compliance-records.png', purpose: 'Compliance section', direction: 'Decision audit trail with reviewer, timestamp, and model suggestion card.', status: 'Planned' },
      { slot: '03', filename: '2026-07-08/03-human-ai-workflow.png', purpose: 'Workflow section', direction: 'Human and AI collaboration across a business process board.', status: 'Planned' }
    ]
  },
  {
    date: '2026-07-09',
    status: 'Planned',
    title: 'AI 基础设施与芯片周期',
    digest: '今天关注 AI 算力、芯片供给、推理成本和基础设施投资节奏。',
    theme: 'AI infrastructure and chips',
    notes: 'Include market context.',
    articlePath: 'docs/wechat-official-account/articles/2026-07/2026-07-09-oneai-daily.md',
    imagePlanPath: 'docs/wechat-official-account/images/2026-07/2026-07-09.md',
    focus: [
      'AI 基础设施竞争从训练集群延伸到推理效率。',
      '芯片供给影响模型服务成本，也影响应用商业化速度。',
      '数据中心电力和散热成为长期约束。'
    ],
    sections: [
      { title: '推理成本决定应用密度', summary: '高频 AI 应用需要稳定、低延迟、可预测成本的基础设施。' },
      { title: '芯片周期会影响产品节奏', summary: '供应链和价格波动会改变模型服务商和应用公司的扩张策略。' },
      { title: '电力是另一种算力指标', summary: '数据中心的能源约束会逐渐进入产品和财务模型。' }
    ],
    observation: 'AI 应用的体验背后，是一整套算力、网络、能源和运维能力的组合。',
    images: [
      { slot: 'Cover', filename: '2026-07-09/cover.png', purpose: 'WeChat cover', direction: 'AI infrastructure map connecting chips, data centers, power, and apps.', status: 'Planned' },
      { slot: '01', filename: '2026-07-09/01-inference-infra.png', purpose: 'Inference section', direction: 'Low-latency inference service diagram with queues and cache.', status: 'Planned' },
      { slot: '02', filename: '2026-07-09/02-chip-cycle.png', purpose: 'Chip section', direction: 'Semiconductor supply cycle with AI accelerator cards and market chart.', status: 'Planned' },
      { slot: '03', filename: '2026-07-09/03-datacenter-power.png', purpose: 'Energy section', direction: 'Data center power and cooling constraints shown as an operational dashboard.', status: 'Planned' }
    ]
  },
  {
    date: '2026-07-10',
    status: 'Planned',
    title: 'Agent 与工作流自动化',
    digest: '今天关注 Agent 产品、企业工作流自动化和工具调用的真实边界。',
    theme: 'Agents and workflow automation',
    notes: 'Product-oriented issue.',
    articlePath: 'docs/wechat-official-account/articles/2026-07/2026-07-10-oneai-daily.md',
    imagePlanPath: 'docs/wechat-official-account/images/2026-07/2026-07-10.md',
    focus: [
      'Agent 产品从聊天入口走向任务执行和流程编排。',
      '企业更关心权限、回滚、审计和失败处理。',
      '工具调用能力需要和业务系统的真实约束对齐。'
    ],
    sections: [
      { title: 'Agent 不是万能员工', summary: '更现实的形态是可控、可观察、可暂停的流程节点。' },
      { title: '工作流自动化需要边界感', summary: '自动化越深入，越需要明确哪些动作必须人工确认。' },
      { title: '工具调用考验系统集成', summary: '模型输出只是开始，真正难点在数据质量、权限和异常恢复。' }
    ],
    observation: 'Agent 的价值不在于完全自主，而在于把重复任务变成可复用、可审计的流程。',
    images: [
      { slot: 'Cover', filename: '2026-07-10/cover.png', purpose: 'WeChat cover', direction: 'Agent workflow control room with task graph and approval gates.', status: 'Planned' },
      { slot: '01', filename: '2026-07-10/01-agent-workflow.png', purpose: 'Agent section', direction: 'Task execution graph with tools, memory, and status checkpoints.', status: 'Planned' },
      { slot: '02', filename: '2026-07-10/02-human-approval.png', purpose: 'Approval section', direction: 'Human confirmation step before sensitive action execution.', status: 'Planned' },
      { slot: '03', filename: '2026-07-10/03-tool-integration.png', purpose: 'Integration section', direction: 'APIs, databases, and business systems connected through tool calls.', status: 'Planned' }
    ]
  },
  {
    date: '2026-07-11',
    status: 'Planned',
    title: '本周 AI 观察',
    digest: '本周回顾 AI 政策、基础设施、招聘合规和 Agent 产品化趋势。',
    theme: 'Weekly recap',
    notes: 'Summarize the week.',
    articlePath: 'docs/wechat-official-account/articles/2026-07/2026-07-11-oneai-daily.md',
    imagePlanPath: 'docs/wechat-official-account/images/2026-07/2026-07-11.md',
    focus: [
      'AI 产品进入可靠性和成本控制阶段。',
      '企业落地更强调合规、审计和流程协作。',
      '基础设施约束正在影响应用商业模型。'
    ],
    sections: [
      { title: '政策正在产品化', summary: '安全、审计和责任边界会越来越多地出现在产品需求里。' },
      { title: '基础设施决定应用上限', summary: '算力、能源和推理成本正在成为产品策略的一部分。' },
      { title: 'Agent 进入流程阶段', summary: '从“能回答”到“能做事”，中间需要大量工程约束。' }
    ],
    observation: '本周最重要的变化不是某个模型发布，而是 AI 行业继续从能力竞赛走向系统工程。',
    images: [
      { slot: 'Cover', filename: '2026-07-11/cover.png', purpose: 'WeChat cover', direction: 'Weekly recap collage with policy, infrastructure, recruiting, and Agent themes.', status: 'Planned' },
      { slot: '01', filename: '2026-07-11/01-weekly-policy.png', purpose: 'Policy recap', direction: 'Policy and product requirement board with weekly highlights.', status: 'Planned' },
      { slot: '02', filename: '2026-07-11/02-weekly-infra.png', purpose: 'Infrastructure recap', direction: 'Infrastructure trend dashboard with compute, power, and cost signals.', status: 'Planned' },
      { slot: '03', filename: '2026-07-11/03-weekly-agent.png', purpose: 'Agent recap', direction: 'Agent workflow timeline showing progress from chat to action.', status: 'Planned' }
    ]
  }
];
