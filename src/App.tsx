import { Navigate, Route, Routes } from './lib/router';
import { AppShell } from './ui/AppShell';
import { MapRoute } from './routes/MapRoute';
import { LessonRoute } from './routes/LessonRoute';
import { CompanionRoute } from './routes/CompanionRoute';
import { MachineRoute } from './routes/MachineRoute';
import { ParentRoute } from './routes/ParentRoute';
import { useContainer, useProgress } from './hooks/useContainer';
import { EmptyState } from './ui/EmptyState';
import { Button } from './ui/primitives/Button';
import { useNavigate } from './lib/router';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/map" element={<MapRoute />} />
        <Route path="/lesson" element={<ResumeLesson />} />
        <Route path="/lesson/:lessonId" element={<LessonRoute />} />
        <Route path="/machine" element={<MachineRoute />} />
        <Route path="/companion" element={<CompanionRoute />} />
        <Route path="/parent" element={<ParentRoute />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}

/** The Lesson tab has no lesson of its own — it resumes wherever she is. */
function ResumeLesson() {
  const { curriculum } = useContainer();
  const { status, state } = useProgress();
  const next = curriculum.nextOpen(status, state.track, state.hiddenWorlds);
  return next ? <Navigate to={`/lesson/${next.id}`} replace /> : <Navigate to="/map" replace />;
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <EmptyState title="Nothing at this address" action={<Button onClick={() => navigate('/map')}>Go to the map</Button>}>
      The link may be old, or the lesson may have been renamed.
    </EmptyState>
  );
}
