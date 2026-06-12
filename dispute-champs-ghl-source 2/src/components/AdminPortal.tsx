import { useEffect, useState } from "react";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import academyLogo from "../assets/dispute-champs-academy-logo.png";
import { starterTemplates } from "../data";
import {
  adminService,
  localTemplateMigration,
  templateService,
} from "../services";
import type { LetterTemplate } from "../types";
import { TemplateManager } from "./TemplateManager";
import "../admin.css";

export function AdminPortal() {
  const [token, setToken] = useState(() => adminService.getSession());
  const [password, setPassword] = useState("");
  const [templates, setTemplates] =
    useState<LetterTemplate[]>(starterTemplates);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setBusy(true);
    void templateService
      .getTemplates(token)
      .then(async (sharedTemplates) => {
        const migrated = localTemplateMigration.merge(sharedTemplates);
        if (migrated.changed) {
          await templateService.saveTemplates(migrated.templates, token);
          localTemplateMigration.clear();
        }
        if (active) setTemplates(migrated.templates);
      })
      .catch(() => {
        if (active) {
          adminService.logout();
          setToken("");
          setStatus(
            "Your previous session ended. Enter your administrator password to sign in.",
          );
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function login() {
    if (!password.trim()) return;
    setBusy(true);
    setStatus("");
    try {
      const nextToken = await adminService.login(password.trim());
      setToken(nextToken);
      setPassword("");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Administrator login failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function updateTemplates(nextTemplates: LetterTemplate[]) {
    const previous = templates;
    setTemplates(nextTemplates);
    setStatus("Publishing template changes...");
    try {
      await templateService.saveTemplates(nextTemplates, token);
      setStatus("Template changes published to all students.");
    } catch {
      setTemplates(previous);
      setStatus("The changes could not be published. Please try again.");
    }
  }

  if (!token) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-card">
          <img src={academyLogo} alt="Dispute Champs Academy" />
          <span className="admin-lock-icon">
            <KeyRound />
          </span>
          <h1>Template Administration</h1>
          <p>
            Enter the administrator password to manage letters available to
            course students.
          </p>
          <label>
            Administrator password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void login();
              }}
              autoComplete="current-password"
            />
          </label>
          <button
            className="button button-blue"
            onClick={() => void login()}
            disabled={busy || !password.trim()}
          >
            <ShieldCheck />
            {busy ? "Checking..." : "Open Administration"}
          </button>
          {status && <div className="admin-status">{status}</div>}
          <a href="/">Return to Letter Generator</a>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-portal">
      <div className="admin-portal-bar">
        <span>
          <ShieldCheck />
          Protected Administrator Area
        </span>
        <div>
          {busy && <small>Loading...</small>}
          <a href="/">View Student Generator</a>
          <button
            onClick={() => {
              adminService.logout();
              setToken("");
            }}
          >
            <LogOut />
            Log Out
          </button>
        </div>
      </div>
      {status && <div className="admin-publish-status">{status}</div>}
      <TemplateManager
        templates={templates}
        onChange={(nextTemplates) => void updateTemplates(nextTemplates)}
      />
    </div>
  );
}
