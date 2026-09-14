import { useI18n } from '../contexts/I18nContext';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

interface LanguageSwitcherProps {
  className?: string;
  hideIcon?: boolean;
  hideArrow?: boolean;
}

const LanguageSwitcher = ({ className, hideIcon = false, hideArrow = false }: LanguageSwitcherProps) => {
  const { locale, setLanguage, supportedLocales, t } = useI18n();
  const { colorMode } = useAppPreferences();
  
  const isDark = colorMode === 'dark';
  const textColor = isDark ? 'rgba(255, 255, 255, 0.87)' : '#333';
  const hoverBg = isDark ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5';

  if (hideIcon && hideArrow) {
    return (
      <div className={className} style={{ width: 'fit-content' }}>
        {supportedLocales.map(option => (
          <div
            key={option.code}
            onClick={() => setLanguage(option.code)}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: '6px',
              backgroundColor: locale.code === option.code ? '#1890ff' : 'transparent',
              color: locale.code === option.code ? '#fff' : textColor,
              transition: 'all 0.2s',
              marginBottom: '4px',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (locale.code !== option.code) {
                e.currentTarget.style.backgroundColor = hoverBg;
              }
            }}
            onMouseLeave={(e) => {
              if (locale.code !== option.code) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {option.nativeName}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {supportedLocales.map(option => (
        <div
          key={option.code}
          onClick={() => setLanguage(option.code)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            borderRadius: '6px',
            backgroundColor: locale.code === option.code ? '#1890ff' : 'transparent',
            color: locale.code === option.code ? '#fff' : textColor,
            transition: 'all 0.2s',
            marginBottom: '4px'
          }}
          onMouseEnter={(e) => {
            if (locale.code !== option.code) {
              e.currentTarget.style.backgroundColor = hoverBg;
            }
          }}
          onMouseLeave={(e) => {
            if (locale.code !== option.code) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {option.nativeName}
        </div>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
