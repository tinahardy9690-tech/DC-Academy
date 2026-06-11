import { Download, FileText, Inbox, Trash2 } from "lucide-react";
import type { SavedLetter } from "../types";

export function SavedLetters({
  letters,
  onDelete,
  onOpen,
}: {
  letters: SavedLetter[];
  onDelete: (id: string) => void;
  onOpen: (letter: SavedLetter) => void;
}) {
  return (
    <main className="content-area">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Letter archive</span>
          <h1>Saved letters</h1>
          <p>Review letters saved on this device.</p>
        </div>
      </div>
      <section className="library-card">
        {letters.length === 0 ? (
          <div className="saved-empty">
            <span>
              <Inbox />
            </span>
            <h2>No saved letters yet</h2>
            <p>Letters you save from the generator will be listed here.</p>
          </div>
        ) : (
          <div className="saved-grid">
            {letters.map((letter) => (
              <article className="saved-card" key={letter.id}>
                <span className="template-file">
                  <FileText />
                </span>
                <div>
                  <span className="category-chip">{letter.bureauName}</span>
                  <h3>{letter.templateName}</h3>
                  <p>
                    Saved{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(letter.createdAt))}
                  </p>
                </div>
                <div className="saved-actions">
                  <button className="button button-outline" onClick={() => onOpen(letter)}>
                    <Download />
                    Open
                  </button>
                  <button className="icon-button danger" onClick={() => onDelete(letter.id)}>
                    <Trash2 />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
