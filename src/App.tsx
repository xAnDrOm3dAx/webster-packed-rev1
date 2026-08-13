import { Link, Route, Routes, useParams } from 'react-router-dom';
import MedicationForm from './pages/MedicationForm';
import MedicationsList from './pages/MedicationsList';

// /medications/new and /medications/:id render the same component. Keying
// by id forces a remount so edit state from one medication cannot leak
// into another (or into Add).
function MedicationFormRoute() {
  const { id } = useParams<{ id?: string }>();
  return <MedicationForm key={id ?? 'new'} />;
}

function Stub({ title }: { title: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
      <Link to="/medications" className="text-lg text-teal-800 underline">
        Go to medications
      </Link>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Stub title="Webster Pack Helper" />} />
      <Route path="/medications" element={<MedicationsList />} />
      <Route path="/medications/new" element={<MedicationFormRoute />} />
      <Route path="/medications/:id" element={<MedicationFormRoute />} />
      <Route path="/pack" element={<Stub title="Packing session" />} />
      <Route path="/pack/check" element={<Stub title="Check pack" />} />
      <Route path="/print" element={<Stub title="Print list" />} />
      <Route path="/settings" element={<Stub title="Settings" />} />
    </Routes>
  );
}

export default App;
