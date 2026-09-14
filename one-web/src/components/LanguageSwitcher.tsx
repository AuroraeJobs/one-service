import { useI18n } from '../contexts/I18nContext';

interface LanguageSwitcherProps {
  className?: string;
  hideIcon?: boolean;
  hideArrow?: boolean;
}

const LanguageSwitcher = ({ className, hideIcon = false, hideArrow = false }: LanguageSwitcherProps) => {
  const { locale, setLanguage, supportedLocales, t } = useI18n();

  if (hideIcon && hideArrow) {
    return (
      <div className={className} style={{ minWidth: 120 }}>
        {supportedLocales.map(option => (
          <div
            key={option.code}
            onClick={() => setLanguage(option.code)}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: '6px',
              backgroundColor: locale.code === option.code ? '#1890ff' : 'transparent',
              color: locale.code === option.code ? '#fff' : '#333',
              transition: 'all 0.2s',
              marginBottom: '4px'
            }}
            onMouseEnter={(e) => {
              if (locale.code !== option.code) {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
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
            color: locale.code === option.code ? '#fff' : '#333',
            transition: 'all 0.2s',
            marginBottom: '4px'
          }}
          onMouseEnter={(e) => {
            if (locale.code !== option.code) {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
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
