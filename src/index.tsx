import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// CSS is now handled in index.html via Tailwind CDN and style tag to prevent import errors
// import './index.css'; 

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);