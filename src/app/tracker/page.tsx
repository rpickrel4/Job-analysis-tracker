"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card, Field, Select, TextArea, TextInput } from "@/components/ui";
import { statusColor } from "@/lib/statusColor";

const STATUS_OPTIONS = [
  "Applied",
  "Screening",
  "Interviewing",
  "Offer",
  "Rejected",
  "Withdrawn",
];

type Application = {
  id: number;
  company: string;
  position: string;
  industry: string | null;
  compensation: string | null;
  location: string | null;
  dateApplied: string;
  status: string;
  postingLink: string | null;
  summary: string | null;
  notes: string | null;
  source: string;
};

const EMPTY_FORM = {
  company: "",
  position: "",
  industry: "",
  compensation: "",
  location: "",
  dateApplied: new Date().toISOString().slice(0, 10),
  status: "Applied",
  postingLink: "",
  summary: "",
  notes: "",
};

export default function TrackerPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/applications");
    const data = await res.json();
    setApplications(data.applications);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: number, status: string) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function deleteApplication(id: number) {
    if (!confirm("Delete this application?")) return;
    setApplications((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
  }

  async function submitAdd() {
    if (!form.company.trim() || !form.position.trim()) {
      setError("Company and position are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "manual" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add application");
      setApplications((prev) => [data.application, ...prev]);
      setForm(EMPTY_FORM);
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add application");
    } finally {
      setSaving(false);
    }
  }

  function setField<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Application Tracker</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Everything you&apos;ve applied to, in one place.
          </p>
        </div>
        <Button onClick={() => setShowAddForm((s) => !s)} fullWidth className="sm:w-auto shrink-0">
          {showAddForm ? "Cancel" : "+ Add manually"}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <h2 className="font-medium mb-3">Add application manually</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Company *">
              <TextInput value={form.company} onChange={(e) => setField("company", e.target.value)} />
            </Field>
            <Field label="Position *">
              <TextInput value={form.position} onChange={(e) => setField("position", e.target.value)} />
            </Field>
            <Field label="Industry">
              <TextInput value={form.industry} onChange={(e) => setField("industry", e.target.value)} />
            </Field>
            <Field label="Compensation">
              <TextInput value={form.compensation} onChange={(e) => setField("compensation", e.target.value)} />
            </Field>
            <Field label="Location">
              <TextInput value={form.location} onChange={(e) => setField("location", e.target.value)} />
            </Field>
            <Field label="Date applied">
              <TextInput
                type="date"
                value={form.dateApplied}
                onChange={(e) => setField("dateApplied", e.target.value)}
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setField("status", e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Posting link">
              <TextInput
                value={form.postingLink}
                onChange={(e) => setField("postingLink", e.target.value)}
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Summary">
              <TextArea
                value={form.summary}
                onChange={(e) => setField("summary", e.target.value)}
                placeholder="Short summary of the role, in case the posting link expires…"
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Notes">
              <TextArea value={form.notes} onChange={(e) => setField("notes", e.target.value)} className="min-h-16" />
            </Field>
          </div>
          {error && <p className="text-sm text-clay-700 dark:text-clay-400 mt-2">{error}</p>}
          <Button onClick={submitAdd} disabled={saving} fullWidth className="mt-3 sm:w-auto">
            {saving ? "Saving…" : "Save application"}
          </Button>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No applications tracked yet. Analyze a posting or add one manually.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              expanded={expandedId === app.id}
              onToggleExpand={() => setExpandedId(expandedId === app.id ? null : app.id)}
              onStatusChange={(status) => updateStatus(app.id, status)}
              onDelete={() => deleteApplication(app.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({
  app,
  expanded,
  onToggleExpand,
  onStatusChange,
  onDelete,
}: {
  app: Application;
  expanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium break-words">{app.position}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 break-words">{app.company}</div>
        </div>
        <Select
          value={app.status}
          onChange={(e) => onStatusChange(e.target.value)}
          className={`w-auto shrink-0 py-2 text-sm min-h-9 border-transparent font-medium ${statusColor(app.status)}`}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
        <span>{new Date(app.dateApplied).toLocaleDateString()}</span>
        {app.industry && <span>{app.industry}</span>}
        {app.compensation && <span className="break-words">{app.compensation}</span>}
      </div>

      {expanded && (
        <div className="flex flex-col gap-2 text-sm pt-2 border-t border-sage-200/70 dark:border-sage-900">
          {app.location && (
            <div>
              <span className="font-medium">Location: </span>
              {app.location}
            </div>
          )}
          {app.postingLink && (
            <div className="break-all">
              <span className="font-medium">Posting link: </span>
              <a
                href={app.postingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sage-700 dark:text-sage-400 underline"
              >
                {app.postingLink}
              </a>
            </div>
          )}
          {app.summary && (
            <div className="break-words">
              <span className="font-medium">Summary: </span>
              {app.summary}
            </div>
          )}
          {app.notes && (
            <div className="break-words">
              <span className="font-medium">Notes: </span>
              {app.notes}
            </div>
          )}
          <div className="text-xs text-zinc-400">
            Source: {app.source === "analyzer" ? "Analyzed posting" : "Manual entry"}
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-1">
        <button onClick={onToggleExpand} className="text-sm text-sage-700 dark:text-sage-400 underline min-h-9">
          {expanded ? "Hide details" : "Details"}
        </button>
        <button onClick={onDelete} className="text-sm text-clay-700 dark:text-clay-400 underline min-h-9">
          Delete
        </button>
      </div>
    </Card>
  );
}
