import {
  createBrowserRouter,
  RouterProvider as ReactRouterProvider,
  Navigate,
} from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import DashboardView from '../../pages/DashboardView';
import CustomerListView from '../../pages/CustomerListView';
import CustomerRegistrationView from '../../pages/CustomerRegistrationView';
import CustomerEditView from '../../pages/CustomerEditView';
import RetailAccountCreateView from '../../pages/RetailAccountCreateView';
import CorporateAccountCreateView from '../../pages/CorporateAccountCreateView';
import DepositFundsView from '../../pages/DepositFundsView';
import AccountStatusView from '../../pages/AccountStatusView';
import AccountListView from '../../pages/AccountListView';
import LoginView from '../../pages/LoginView';

// Existing transaction report component preserved
import { TransactionReport } from '../../features/auth/reports/TransactionReport';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginView />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardView />,
      },
      // Customer Management
      {
        path: 'customers',
        element: <CustomerListView />,
      },
      {
        path: 'customers/new',
        element: <CustomerRegistrationView />,
      },
      {
        path: 'customers/:customerCode/edit',
        element: <CustomerEditView />,
      },
      // Account Management
      {
        path: 'accounts',
        element: <AccountListView />,
      },
      {
        path: 'accounts/new',
        element: <RetailAccountCreateView />,
      },
      {
        path: 'accounts/corporate/new',
        element: <CorporateAccountCreateView />,
      },
      {
        path: 'accounts/deposit',
        element: <DepositFundsView />,
      },
      {
        path: 'accounts/status',
        element: <AccountStatusView />,
      },
      // Reports
      {
        path: 'reports/transactions',
        element: <TransactionReport />,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export function RouterProvider() {
  return <ReactRouterProvider router={router} />;
}

export default RouterProvider;
