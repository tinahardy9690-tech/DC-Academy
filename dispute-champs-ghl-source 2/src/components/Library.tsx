import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  Download,
  FileCheck2,
  FileText,
  Filter,
  FolderOpen,
  GraduationCap,
  KeyRound,
  Landmark,
  LibraryBig,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
  WalletCards,
  X,
} from "lucide-react";
import academyLogo from "../assets/dispute-champs-academy-logo.png";
import { libraryCategoryDescriptions } from "../libraryData";
import { libraryService } from "../libraryServices";
import {
  libraryCategories,
  libraryResourceTypes,
} from "../libraryTypes";
import type {
  LibraryCategory,
  LibraryResource,
  LibraryResourceType,
} from "../libraryTypes";
import "../library.css";

const categoryIcons: Record<LibraryCategory, LucideIcon> = {
  "Legal Documents": Landmark,
  Collections: BriefcaseBusiness,
  "Charge-Off": FileCheck2,
  Inquiries: UserRoundSearch,
  "Personal Information": FolderOpen,
  Education: GraduationCap,
  "Credit Building": WalletCards,
  Bankruptcy: Building2,
  "Payment History": CheckCircle2,
  "Metro 2": FileText,
  Miscellaneous: BookOpen,
};

function formatFileSize(bytes: number) {
  if (!bytes) return "Online resource";
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1000))} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function getFileLabel(resource: LibraryResource) {
  const extension = resource.fileName.split(".").pop()?.toUpperCase();
  return extension && extension.length <= 5 ? extension : resource.resourceType;
}

function ResourceCard({
  resource,
  featured = false,
}: {
  resource: LibraryResource;
  featured?: boolean;
}) {
  const Icon = categoryIcons[resource.category];
  const downloadUrl = libraryService.getDownloadUrl(resource);
  const isPreview = downloadUrl === "#";

  return (
    <article className={`library-resource-card ${featured ? "featured" : ""}`}>
      <div className={`resource-cover category-${libraryCategories.indexOf(resource.category)}`}>
        {resource.coverImageUrl ? (
          <img src={resource.coverImageUrl} alt="" />
        ) : (
          <>
            <span className="resource-cover-orb" />
            <Icon />
          </>
        )}
        <span className="resource-type-badge">{resource.resourceType}</span>
      </div>
      <div className="resource-card-body">
        <span className="resource-category">{resource.category}</span>
        <h3>{resource.title}</h3>
        <p>{resource.description}</p>
        <div className="resource-meta">
          <span>{getFileLabel(resource)}</span>
          <i />
          <span>{formatFileSize(resource.fileSize)}</span>
        </div>
        <a
          className="resource-download"
          href={downloadUrl}
          target={isPreview ? undefined : "_blank"}
          rel={isPreview ? undefined : "noreferrer"}
          onClick={(event) => {
            if (isPreview) event.preventDefault();
          }}
          aria-disabled={isPreview}
        >
          <Download />
          {isPreview ? "Preview Resource" : "Download Resource"}
        </a>
      </div>
    </article>
  );
}

export function Library() {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<LibraryCategory | "All">("All");
  const [resourceType, setResourceType] =
    useState<LibraryResourceType | "All">("All");
  const [sort, setSort] = useState<"newest" | "title">("newest");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void libraryService
      .getResources()
      .then((items) => {
        if (active) setResources(items);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "The library could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = new Map<LibraryCategory, number>();
    libraryCategories.forEach((item) => counts.set(item, 0));
    resources.forEach((resource) => {
      counts.set(resource.category, (counts.get(resource.category) ?? 0) + 1);
    });
    return counts;
  }, [resources]);

  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return resources
      .filter((resource) => {
        const searchable = [
          resource.title,
          resource.description,
          resource.category,
          resource.resourceType,
          ...resource.tags,
        ]
          .join(" ")
          .toLowerCase();
        return (
          (!normalizedQuery || searchable.includes(normalizedQuery)) &&
          (category === "All" || resource.category === category) &&
          (resourceType === "All" || resource.resourceType === resourceType)
        );
      })
      .sort((a, b) =>
        sort === "title"
          ? a.title.localeCompare(b.title)
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [category, query, resourceType, resources, sort]);

  const featuredResources = resources
    .filter((resource) => resource.isFeatured)
    .slice(0, 3);
  const filtersActive =
    Boolean(query.trim()) || category !== "All" || resourceType !== "All";

  function chooseCategory(nextCategory: LibraryCategory | "All") {
    setCategory(nextCategory);
    setMenuOpen(false);
  }

  return (
    <div className="library-page">
      <header className="library-mobile-header">
        <img src={academyLogo} alt="Dispute Champs Academy" />
        <button onClick={() => setMenuOpen((open) => !open)} aria-label="Menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <aside className={`library-sidebar ${menuOpen ? "open" : ""}`}>
        <a className="library-brand" href="/library">
          <img src={academyLogo} alt="Dispute Champs Academy" />
        </a>
        <div className="library-side-heading">
          <span>Student Resources</span>
          <strong>Download Library</strong>
        </div>
        <nav className="library-category-nav" aria-label="Library categories">
          <button
            className={category === "All" ? "active" : ""}
            onClick={() => chooseCategory("All")}
          >
            <LibraryBig />
            <span>All Resources</span>
            <small>{resources.length}</small>
          </button>
          {libraryCategories.map((item) => {
            const Icon = categoryIcons[item];
            return (
              <button
                key={item}
                className={category === item ? "active" : ""}
                onClick={() => chooseCategory(item)}
              >
                <Icon />
                <span>{item}</span>
                <small>{categoryCounts.get(item)}</small>
              </button>
            );
          })}
        </nav>
        <div className="library-side-bottom">
          <div className="library-help-card">
            <ShieldCheck />
            <span>
              <strong>Academy Resource Center</strong>
              Downloads for enrolled students
            </span>
          </div>
          <a
            className="admin-login-link"
            href="https://boisterous-bubblegum-82ed03.netlify.app/library/admin"
            target="_blank"
            rel="noreferrer"
          >
            <KeyRound />
            Admin Login
          </a>
        </div>
      </aside>

      <main className="library-main">
        <div className="library-topbar">
          <span>
            <LibraryBig />
            Dispute Champs Library
          </span>
          <a href="https://disputechamps.org/student-dash" target="_top">
            ← Student Dashboard
          </a>
        </div>

        <div className="library-content">
          <section className="library-hero">
            <div>
              <span className="library-eyebrow">
                <Sparkles />
                Learn. Apply. Grow.
              </span>
              <h1>Your Credit Education Resource Library</h1>
              <p>
                Explore Academy e-books, templates, checklists, guides, and
                reference materials organized for easy learning.
              </p>
              <div className="library-hero-stats">
                <span>
                  <strong>{resources.length}</strong>
                  Resources
                </span>
                <span>
                  <strong>{libraryCategories.length}</strong>
                  Categories
                </span>
                <span>
                  <strong>24/7</strong>
                  Student Access
                </span>
              </div>
            </div>
            <div className="library-hero-art" aria-hidden="true">
              <span className="hero-art-card card-one">
                <FileText />
              </span>
              <span className="hero-art-card card-two">
                <BookOpen />
              </span>
              <span className="hero-art-card card-three">
                <GraduationCap />
              </span>
              <i className="hero-art-spark spark-one" />
              <i className="hero-art-spark spark-two" />
            </div>
          </section>

          <section className="library-toolbar" aria-label="Search and filters">
            <label className="library-search">
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search e-books, templates, guides, or topics..."
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Clear search">
                  <X />
                </button>
              )}
            </label>
            <label className="library-select">
              <Filter />
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as LibraryCategory | "All")
                }
              >
                <option value="All">All Categories</option>
                {libraryCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown />
            </label>
            <label className="library-select type-select">
              <select
                value={resourceType}
                onChange={(event) =>
                  setResourceType(
                    event.target.value as LibraryResourceType | "All",
                  )
                }
              >
                <option value="All">All File Types</option>
                {libraryResourceTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown />
            </label>
          </section>

          {!filtersActive && featuredResources.length > 0 && (
            <section className="library-section">
              <div className="library-section-heading">
                <div>
                  <span>Featured Learning</span>
                  <h2>Start with these student favorites</h2>
                </div>
              </div>
              <div className="featured-resource-grid">
                {featuredResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    featured
                  />
                ))}
              </div>
            </section>
          )}

          <section className="library-section library-all-section">
            <div className="library-section-heading">
              <div>
                <span>
                  {category === "All" ? "All Downloads" : category}
                </span>
                <h2>
                  {category === "All"
                    ? "Browse the complete library"
                    : libraryCategoryDescriptions[category]}
                </h2>
              </div>
              <div className="library-results-controls">
                <strong>
                  {filteredResources.length}{" "}
                  {filteredResources.length === 1 ? "resource" : "resources"}
                </strong>
                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as "newest" | "title")
                  }
                  aria-label="Sort library"
                >
                  <option value="newest">Newest first</option>
                  <option value="title">A to Z</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="library-state">
                <span className="library-loader" />
                <h3>Opening the library...</h3>
                <p>Your Academy resources are loading.</p>
              </div>
            ) : error ? (
              <div className="library-state error">
                <FileText />
                <h3>We could not open the library</h3>
                <p>{error}</p>
              </div>
            ) : filteredResources.length ? (
              <div className="resource-grid">
                {filteredResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <div className="library-state">
                <Search />
                <h3>
                  {resources.length
                    ? "No resources match your search"
                    : "The resource shelves are ready"}
                </h3>
                <p>
                  {resources.length
                    ? "Try a different word or clear one of your filters."
                    : "New Academy downloads will appear here as they are published."}
                </p>
                {filtersActive && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setCategory("All");
                      setResourceType("All");
                    }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        <footer className="library-footer">
          <span>Dispute Champs Academy © 2026</span>
          <span>Education. Strategy. Confidence.</span>
        </footer>
      </main>

      {menuOpen && (
        <button
          className="library-menu-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />
      )}
    </div>
  );
}
