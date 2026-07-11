# Adding a language

Locale modules in this directory are discovered automatically at build time.
Adding a language does not require changes to `App.tsx`, the language menu, or
the locale registry.

Create one file such as `locales/ja-JP.ts`:

```ts
import jaJP from 'antd/locale/ja_JP';
import { defineLocale } from '../defineLocale';

export default defineLocale({
  code: 'ja-JP',
  name: 'Japanese',
  nativeName: '日本語',
  antdLocale: jaJP,
  messages: {
    '返回首页': 'ホームに戻る',
    '彩票研究': '宝くじ研究',
    '第 {{period}} 期': '第 {{period}} 回',
    '{{count}} 张票': { one: '{{count}} 枚', other: '{{count}} 枚' },
  },
});
```

Use Chinese source text as the stable message key in components:

```tsx
const { t } = useI18n();

return <h1>{t('第 {{period}} 期', { period })}</h1>;
```

Large dictionaries may live in a resource file imported by the locale module.
`fallbackTranslate` is available for compatibility translators, but new code
should use `t()` directly. `AppTextLocalizer` temporarily covers legacy inline
text while those screens are migrated.
