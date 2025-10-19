import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { configureDataSource } from './data/repository';
import './styles/global.css';

const dataSource = (import.meta.env.VITE_DATA_SOURCE || 'local').toLowerCase();
configureDataSource(dataSource);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
