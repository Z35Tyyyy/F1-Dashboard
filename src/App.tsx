import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

// Route components are code-split so the initial bundle stays small.
const Home = lazy(() => import('./components/Home'));
const Schedule = lazy(() => import('./components/Schedule'));
const RaceHub = lazy(() => import('./components/RaceHub'));
const Standings = lazy(() => import('./components/Standings'));
const Drivers = lazy(() => import('./components/Drivers'));
const LiveHub = lazy(() => import('./components/LiveHub'));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen text-zinc-300">
          <Navbar />
          <main className="mx-auto max-w-6xl overflow-x-hidden px-4 py-8 sm:py-10">
            <ErrorBoundary>
              <Suspense
                fallback={<div className="py-24 text-center text-sm text-zinc-500">Loading…</div>}
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/results" element={<RaceHub />} />
                  <Route path="/standings" element={<Standings />} />
                  <Route path="/drivers" element={<Drivers />} />
                  <Route path="/live" element={<LiveHub />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
