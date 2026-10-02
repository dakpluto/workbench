import { Route, Routes, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Sidebar } from "./components/Sidebar";
import { Bench } from "./views/Bench";
import { ShelfView } from "./views/ShelfView";
import { ArtifactPage } from "./views/ArtifactPage";

export function App() {
  const { pathname } = useLocation();
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <ErrorBoundary resetKey={pathname}>
          <Routes>
            <Route path="/" element={<Bench />} />
            <Route path="/shelf/:slug" element={<ShelfView />} />
            <Route path="/a/:id" element={<ArtifactPage />} />
            <Route path="*" element={<Bench />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}
