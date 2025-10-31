import { BrowserRouter } from 'react-router-dom';
import { useRoutes } from 'react-router-dom';
import routes from './router/config';
import { ToastProvider } from './components/feature/ToastProvider';
import { ConfirmProvider } from './components/feature/ConfirmProvider';
import LGPDNotification from './components/feature/LGPDNotification';
import ScrollToTop from './components/base/ScrollToTop';
import AppErrorBoundary from './components/base/AppErrorBoundary';

function AppRoutes() {
  const element = useRoutes(routes);
  return element;
}

function App() {
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <ConfirmProvider>
        <ToastProvider>
          <ScrollToTop />
          <AppErrorBoundary>
            <AppRoutes />
          </AppErrorBoundary>
          <LGPDNotification />
        </ToastProvider>
      </ConfirmProvider>
    </BrowserRouter>
  );
}

export default App;