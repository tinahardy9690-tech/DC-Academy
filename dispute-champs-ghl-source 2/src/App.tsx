import { useEffect, useState } from "react";
import {
  FileClock,
  FilePenLine,
  Files,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import academyLogo from "./assets/dispute-champs-academy-logo.png";
import { Generator } from "./components/Generator";
import { SavedLetters } from "./components/SavedLetters";
import { TemplateManager } from "./components/TemplateManager";
import {
  getContactFromGhl,
  listenForGhlContact,
  storageService,
} from "./services";
import type {
  ClientProfile,
  LetterTemplate,
  SavedLetter,
  ViewName,
} from "./types";
import { demoClient } from "./data";

function App() {
  const [view, setView] = useState<ViewName>("generator");
  const [menuOpen, setMenuOpen] = useState(false);
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [letters, setLetters] = useState<SavedLetter[]>([]);
  const [client, setClient] = useState<ClientProfile>(demoClient);

  useEffect(() => {
    setTemplates(storageService.getTemplates());
    setLetters(storageService.getLetters());
    setClient(getContactFromGhl());
    return listenForGhlContact(setClient);
  }, []);

  function updateTemplates(nextTemplates: LetterTemplate[]) {
    setTemplates(nextTemplates);
    storageService.setTemplates(nextTemplates);
  }

  function saveLetter(letter: SavedLetter) {
    const next = [letter, ...letters];
    setLetters(next);
    storageService.setLetters(next);
  }

  function navigate(nextView: ViewName) {
    setView(nextView);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <img
          className="mobile-logo"
          src={academyLogo}
          alt="Dispute Champs Academy"
        />
        <button className="icon-button" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <img src={academyLogo} alt="Dispute Champs Academy" />
        </div>

        <nav>
          <span className="nav-label">Workspace</span>
          <button className={view === "generator" ? "active" : ""} onClick={() => navigate("generator")}>
            <FilePenLine />
            Letter generator
          </button>
          <button className={view === "saved" ? "active" : ""} onClick={() => navigate("saved")}>
            <FileClock />
            Saved letters
            {letters.length > 0 && <small>{letters.length}</small>}
          </button>
          <span className="nav-label admin-label">Administration</span>
          <button className={view === "templates" ? "active" : ""} onClick={() => navigate("templates")}>
            <Files />
            Templates
          </button>
          <button disabled>
            <LayoutDashboard />
            Reports
            <em>Soon</em>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button disabled>
            <Settings />
            Settings
          </button>
          <button disabled>
            <HelpCircle />
            Help center
          </button>
          <div className="secure-card">
            <ShieldCheck />
            <span>
              <strong>GHL-ready</strong>
              Contact merge enabled
            </span>
          </div>
          <div className="user-card">
            <span className="client-avatar">AM</span>
            <span>
              <strong>Account Admin</strong>
              <small>Administrator</small>
            </span>
          </div>
        </div>
      </aside>

      <div className="main-panel">
        <div className="topbar">
          <span>
            <Files />
            DC Letter Generator
          </span>
          <a
            className="topbar-client topbar-dashboard"
            href="https://disputechamps.org/student-dash"
            target="_top"
            style={{
              padding: "8px 12px",
              color: "#0b6cd1",
              textDecoration: "none",
              borderRadius: "8px",
            }}
          >
            ← Student Dashboard
          </a>
        </div>
        {view === "generator" && (
          <Generator
            templates={templates}
            addresses={storageService.getBureauAddresses()}
            client={client}
            onSave={saveLetter}
          />
        )}
        {view === "templates" && (
          <TemplateManager templates={templates} onChange={updateTemplates} />
        )}
        {view === "saved" && (
          <SavedLetters
            letters={letters}
            onDelete={(id) => {
              const next = letters.filter((letter) => letter.id !== id);
              setLetters(next);
              storageService.setLetters(next);
            }}
            onOpen={() => navigate("generator")}
          />
        )}
      </div>
      {menuOpen && <button className="menu-overlay" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

export default App;
