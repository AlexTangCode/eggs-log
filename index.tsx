
/**
 * PROJECT: Chloes Chicken
 * ROLE: Senior Frontend Engineer
 * 
 * --- APP ICON GENERATION (Web/Mobile) ---
 * To generate launcher icons for a production build (if wrapping in Capacitor/Cordova):
 * 1. Create a 1024x1024 master icon with the Hen logo on a #F9F5F0 background.
 * 2. For Web: Place 'favicon.ico' and 'apple-touch-icon.png' in the public root.
 * 3. For Mobile: Use 'flutter_launcher_icons' style config if using Flutter, 
 *    or @capacitor/assets for web-native bridges.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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
