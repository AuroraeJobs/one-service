# Lottery Release Evidence

Generated from `npm run lottery:smoke`.

## Summary

| Field | Value |
| --- | --- |
| Target | Lottery unified overview default smoke |
| Generated at | 2026-07-12T05:00:13.391Z |
| Status | PASSED |
| Mode | mocked-fixture |
| Provider network | not-required |
| Routes | 18 |
| Checks | 1134 |
| Failures | 0 |

## Protected Browser QA

| Gate | Evidence |
| --- | --- |
| Authentication | Static smoke is login-aware by checking protected route registration; browser QA still requires a valid local login session. |
| Backend/proxy | Manual browser screenshots require the local backend and Vite proxy to reach project-owned lottery APIs. |
| Diagnostic signature | If `ECONNREFUSED` appears on `/lottery/records/draws?page=0&size=500`, backend/proxy availability is blocking browser evidence. |
| Fallback | Static smoke and build remain baseline verification when login or backend availability blocks screenshots. |

## Source Guards

| Scope | File | Includes | Excludes |
| --- | --- | ---: | ---: |
| lottery unified overview default routes | `src/routes/lifeRoutes.tsx` | 3 | 0 |
| lottery unified overview default navigation | `src/constants/lifeDataModules.tsx` | 9 | 1 |
| lottery overview one-click update | `src/components/LotteryOverviewPage.tsx` | 7 | 5 |
| application localization mount | `src/App.tsx` | 4 | 0 |
| application localization registry | `src/i18n/registry.ts` | 4 | 0 |
| application dynamic language menu | `src/components/AppHeaderWithUser.tsx` | 3 | 1 |
| application localization compatibility runtime | `src/components/AppTextLocalizer.tsx` | 6 | 0 |
| lottery english locale resource | `src/i18n/locales/en-US/lotteryText.ts` | 4 | 3 |
| lottery english chart localization | `src/components/LotteryLocalizedECharts.tsx` | 4 | 0 |
| iteration 47A MiniGPT corpus workflow | `src/components/MiniGptLearningPage.tsx` | 14 | 0 |
| iteration 47A MiniGPT corpus API contract | `src/services/api.ts` | 7 | 0 |
| iteration 47B MiniGPT context and generation provenance workflow | `src/components/MiniGptLearningPage.tsx` | 41 | 0 |
| iteration 47B MiniGPT provenance and batch API contract | `src/services/api.ts` | 32 | 0 |
| iteration 47C MiniGPT outcome chain workflow | `src/components/MiniGptLearningPage.tsx` | 27 | 2 |
| iteration 47C lineage and baseline API contract | `src/services/api.ts` | 16 | 0 |
| iteration 47C overfit warning localization | `src/utils/lotteryBacktestEvidence.ts` | 10 | 0 |
| iteration 48A MiniGPT observation boundary classifier | `src/utils/lotteryBacktestEvidence.ts` | 9 | 1 |
| iteration 48A MiniGPT observation boundary decision UI | `src/components/LotteryPredictionDecisionPage.tsx` | 9 | 1 |
| iteration 48A MiniGPT observation boundary responsive styles | `src/components/LotteryPredictionDecisionPage.css` | 3 | 0 |
| iteration 48B observed-only bounded aggregation | `src/utils/lotteryBacktestEvidence.ts` | 9 | 0 |
| iteration 48B exact reviewed baseline comparability | `src/utils/lotteryBacktestEvidence.ts` | 8 | 0 |
| iteration 48B read-only observation aggregate UI | `src/components/LotteryPredictionDecisionPage.tsx` | 12 | 2 |
| iteration 48B observation aggregate responsive styles | `src/components/LotteryPredictionDecisionPage.css` | 8 | 0 |
| iteration 47C decision deep-link and review workflow | `src/components/LotteryPredictionDecisionPage.tsx` | 8 | 0 |
| iteration 47C historical baseline evidence surfaces | `src/components/LotteryBacktestDetailPage.tsx` | 7 | 0 |
| iteration 47C research baseline evidence | `src/components/LotteryResearchPage.tsx` | 6 | 0 |
| iteration 47C ticket-pack deep-link restore | `src/components/LotteryTicketPackPage.tsx` | 8 | 0 |
| iteration 47C ticket lineage deep-link restore | `src/components/LotteryTicketPage.tsx` | 6 | 0 |
| iteration 47C outcome deep-link preservation | `src/components/LotteryOutcomeAttributionPage.tsx` | 6 | 0 |
| iteration 47C ledger dimension-value deep-link restore | `src/components/LotteryLedgerPage.tsx` | 7 | 0 |
| iteration 47C recommendation target deep-link restore | `src/components/LotteryRecommendationPage.tsx` | 5 | 0 |
| iteration 47D month-end MiniGPT research handoff | `src/components/LotteryMonthEndReviewPage.tsx` | 19 | 0 |
| iteration 47D MiniGPT release evidence handoff | `src/components/LotteryExportMaintenancePage.tsx` | 11 | 0 |
| workbench closure path | `src/components/LotteryWorkbenchPage.tsx` | 49 | 0 |
| mobile dark-mode CSS safeguards | `src/components/LotteryOverviewPage.css` | 7 | 0 |
| visible lottery label helpers | `src/utils/lotteryStatusLabel.ts` | 4 | 0 |
| outcome attribution handoff map | `src/components/LotteryOutcomeAttributionPage.tsx` | 18 | 0 |
| recommendation lifecycle analytics | `src/components/LotteryRecommendationPage.tsx` | 13 | 0 |
| recommendation rollup api contract | `src/services/api.ts` | 4 | 0 |
| recommendation follow-through evidence | `src/components/LotteryGovernancePage.tsx` | 4 | 0 |
| governance anomaly watch | `src/components/LotteryGovernancePage.tsx` | 30 | 0 |
| recommendation month-end follow-through | `src/components/LotteryMonthEndReviewPage.tsx` | 52 | 0 |
| long-term retrospective exports | `src/components/LotteryExportMaintenancePage.tsx` | 35 | 0 |
| recommendation export evidence | `src/components/LotteryExportMaintenancePage.tsx` | 4 | 0 |
| provider reliability trends | `src/components/LotterySyncOperationsPage.tsx` | 10 | 0 |
| sync operations pagination contract | `src/components/LotterySyncOperationsPage.tsx` | 5 | 0 |
| sync operations card presentation | `src/components/LotterySyncOperationsPage.tsx` | 11 | 13 |
| provider reliability compact status | `src/components/LotterySyncOperationsPage.tsx` | 3 | 0 |
| manual sync retry refresh merged | `src/components/LotterySyncOperationsPage.tsx` | 4 | 8 |
| sync operations deletion lifecycle | `src/components/LotterySyncOperationsPage.tsx` | 6 | 0 |
| sync operations async states | `src/components/LotterySyncOperationsPage.tsx` | 7 | 0 |
| sync operations explicit localization | `src/components/LotterySyncOperationsPage.tsx` | 11 | 4 |
| sync operations English dynamic messages | `src/i18n/locales/en-US/lotteryOverview.ts` | 4 | 0 |
| sync operations frontend API boundary | `src/services/api.ts` | 2 | 2 |
| sync record status filter placement | `src/components/LotterySyncOperationsPage.tsx` | 6 | 3 |
| sync record status filter right placement | `src/components/LotterySyncOperationsPage.css` | 2 | 2 |
| sync operations mobile layout | `src/components/LotterySyncOperationsPage.css` | 5 | 0 |

## Checked Routes

| Label | Route | Component | APIs | Empty States | Error States |
| --- | --- | --- | ---: | ---: | ---: |
| 工作台 | `/lottery/workbench` | LotteryWorkbenchPage | 12 | 17 | 4 |
| 同步 | `/lottery/sync` | LotterySyncOperationsPage | 6 | 9 | 4 |
| 号码综合可能性 | `/lottery/prediction` | LotteryPredictionPage | 6 | 13 | 3 |
| 深度规律分析 | `/lottery/deep-analysis` | LotteryDeepAnalysisPage | 0 | 12 | 0 |
| 移动 | `/lottery/mobile` | LotteryMobileCommandPage | 11 | 4 | 5 |
| 策略组合 | `/lottery/strategy-portfolios` | LotteryStrategyPortfolioPage | 3 | 1 | 3 |
| 沙盘 | `/lottery/simulator` | LotterySimulatorPage | 2 | 2 | 1 |
| 月末复盘 | `/lottery/month-end` | LotteryMonthEndReviewPage | 14 | 29 | 1 |
| 预测决策板 | `/lottery/predictions/decision` | LotteryPredictionDecisionPage | 12 | 3 | 3 |
| 票据 | `/lottery/tickets` | LotteryTicketPage | 9 | 4 | 5 |
| 票包 | `/lottery/ticket-packs` | LotteryTicketPackPage | 7 | 3 | 4 |
| 归因 | `/lottery/outcomes` | LotteryOutcomeAttributionPage | 3 | 8 | 1 |
| 推荐 | `/lottery/recommendations` | LotteryRecommendationPage | 4 | 12 | 3 |
| 治理 | `/lottery/governance` | LotteryGovernancePage | 9 | 4 | 1 |
| 研究对比 | `/lottery/research` | LotteryResearchPage | 6 | 6 | 1 |
| 策略笔记 | `/lottery/research/notebook` | LotteryResearchNotebookPage | 4 | 27 | 4 |
| 宇航员航行分析 | `/lottery/astronauts/:camp/:number` | LotteryAstronautVoyagePage | 2 | 6 | 1 |
| 导出审计 | `/lottery/exports` | LotteryExportMaintenancePage | 4 | 53 | 4 |

## Failures

No failures.
