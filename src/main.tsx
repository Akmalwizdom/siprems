
import { createRoot } from 'react-dom/client';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root was not found');
}

const root = createRoot(rootEl);

import('./App.tsx')
  .then(({ default: App }) => {
    root.render(<App />);
  })
  .catch((error) => {
    console.error('Failed to bootstrap app:', error);
    root.render(
      <div className="p-6 font-sans text-slate-900">
        <h1 className="m-0 text-xl">Aplikasi gagal dimuat</h1>
        <p className="mt-2">
          Periksa konfigurasi environment (terutama `VITE_FIREBASE_*`) lalu refresh halaman.
        </p>
      </div>
    );
  });
  
