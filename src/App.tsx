import { Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Bench } from "./views/Bench";
import { ShelfView } from "./views/ShelfView";
import { ArtifactPage } from "./views/ArtifactPage";

export function App() {
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Bench />} />
          <Route path="/shelf/:slug" element={<ShelfView />} />
          <Route path="/a/:id" element={<ArtifactPage />} />
          <Route path="*" element={<Bench />} />
        </Routes>
      </main>
    </div>
  );
}
