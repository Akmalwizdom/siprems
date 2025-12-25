import { RouterProvider } from 'react-router';
import { router } from './utils/routes';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
