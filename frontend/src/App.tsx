import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { F7Intro } from './screens/formula7/F7Intro';
import { F7Ranking } from './screens/formula7/F7Ranking';
import { F7FormulaBuild } from './screens/formula7/F7FormulaBuild';
import { F7MoleculeBuild } from './screens/formula7/F7MoleculeBuild';
import { F7Results } from './screens/formula7/F7Results';
import { F5Intro } from './screens/formula5/F5Intro';
import { F5Ranking } from './screens/formula5/F5Ranking';
import { F5FormulaBuild } from './screens/formula5/F5FormulaBuild';
import { F5MoleculeBuild } from './screens/formula5/F5MoleculeBuild';
import { F5Results } from './screens/formula5/F5Results';

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

        {/* Formula-5 */}
        <Route path="/f5" element={<Navigate to="/f5/intro" replace />} />
        <Route path="/f5/intro" element={<F5Intro />} />
        <Route path="/f5/ranking" element={<F5Ranking />} />
        <Route path="/f5/formula" element={<F5FormulaBuild />} />
        <Route path="/f5/molecule" element={<F5MoleculeBuild />} />
        <Route path="/f5/results" element={<F5Results />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
