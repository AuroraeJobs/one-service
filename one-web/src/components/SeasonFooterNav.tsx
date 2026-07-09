import { CloudFilled } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getLifeItemLabel,
  getLifeActiveSubNavPath,
  getLifeSubNavAriaLabel,
  getLifeSubNavItems,
  type LifeSubNavItem
} from '../constants/lifeDataModules';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

const SeasonFooterNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, isEnglish } = useAppPreferences();
  const fullPath = `${location.pathname}${location.search}`;
  const items = getLifeSubNavItems(fullPath);
  const activePath = getLifeActiveSubNavPath(fullPath);

  if (items.length === 0) return null;

  const renderNavItem = (item: LifeSubNavItem) => {
    const childItems: LifeSubNavItem[] = item.children || [];
    const isParentActive = childItems.some(child => activePath === child.path);
    const isActive = activePath === item.path || isParentActive;
    const dropdownItems: MenuProps['items'] = childItems.map(child => ({
      key: child.id,
      label: (
        <span className={`season-footer-dropdown-item ${activePath === child.path ? 'season-footer-dropdown-item-active' : ''}`}>
          <span className="season-footer-icon" style={{ color: child.accent }}>
            {child.icon}
          </span>
          {getLifeItemLabel(child, language)}
        </span>
      ),
      onClick: () => navigate(child.path)
    }));

    const menuButton = (
      <button
        type="button"
        className={`footer-menu-item season-footer-item ${isActive ? 'season-footer-item-active' : ''}`}
        aria-label={isEnglish ? `Open ${getLifeItemLabel(item, language)}` : `打开${getLifeItemLabel(item, language)}`}
        onClick={() => navigate(item.path)}
      >
        <span className="season-footer-icon" style={{ color: item.accent }}>
          {item.icon}
        </span>
        {getLifeItemLabel(item, language)}
      </button>
    );

    return childItems.length > 0 ? (
      <Dropdown key={item.id} menu={{ items: dropdownItems }} trigger={['hover']} placement="top">
        {menuButton}
      </Dropdown>
    ) : (
      <button
        key={item.id}
        type="button"
        className={`footer-menu-item season-footer-item ${isActive ? 'season-footer-item-active' : ''}`}
        aria-label={isEnglish ? `Open ${getLifeItemLabel(item, language)}` : `打开${getLifeItemLabel(item, language)}`}
        onClick={() => navigate(item.path)}
      >
        <span className="season-footer-icon" style={{ color: item.accent }}>
          {item.icon}
        </span>
        {getLifeItemLabel(item, language)}
      </button>
    );
  };

  return (
    <footer className="app-footer season-footer-nav">
      <div className="season-footer-inner">
        <CloudFilled
          className="season-footer-home"
          aria-label={isEnglish ? 'Back to home' : '返回首页'}
          onClick={() => navigate('/')}
        />
        <nav className="season-footer-items" aria-label={getLifeSubNavAriaLabel(fullPath, language)}>
          {items.map(item => renderNavItem(item))}
        </nav>
      </div>
    </footer>
  );
};

export default SeasonFooterNav;
