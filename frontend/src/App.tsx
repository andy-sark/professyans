import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { F7Intro } from './screens/formula7/F7Intro';
import { F7Ranking } from './screens/formula7/F7Ranking';
import { F7FormulaBuild } from './screens/formula7/F7FormulaBuild';
import { F7MoleculeBuild } from './screens/formula7/F7MoleculeBuild';
import { F7Results } from './screens/formula7/F7Results';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/history" element={<HistoryScreen />} />

        {/* Formula-7 */}
        <Route path="/f7" element={<Navigate to="/f7/intro" replace />} />
        <Route path="/f7/intro" element={<F7Intro />} />
        <Route path="/f7/ranking" element={<F7Ranking />} />
        <Route path="/f7/formula" element={<F7FormulaBuild />} />
        <Route path="/f7/molecule" element={<F7MoleculeBuild />} />
        <Route path="/f7/results" element={<F7Results />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
