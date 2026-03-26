import { I18nextProvider } from 'react-i18next';

import i18n from '../i18n/i18n';
import Dashboard from './Dashboard';

export function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <Dashboard />
    </I18nextProvider>
  );
}
