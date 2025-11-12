import React from 'react';
// Importação antecipada para suprimir apenas o aviso do GoTrueClient do Supabase
import './lib/suppressWarnings';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
