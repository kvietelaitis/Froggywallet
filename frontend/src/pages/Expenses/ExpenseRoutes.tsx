import { Routes, Route, Navigate } from 'react-router-dom';
import ExpensesPage from './ExpensesPage';

function ExpensesRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ExpensesPage />} />
      
      {/* Catch-all: redirect invalid routes */}
      <Route path="*" element={<Navigate to="/expenses" replace />} />
    </Routes>
  );
}

export default ExpensesRoutes;