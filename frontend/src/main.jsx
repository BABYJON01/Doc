import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Stability Polyfills for Production
if (typeof global === 'undefined') {
  window.global = window;
}
if (typeof process === 'undefined') {
  window.process = { env: { NODE_ENV: 'production' } };
}

// Global Error Catch - prevents blank screen by showing the error
window.onerror = function(msg, url, lineNo, columnNo, error) {
  document.getElementById('root').innerHTML = `
    <div style="background: #1e293b; color: #fb7185; padding: 20px; font-family: sans-serif; border: 4px solid #f43f5e; border-radius: 12px; margin: 20px;">
      <h1 style="margin: 0">Platforma ishga tushishida xatolik! ⚠️</h1>
      <p style="color: #94a3b8">${msg}</p>
      <small style="color: #475569">Line: ${lineNo}, Column: ${columnNo}</small>
    </div>
  `;
  return false;
};

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (e) {
  console.error("Mount error:", e);
}

