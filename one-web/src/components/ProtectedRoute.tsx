import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLifeModuleKeyByPath } from '../constants/lifeDataModules';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const moduleKey = getLifeModuleKeyByPath(location.pathname) || 'overview';

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className={`app-main life-module-${moduleKey}`} data-life-module={moduleKey}>
      {children}
    </div>
  );
};

export default ProtectedRoute;
