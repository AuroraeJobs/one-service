import { CloudFilled } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLifeItemLabel, getLifeModuleKeyByPath, lifeNavItems } from '../constants/lifeDataModules';
import { useI18n } from '../contexts/I18nContext';
import AppHeaderWithUser from './AppHeaderWithUser';

const AppHeader = () => {
  const { isAuthenticated } = useAuth();
  const { language, t } = useI18n();
  const location = useLocation();
  const currentNav = getLifeModuleKeyByPath(location.pathname);

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-left">
          <Link to="/" className="app-header-brand" aria-label={t('返回首页')}>
            <CloudFilled />
          </Link>

          <nav className="app-header-nav" aria-label={t('主导航')}>
            {lifeNavItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${currentNav === item.key ? 'nav-link-active' : ''}`}
              >
                {item.icon}
                {getLifeItemLabel(item, language)}
              </Link>
            ))}
          </nav>
        </div>

        {isAuthenticated && (
          <AppHeaderWithUser />
        )}
      </div>
    </header>
  );
};

export default AppHeader;
