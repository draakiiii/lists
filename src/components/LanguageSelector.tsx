import { useLanguage } from '../providers/LanguageProvider';
import { useTranslations } from 'next-intl';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const t = useTranslations('app.language');

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">
        {t('select')}:
      </label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
      >
        <option value="en">{t('en')}</option>
        <option value="es">{t('es')}</option>
      </select>
    </div>
  );
} 