import { Routes, Route, Navigate } from 'react-router-dom';
import BudgetPage from './BudgetPage';
import BudgetCreationPage from './BudgetCreationPage';
import CategoryPickerPage from './CategoryPickerPage';
import BudgetCategoryCreationPage from './BudgetCategoryCreation';
import BudgetEditPage from './BudgetEditingPage';

function BudgetRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BudgetPage />} />
      <Route path="create-budget" element={<BudgetCreationPage />} />
      <Route path="add-category" element={<CategoryPickerPage />} />
      <Route path="create-category" element={<BudgetCategoryCreationPage />} />
      <Route path="edit-budget/:id" element={<BudgetEditPage />} />

      {/* Catch-all: redirect invalid routes */}
      <Route path="*" element={<Navigate to="/budget" replace />} />
    </Routes>
  );
}

export default BudgetRoutes;