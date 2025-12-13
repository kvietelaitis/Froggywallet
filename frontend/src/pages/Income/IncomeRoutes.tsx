import { Routes, Route, Navigate } from 'react-router-dom';
import IncomePage from './IncomePage';
import IncomeEditPage from './IncomeEditPage';
import IncomeCreationPage from './IncomeCreatePage';

function GroupRoutes() {
  return (
    <Routes>
      <Route path="/" element={<IncomePage />} />
        <Route path="create-income" element={<IncomeCreationPage />} />
        <Route path="edit-income/:id" element={<IncomeEditPage />} />

      {/* Catch-all: redirect invalid routes */}
      <Route path="*" element={<Navigate to="/income" replace />} />
    </Routes>
  );
}

export default GroupRoutes;