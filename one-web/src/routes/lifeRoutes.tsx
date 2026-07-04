import type { ReactNode } from 'react';
import Analysis from '../components/Analysis';
import AiChatPage from '../components/AiChatPage';
import HealthAutumnEquinoxPage from '../components/HealthAutumnEquinoxPage';
import HealthChargeStationPage from '../components/HealthChargeStationPage';
import HealthFourthPage from '../components/HealthFourthPage';
import HealthSpringEquinoxPage from '../components/HealthSpringEquinoxPage';
import HealthSummerSolsticePage from '../components/HealthSummerSolsticePage';
import HealthThirdPage from '../components/HealthThirdPage';
import HealthWinterSolsticePage from '../components/HealthWinterSolsticePage';
import HexagramPage from '../components/HexagramPage';
import LifeDataConnectionsPage from '../components/LifeDataConnectionsPage';
import LifeInvestmentPage from '../components/LifeInvestmentPage';
import LifeStockAlertsPage from '../components/LifeStockAlertsPage';
import LifeStockAnalysisPage from '../components/LifeStockAnalysisPage';
import LifeStockKLinesPage from '../components/LifeStockKLinesPage';
import LifeStockPositionsPage from '../components/LifeStockPositionsPage';
import LifeStockProvidersPage from '../components/LifeStockProvidersPage';
import LifeStockSettingsPage from '../components/LifeStockSettingsPage';
import LifeStockDetailPage from '../components/LifeStockDetailPage';
import LifeStockSyncPage from '../components/LifeStockSyncPage';
import LifeStockTradesPage from '../components/LifeStockTradesPage';
import LifeOverviewPage from '../components/LifeOverviewPage';
import LotteryOverviewPage from '../components/LotteryOverviewPage';
import LotteryAstronautPage from '../components/LotteryAstronautPage';
import LotteryAstronautVoyagePage from '../components/LotteryAstronautVoyagePage';
import LotteryLedgerPage from '../components/LotteryLedgerPage';
import LotteryPredictionDetailPage from '../components/LotteryPredictionDetailPage';
import LotteryPredictionHistoryPage from '../components/LotteryPredictionHistoryPage';
import LotteryPredictionPage from '../components/LotteryPredictionPage';
import LotterySettingsPage from '../components/LotterySettingsPage';
import LotterySyncOperationsPage from '../components/LotterySyncOperationsPage';
import LotteryTicketPage from '../components/LotteryTicketPage';
import LotteryPixelCardPage from '../components/LotteryPixelCardPage';
import LotteryPixelStatsPage from '../components/LotteryPixelStatsPage';
import LotteryPixelUniversePage from '../components/LotteryPixelUniversePage';
import PersonalSettingsPage from '../components/PersonalSettingsPage';
import RecordList from '../components/RecordList';
import SpacePage from '../components/SpacePage';
import Statistics from '../components/Statistics';
import TaijiPage from '../components/TaijiPage';
import TeslaFleetManagerPage from '../components/TeslaFleetManagerPage';

export interface ProtectedRouteConfig {
  path: string;
  element: ReactNode;
}

export const createProtectedRoutes = (isTabVisible: boolean): ProtectedRouteConfig[] => [
  { path: '/', element: <LotteryOverviewPage /> },
  { path: '/overview', element: <LifeOverviewPage /> },
  { path: '/settings', element: <PersonalSettingsPage /> },
  { path: '/connections', element: <LifeDataConnectionsPage /> },
  { path: '/ai/chat', element: <AiChatPage /> },
  { path: '/investments', element: <LifeInvestmentPage /> },
  { path: '/investments/watchlist', element: <LifeInvestmentPage /> },
  { path: '/investments/market', element: <LifeInvestmentPage /> },
  { path: '/investments/positions', element: <LifeStockPositionsPage /> },
  { path: '/investments/trades', element: <LifeStockTradesPage /> },
  { path: '/investments/klines', element: <LifeStockKLinesPage /> },
  { path: '/investments/sync', element: <LifeStockSyncPage /> },
  { path: '/investments/alerts', element: <LifeStockAlertsPage /> },
  { path: '/investments/analysis', element: <LifeStockAnalysisPage /> },
  { path: '/investments/providers', element: <LifeStockProvidersPage /> },
  { path: '/investments/settings', element: <LifeStockSettingsPage /> },
  { path: '/investments/stocks/:symbol', element: <LifeStockDetailPage /> },
  { path: '/vehicle', element: <HealthSpringEquinoxPage /> },
  { path: '/vehicle/tesla', element: <TeslaFleetManagerPage /> },
  { path: '/vehicle/charging', element: <HealthSpringEquinoxPage /> },
  { path: '/vehicle/charging-stations', element: <HealthChargeStationPage /> },
  { path: '/finance', element: <HealthSummerSolsticePage /> },
  { path: '/finance/salary', element: <HealthSummerSolsticePage /> },
  { path: '/lottery', element: <LotteryOverviewPage /> },
  { path: '/lottery/overview', element: <LotteryOverviewPage /> },
  { path: '/lottery/prediction', element: <LotteryPredictionPage /> },
  { path: '/lottery/predictions/history', element: <LotteryPredictionHistoryPage /> },
  { path: '/lottery/predictions/:id', element: <LotteryPredictionDetailPage /> },
  { path: '/lottery/tickets', element: <LotteryTicketPage /> },
  { path: '/lottery/ledger', element: <LotteryLedgerPage /> },
  { path: '/lottery/sync', element: <LotterySyncOperationsPage /> },
  { path: '/lottery/settings', element: <LotterySettingsPage /> },
  { path: '/lottery/astronauts', element: <LotteryAstronautPage /> },
  { path: '/lottery/astronauts/:camp/:number', element: <LotteryAstronautVoyagePage /> },
  { path: '/lottery/records', element: <RecordList /> },
  { path: '/lottery/parasite', element: <HealthThirdPage /> },
  { path: '/lottery/dingfengbo', element: <HealthFourthPage /> },
  { path: '/lottery/autumn-beginning', element: <HealthAutumnEquinoxPage /> },
  { path: '/lottery/winter-beginning', element: <HealthWinterSolsticePage /> },
  { path: '/lottery/statistics', element: <Statistics isTabVisible={isTabVisible} /> },
  { path: '/lottery/analysis', element: <Analysis isTabVisible={isTabVisible} /> },
  { path: '/lottery/pixel-universe', element: <LotteryPixelUniversePage /> },
  { path: '/lottery/pixel-card', element: <LotteryPixelCardPage /> },
  { path: '/lottery/pixel-stats', element: <LotteryPixelStatsPage /> },
  { path: '/lottery/taiji', element: <TaijiPage /> },
  { path: '/lottery/space', element: <SpacePage /> },
  { path: '/lottery/hexagram', element: <HexagramPage /> },

  // Legacy routes retained while the product moves to the life-data module map.
  { path: '/statistics', element: <Statistics isTabVisible={isTabVisible} /> },
  { path: '/analysis', element: <Analysis isTabVisible={isTabVisible} /> },
  { path: '/taiji', element: <TaijiPage /> },
  { path: '/record', element: <RecordList /> },
  { path: '/health', element: <LotteryOverviewPage /> },
  { path: '/health/third', element: <HealthThirdPage /> },
  { path: '/health/fourth', element: <HealthFourthPage /> },
  { path: '/fitness', element: <HealthSpringEquinoxPage /> },
  { path: '/fitness/spring-equinox', element: <HealthSpringEquinoxPage /> },
  { path: '/fitness/summer-solstice', element: <HealthSummerSolsticePage /> },
  { path: '/fitness/autumn-equinox', element: <HealthAutumnEquinoxPage /> },
  { path: '/fitness/winter-solstice', element: <HealthWinterSolsticePage /> },
  { path: '/fitness/charge-station', element: <HealthChargeStationPage /> },
  { path: '/hexagram', element: <HexagramPage /> }
];
