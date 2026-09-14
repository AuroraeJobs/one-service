import { GlobalOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import { useI18n } from '../contexts/I18nContext';

interface LanguageSwitcherProps {
  className?: string;
  hideIcon?: boolean;
  hideArrow?: boolean;
}

const LanguageSwitcher = ({ className, hideIcon = false, hideArrow = false }: LanguageSwitcherProps) => {
  const { locale, setLanguage, supportedLocales, t } = useI18n();

  return (
    <div className={className}>
      {!hideIcon && <GlobalOutlined aria-hidden="true" />}
      <Select
        aria-label={t('语言')}
        value={locale.code}
        variant="borderless"
        popupMatchSelectWidth={false}
        suffixIcon={hideArrow ? null : undefined}
        options={supportedLocales.map(option => ({
          value: option.code,
          label: option.nativeName,
        }))}
        onChange={setLanguage}
      />
    </div>
  );
};

export default LanguageSwitcher;
