import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewReconciliationPage } from './pages/NewReconciliationPage';
import { RunDetailPage } from './pages/RunDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'new',
        element: <NewReconciliationPage />,
      },
      {
        path: 'run/:id',
        element: <RunDetailPage />,
      },
      {
        path: 'categories',
        element: <CategoriesPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
