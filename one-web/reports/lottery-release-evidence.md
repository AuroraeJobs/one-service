# Lottery Release Evidence

Generated from `npm run lottery:smoke`.

## Summary

| Field | Value |
| --- | --- |
| Target | Iteration 23 Week 1 protected frontend QA smoke |
| Generated at | 2026-07-07T11:54:46.992Z |
| Status | PASSED |
| Mode | mocked-fixture |
| Provider network | not-required |
| Routes | 17 |
| Checks | 377 |
| Failures | 0 |

## Protected Browser QA

| Gate | Evidence |
| --- | --- |
| Authentication | Static smoke is login-aware by checking protected route registration; browser QA still requires a valid local login session. |
| Backend/proxy | Manual browser screenshots require the local backend and Vite proxy to reach project-owned lottery APIs. |
| Known blocker | `ECONNREFUSED` on `/lottery/records/draws?page=0&size=500` means backend/proxy availability is blocking browser evidence. |
| Fallback | Static smoke and build remain baseline verification when login or backend availability blocks screenshots. |

## Source Guards

| Scope | File | Includes | Excludes |
| --- | --- | ---: | ---: |
| workbench closure path | `src/components/LotteryWorkbenchPage.tsx` | 5 | 0 |
| mobile dark-mode CSS safeguards | `src/components/LotteryOverviewPage.css` | 7 | 0 |
| visible lottery label helpers | `src/utils/lotteryStatusLabel.ts` | 4 | 0 |

## Checked Routes

| Label | Route | Component | APIs | Empty States | Error States |
| --- | --- | --- | ---: | ---: | ---: |
| 工作台 | `/lottery/workbench` | LotteryWorkbenchPage | 12 | 9 | 4 |
| 号码综合可能性 | `/lottery/prediction` | LotteryPredictionPage | 6 | 13 | 3 |
| 深度规律分析 | `/lottery/deep-analysis` | LotteryDeepAnalysisPage | 0 | 12 | 0 |
| 移动 | `/lottery/mobile` | LotteryMobileCommandPage | 11 | 4 | 5 |
| 策略组合 | `/lottery/strategy-portfolios` | LotteryStrategyPortfolioPage | 3 | 1 | 3 |
| 沙盘 | `/lottery/simulator` | LotterySimulatorPage | 2 | 2 | 1 |
| 月末复盘 | `/lottery/month-end` | LotteryMonthEndReviewPage | 9 | 3 | 1 |
| 预测决策板 | `/lottery/predictions/decision` | LotteryPredictionDecisionPage | 11 | 3 | 3 |
| 票据 | `/lottery/tickets` | LotteryTicketPage | 9 | 4 | 5 |
| 票包 | `/lottery/ticket-packs` | LotteryTicketPackPage | 7 | 3 | 4 |
| 归因 | `/lottery/outcomes` | LotteryOutcomeAttributionPage | 2 | 7 | 1 |
| 推荐 | `/lottery/recommendations` | LotteryRecommendationPage | 3 | 4 | 3 |
| 治理 | `/lottery/governance` | LotteryGovernancePage | 7 | 2 | 1 |
| 研究对比 | `/lottery/research` | LotteryResearchPage | 6 | 6 | 1 |
| 策略笔记 | `/lottery/research/notebook` | LotteryResearchNotebookPage | 4 | 3 | 4 |
| 宇航员航行分析 | `/lottery/astronauts/:camp/:number` | LotteryAstronautVoyagePage | 2 | 6 | 1 |
| 导出审计 | `/lottery/exports` | LotteryExportMaintenancePage | 4 | 21 | 4 |

## Failures

No failures.
