import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Force clear any leftover Google Translate cookies & enforce Arabic RTL
try {
  const host = window.location.hostname;
  const pastDate = 'Thu, 01 Jan 1970 00:00:00 UTC';
  document.cookie = `googtrans=; expires=${pastDate}; path=/;`;
  document.cookie = `googtrans=; expires=${pastDate}; path=/; domain=${host};`;
  if (host.includes('.')) {
    const parts = host.split('.');
    if (parts.length >= 2) {
      document.cookie = `googtrans=; expires=${pastDate}; path=/; domain=.${parts.slice(-2).join('.')};`;
    }
  }
} catch (e) {
  // Ignore
}
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
