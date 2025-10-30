import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import App from "./App";
import "./index.css";
import authService from './services/authService';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

// Initialize auth (set axios default header if token exists)
try {
  authService.initializeAuth();
} catch (err) {
  // ignore init errors
  console.debug('Auth initialization failed', err);
}


