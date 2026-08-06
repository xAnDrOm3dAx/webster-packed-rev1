import { Route, Routes } from 'react-router-dom';

function Stub({ title }: { title: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Stub title="Webster Pack Helper" />} />
      <Route path="/medications" element={<Stub title="Medications" />} />
      <Route path="/medications/:id" element={<Stub title="Medication form" />} />
      <Route path="/pack" element={<Stub title="Packing session" />} />
      <Route path="/pack/check" element={<Stub title="Check pack" />} />
      <Route path="/print" element={<Stub title="Print list" />} />
      <Route path="/settings" element={<Stub title="Settings" />} />
    </Routes>
  );
}

export default App;
