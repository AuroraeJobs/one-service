import type { ReactNode } from 'react';
import AppHeader from './AppHeader';
import ProtectedRoute from './ProtectedRoute';
import SeasonFooterNav from './SeasonFooterNav';

type ColorMode = 'light' | 'dark';

interface ProtectedPageProps {
  children: ReactNode;
  colorMode: ColorMode;
  onToggleColorMode: () => void;
}

const ProtectedPage = ({
  children,
  colorMode,
  onToggleColorMode
}: ProtectedPageProps) => (
  <ProtectedRoute>
    <AppHeader colorMode={colorMode} onToggleColorMode={onToggleColorMode} />
    {children}
    <SeasonFooterNav />
  </ProtectedRoute>
);

export default ProtectedPage;
