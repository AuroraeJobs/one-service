import type { ReactNode } from 'react';
import AppHeader from './AppHeader';
import ProtectedRoute from './ProtectedRoute';
import SeasonFooterNav from './SeasonFooterNav';

interface ProtectedPageProps {
  children: ReactNode;
}

const ProtectedPage = ({
  children
}: ProtectedPageProps) => (
  <ProtectedRoute>
    <AppHeader />
    {children}
    <SeasonFooterNav />
  </ProtectedRoute>
);

export default ProtectedPage;
