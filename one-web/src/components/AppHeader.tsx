import { CloudFilled } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLifeModuleKeyByPath, lifeNavItems } from '../constants/lifeDataModules';
import AppHeaderWithUser from './AppHeaderWithUser';

type ColorMode = 'light' | 'dark';

interface AppHeaderProps {
  colorMode: ColorMode;
  onToggleColorMode: () => void;
}

const AppHeader = ({ colorMode, onToggleColorMode }: AppHeaderProps) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const currentNav = getLifeModuleKeyByPath(location.pathname);

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-left">
          <Link to="/" className="app-header-brand" aria-label="返回首页">
            <CloudFilled />
          </Link>

          <nav className="app-header-nav" aria-label="主导航">
            {lifeNavItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${currentNav === item.key ? 'nav-link-active' : ''}`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {isAuthenticated && (
          <AppHeaderWithUser
            colorMode={colorMode}
            onToggleColorMode={onToggleColorMode}
          />
        )}
      </div>
    </header>
  );
};

export default AppHeader;
