import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { RouterProvider } from './router/RouterProvider';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;