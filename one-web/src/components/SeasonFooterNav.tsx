import { CloudFilled, MoreOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getLifeActiveSubNavPath,
  getLifeSubNavAriaLabel,
  getLifeSubNavItems,
  type LifeSubNavItem
} from '../constants/lifeDataModules';

const SeasonFooterNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fullPath = `${location.pathname}${location.search}`;
  const items = getLifeSubNavItems(fullPath);
  const activePath = getLifeActiveSubNavPath(fullPath);
  const visibleItems = items.filter(item => {
    const childItems = item.children || [];
    const isActive = activePath === item.path || childItems.some(child => activePath === child.path);
    return !item.secondary || isActive;
  });
  const overflowItems = items.filter(item => item.secondary && !visibleItems.some(visibleItem => visibleItem.id === item.id));

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
          {child.label}
        </span>
      ),
      onClick: () => navigate(child.path)
    }));

    const menuButton = (
      <button
        type="button"
        className={`footer-menu-item season-footer-item ${isActive ? 'season-footer-item-active' : ''}`}
        onClick={() => navigate(item.path)}
      >
        <span className="season-footer-icon" style={{ color: item.accent }}>
          {item.icon}
        </span>
        {item.label}
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
        onClick={() => navigate(item.path)}
      >
        <span className="season-footer-icon" style={{ color: item.accent }}>
          {item.icon}
        </span>
        {item.label}
      </button>
    );
  };

  const overflowMenuItems: MenuProps['items'] = overflowItems.map(item => ({
    key: item.id,
    label: (
      <span className="season-footer-dropdown-item">
        <span className="season-footer-icon" style={{ color: item.accent }}>
          {item.icon}
        </span>
        {item.label}
      </span>
    ),
    onClick: () => navigate(item.path)
  }));

  return (
    <footer className="app-footer season-footer-nav">
      <div className="season-footer-inner">
        <CloudFilled
          className="season-footer-home"
          onClick={() => navigate('/')}
        />
        <nav className="season-footer-items" aria-label={getLifeSubNavAriaLabel(fullPath)}>
          {visibleItems.map(item => renderNavItem(item))}
          {overflowMenuItems.length ? (
            <Dropdown menu={{ items: overflowMenuItems }} trigger={['hover']} placement="top">
              <button
                type="button"
                className="footer-menu-item season-footer-item season-footer-more-item"
              >
                <span className="season-footer-icon">
                  <MoreOutlined />
                </span>
                更多
              </button>
            </Dropdown>
          ) : null}
        </nav>
      </div>
    </footer>
  );
};

export default SeasonFooterNav;
