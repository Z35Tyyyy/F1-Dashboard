import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

// Route components are code-split so the initial bundle stays small.
const Dashboard = lazy(() => import('./components/Dashboard'));
const Drivers = lazy(() => import('./components/Drivers'));
const Sessions = lazy(() => import('./components/Sessions'));
const TeamRadio = lazy(() => import('./components/TeamRadio'));
const Weather = lazy(() => import('./components/Weather'));
const Standings = lazy(() => import('./components/Standings'));
const Results = lazy(() => import('./components/Results'));
const Qualifying = lazy(() => import('./components/Qualifying'));
const Strategy = lazy(() => import('./components/Strategy'));
const Schedule = lazy(() => import('./components/Schedule'));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen text-zinc-200">
          <Navbar />
          <main className="mx-auto max-w-6xl overflow-x-hidden px-4 py-8 sm:py-10">
            <ErrorBoundary>
              <Suspense
                fallback={<div className="py-24 text-center text-sm text-zinc-500">Loading…</div>}
              >
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/drivers" element={<Drivers />} />
                  <Route path="/sessions" element={<Sessions />} />
                  <Route path="/team-radio" element={<TeamRadio />} />
                  <Route path="/weather" element={<Weather />} />
                  <Route path="/standings" element={<Standings />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/qualifying" element={<Qualifying />} />
                  <Route path="/strategy" element={<Strategy />} />
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
