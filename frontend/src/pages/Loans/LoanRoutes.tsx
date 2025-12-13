import { Routes, Route, Navigate } from 'react-router-dom';
import LoanPage from './LoanPage';
import DebtorPage from './DebtorPage';

function ExpensesRoutes() {
  return (
    <Routes>
        <Route path="/" element={<LoanPage />} />
        <Route path="loan" element={<LoanPage />} />
        <Route path="debtor" element={<DebtorPage />} />
      <Route path="*" element={<Navigate to="/loan" replace />} />
    </Routes>
  );
}

export default ExpensesRoutes;
