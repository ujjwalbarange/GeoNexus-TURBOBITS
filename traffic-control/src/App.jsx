import React from 'react';
import DashboardPage from './pages/DashboardPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import './styles/index.css';

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Traffic Control System Initializing">
      <DashboardPage />
    </ErrorBoundary>
  );
}
