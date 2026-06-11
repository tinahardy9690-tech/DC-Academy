import { useEffect, useState } from "react";
import { FilePenLine, Files, Menu, ShieldCheck, X } from "lucide-react";
import academyLogo from "./assets/dispute-champs-academy-logo.png";
import { AdminPortal } from "./components/AdminPortal";
import { Generator } from "./components/Generator";
import { bureauAddresses, demoClient, starterTemplates } from "./data";
import {
  getContactFromGhl,
  listenForGhlContact,
  templateService,
} from "./services";
import type { ClientProfile, LetterTemplate } from "./types";

function StudentGenerator() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [templates, setTemplates] =
    useState<LetterTemplate[]>(starterTemplates);
  const [client, setClient] = useState<ClientProfile>(demoClient);

  useEffect(() => {
    let active = true;
    void templateService.getTemplates().then((sharedTemplates) => {
      if (active) setTemplates(sharedTemplates);
    });
    setClient(getContactFromGhl());
    const stopListening = listenForGhlContact(setClient);
    return () => {
      active = false;
      stopListening();
    };
  }, []);

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
          <button className="active" onClick={() => setMenuOpen(false)}>
            <FilePenLine />
            Letter Generator
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="secure-card">
            <ShieldCheck />
            <span>
              <strong>Course Tool</strong>
              Download letters when finished
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
        <Generator
          templates={templates}
          addresses={bureauAddresses}
          client={client}
        />
      </div>
      {menuOpen && (
        <button
          className="menu-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}

function App() {
  const isAdminPage =
    window.location.pathname.replace(/\/+$/, "") === "/admin" ||
    new URLSearchParams(window.location.search).get("admin") === "1";

  return isAdminPage ? <AdminPortal /> : <StudentGenerator />;
}

export default App;
