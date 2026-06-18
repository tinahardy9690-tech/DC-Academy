import { useEffect, useState } from "react";
import {
  FilePenLine,
  KeyRound,
  LibraryBig,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { AdminPortal } from "./components/AdminPortal";
import { Generator } from "./components/Generator";
import { Library } from "./components/Library";
import { LibraryAdmin } from "./components/LibraryAdmin";
import { bureauAddresses, demoClient, starterTemplates } from "./data";
import {
  getContactFromGhl,
  listenForGhlContact,
  templateService,
} from "./services";
import type { ClientProfile, LetterTemplate } from "./types";

const academyLogo = "https://assets.cdn.filesafe.space/I87sqLmyfcEtoco69zBT/media/6a2cd68c8a3c98ce56594aa1.png";

const generatorSteps = [
  {
    number: "1",
    title: "Letter Category",
    description: "Choose the account or dispute category first.",
  },
  {
    number: "2",
    title: "Letter Template",
    description: "Select a letter available in this category.",
  },
  {
    number: "3",
    title: "Bureau Address",
    description: "Choose the bureau and correct department.",
  },
  {
    number: "4",
    title: "Build Your Letter",
    description: "Client and bureau information will merge automatically.",
  },
];

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
    <div className="app-shell student-generator">
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
          <a className="sidebar-nav-link" href="/library">
            <LibraryBig />
            Download Library
          </a>
        </nav>

        <section className="sidebar-workflow" aria-label="Letter generator steps">
          {generatorSteps.map((step) => (
            <div className="sidebar-workflow-step" key={step.number}>
              <span>{step.number}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="sidebar-bottom">
          <div className="secure-card">
            <ShieldCheck />
            <span>
              <strong>Course Tool</strong>
              Download letters when finished
            </span>
          </div>
          <a
            className="admin-login-link"
            href="https://boisterous-bubblegum-82ed03.netlify.app/admin"
            target="_blank"
            rel="noreferrer"
          >
            <KeyRound />
            Admin Login
          </a>
        </div>
      </aside>

      <div className="main-panel">
        <div className="topbar">
          <a
            className="topbar-client topbar-dashboard"
            href="https://disputechamps.org/student-dashboard"
            target="_top"
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
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const isAdminPage =
    path === "/admin" ||
    new URLSearchParams(window.location.search).get("admin") === "1";

  if (path === "/library/admin") return <LibraryAdmin />;
  if (path === "/library") return <Library />;

  return isAdminPage ? <AdminPortal /> : <StudentGenerator />;
}

export default App;
