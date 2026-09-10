import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WatchSpaceProvider } from './context/WatchSpaceContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/common/Toast';
import { Header } from './components/layout/Header';
import { MobileNavigation } from './components/layout/MobileNavigation';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { SeriesDetailsPage } from './pages/SeriesDetailsPage';
import { WatchPlayerPage } from './pages/WatchPlayerPage';
import { WatchSpaceListPage } from './pages/spaces/WatchSpaceListPage';
import { WatchSpaceDashboardPage } from './pages/spaces/WatchSpaceDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WatchSpaceProvider>
          <ToastProvider>
            <div className="min-h-screen flex flex-col bg-[#0a0e17] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
              <Header />

              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24 md:pb-8">
                <Routes>
                  <Route path="/login" element={<LoginPage />} />

                  <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                  <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
                  <Route path="/movie/:id" element={<ProtectedRoute><MovieDetailsPage /></ProtectedRoute>} />
                  <Route path="/tv/:id" element={<ProtectedRoute><SeriesDetailsPage /></ProtectedRoute>} />
                  <Route path="/watch/movie/:id" element={<ProtectedRoute><WatchPlayerPage mediaType="movie" /></ProtectedRoute>} />
                  <Route
                    path="/watch/tv/:id/:season/:episode"
                    element={<ProtectedRoute><WatchPlayerPage mediaType="tv" /></ProtectedRoute>}
                  />
                  <Route path="/spaces" element={<ProtectedRoute><WatchSpaceListPage /></ProtectedRoute>} />
                  <Route path="/spaces/:id" element={<ProtectedRoute><WatchSpaceDashboardPage /></ProtectedRoute>} />

                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>

              <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-slate-400">
                  <p>
                    VidSetu • Powered by <span className="text-indigo-400 font-semibold">Abhishek Kashyap</span>
                  </p>
                  <div className="flex items-center gap-3 text-slate-400">
                    <Link to="/privacy-policy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link>
                    <span>•</span>
                    <Link to="/terms" className="hover:text-indigo-400 transition-colors">Terms of Service</Link>
                  </div>
                </div>
              </footer>

              <MobileNavigation />
              <ToastContainer />
            </div>
          </ToastProvider>
        </WatchSpaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
