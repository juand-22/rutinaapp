import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "../shared/components/AppShell";
import { TaskPage } from "../features/tasks";
import { NotesPage } from "../features/notes";
import { ChatPage } from "../features/chat";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<TaskPage />} />
          <Route path="/notas" element={<NotesPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
