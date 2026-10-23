import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Note } from "../types";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Copy,
  Check,
  Tag,
  Clock,
  Sparkles,
  BookOpen,
} from "lucide-react";

export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create Note Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newTags, setNewTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadNotes = async () => {
    setLoading(true);
    try {
      let data: Note[] = [];
      if (searchQuery.trim()) {
        data = await api.searchNotes(
          searchQuery.trim(),
          selectedCategory === "all" ? undefined : selectedCategory
        );
      } else {
        data = await api.getNotes(
          selectedCategory === "all" ? undefined : selectedCategory
        );
      }
      setNotes(data);
    } catch (err: any) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadNotes();
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await api.createNote({
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory.trim() || "general",
        tags: newTags.trim(),
      });

      setNotes((prev) => [created, ...prev]);
      setShowAddModal(false);
      setNewTitle("");
      setNewContent("");
      setNewCategory("general");
      setNewTags("");
    } catch (err: any) {
      alert(err?.message || "Failed to create note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete note "${title}"?`)) return;
    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      alert(err?.message || "Failed to delete note");
    }
  };

  const handleCopyNote = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Derive unique categories
  const categories = ["all", ...Array.from(new Set(notes.map((n) => n.category).filter(Boolean)))];

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-astra-purple/10 text-purple-300 border border-astra-purple/30 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-astra-cyan" />
            <span>Persistent Knowledge Repository</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Notes & Knowledge
          </h1>
          <p className="text-sm text-astra-muted">
            Organize thoughts, conversation summaries, and project checklists. Every note is persisted to SQLite and discoverable by ASTRA AI.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-astra-violet to-astra-purple text-white font-semibold text-xs flex items-center gap-2 shadow-glow-violet hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl bg-astra-surface/60 border border-white/10">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-astra-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes by keyword or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-astra-muted focus:outline-none focus:border-astra-violet"
          />
        </form>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                selectedCategory === cat
                  ? "bg-astra-violet text-white"
                  : "bg-white/5 text-astra-muted hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-5 rounded-2xl bg-astra-surface/80 border border-white/10 flex flex-col justify-between hover:border-astra-violet/50 hover:bg-astra-surface transition-all duration-200 group shadow-sm hover:-translate-y-0.5"
          >
            <div>
              {/* Note Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-white group-hover:text-astra-cyan transition-colors leading-snug">
                  {note.title}
                </h3>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-white/5 text-astra-lavender border border-white/5 flex-shrink-0">
                  {note.category}
                </span>
              </div>

              {/* Note Content */}
              <div className="text-xs text-astra-muted leading-relaxed whitespace-pre-wrap line-clamp-6 mb-4 font-normal">
                {note.content}
              </div>

              {/* Tags */}
              {note.tags && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {note.tags.split(",").map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] text-astra-cyan bg-astra-cyan/10 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Note Footer */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-astra-muted">
              <span className="text-[11px] flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {new Date(note.updated_at).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopyNote(note.id, `${note.title}\n\n${note.content}`)}
                  className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                  title="Copy note"
                >
                  {copiedId === note.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={() => handleDeleteNote(note.id, note.title)}
                  className="p-1 rounded hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notes.length === 0 && !loading && (
        <div className="text-center py-16 bg-astra-surface/40 rounded-2xl border border-white/5 space-y-3">
          <FileText className="w-8 h-8 text-astra-muted mx-auto opacity-50" />
          <div className="text-sm font-semibold text-white">No notes found</div>
          <p className="text-xs text-astra-muted max-w-sm mx-auto">
            Save key takeaways from the assistant by saying *"Save note: [Title] - [Content]"* or click New Note above.
          </p>
        </div>
      )}

      {/* Create Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-astra-surface border border-white/15 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-astra-purple" />
                <span>Create New Note</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-astra-muted hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4 text-xs">
              <div>
                <label className="block text-astra-lavender font-semibold mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Model Context Protocol Specifications"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-astra-violet text-sm"
                />
              </div>

              <div>
                <label className="block text-astra-lavender font-semibold mb-1">
                  Content (Markdown supported) *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Enter detailed content, key decisions, or code notes..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-astra-violet text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-astra-lavender font-semibold mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. architecture, meeting, hackathon"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-astra-violet text-xs"
                  />
                </div>

                <div>
                  <label className="block text-astra-lavender font-semibold mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. mcp, api, docs"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-astra-violet text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-astra-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-astra-violet to-astra-purple text-white font-semibold shadow-glow-violet hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Note via MCP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
