import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { applyTheme, getThemePreference } from './services/theme';
import './styles/index.css';

applyTheme(getThemePreference());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
