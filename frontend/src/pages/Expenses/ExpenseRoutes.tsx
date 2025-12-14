import { Routes, Route, Navigate } from 'react-router-dom';
import ExpensesPage from './ExpensesPage';
import AddExpensesPage from './AddExpensesPage';
import AddPeriodicalExpensesPage from './AddPeriodicalExpensesPage';
import CompareExpensesPage from './CompareExpensesPage';
import EditExpensesPage from './EditExpensesPage';
import GroupExpensesPage from './GroupExpensesPage';
import DeleteExpensesPage from './DeleteExpensesPage';

function ExpensesRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ExpensesPage />} />
      <Route path="addexpenses" element={<AddExpensesPage />} />
      <Route path="addperiodicalexpenses" element={<AddPeriodicalExpensesPage />} />
      <Route path="compareexpenses" element={<CompareExpensesPage />} />
      <Route path="editexpenses" element={<EditExpensesPage />} />
      <Route path="groupexpenses" element={<GroupExpensesPage />} />
      <Route path="deleteexpenses" element={<DeleteExpensesPage />} />
      
      {/* Catch-all: redirect invalid routes */}
      <Route path="*" element={<Navigate to="/expenses" replace />} />
    </Routes>
  );
}

export default ExpensesRoutes;