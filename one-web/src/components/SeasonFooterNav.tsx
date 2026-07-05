import { CloudFilled } from '@ant-design/icons';
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
  const activeGroup = items.find(item => {
    const childItems = item.children || [];
    return activePath === item.path || childItems.some(child => activePath === child.path);
  });
  const activeGroupChildren = activeGroup?.children || [];
  const visibleGroupChildren = activeGroupChildren.filter(child => !child.secondary || activePath === child.path);

  if (items.length === 0) return null;

  return (
    <footer className="app-footer season-footer-nav">
      <div className="season-footer-inner">
        <CloudFilled
          className="season-footer-home"
          onClick={() => navigate('/')}
        />
        <nav className="season-footer-items" aria-label={getLifeSubNavAriaLabel(fullPath)}>
          {items.map(item => {
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
          })}
        </nav>
      </div>
      {activeGroup && visibleGroupChildren.length ? (
        <div className="season-footer-context" aria-label={`${activeGroup.label}子导航`}>
          <span className="season-footer-context-label">
            <span className="season-footer-icon" style={{ color: activeGroup.accent }}>
              {activeGroup.icon}
            </span>
            {activeGroup.label}
          </span>
          <div className="season-footer-context-items">
            {visibleGroupChildren.map(child => {
              const isActive = activePath === child.path;
              return (
                <button
                  key={child.id}
                  type="button"
                  className={`season-footer-context-item ${isActive ? 'season-footer-context-item-active' : ''}`}
                  onClick={() => navigate(child.path)}
                >
                  <span className="season-footer-icon" style={{ color: child.accent }}>
                    {child.icon}
                  </span>
                  {child.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </footer>
  );
};

export default SeasonFooterNav;
