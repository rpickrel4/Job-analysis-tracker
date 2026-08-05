"use client";

import { Fragment, useEffect, useState, useCallback } from "react";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Application Tracker</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Everything you&apos;ve applied to, in one place.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((s) => !s)}
          className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-sm font-medium"
        >
          {showAddForm ? "Cancel" : "+ Add manually"}
        </button>
      </div>

      {showAddForm && (
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
          <h2 className="font-medium mb-3">Add application manually</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Company *" value={form.company} onChange={(v) => setField("company", v)} />
            <Field label="Position *" value={form.position} onChange={(v) => setField("position", v)} />
            <Field label="Industry" value={form.industry} onChange={(v) => setField("industry", v)} />
            <Field label="Compensation" value={form.compensation} onChange={(v) => setField("compensation", v)} />
            <Field label="Location" value={form.location} onChange={(v) => setField("location", v)} />
            <Field
              label="Date applied"
              type="date"
              value={form.dateApplied}
              onChange={(v) => setField("dateApplied", v)}
            />
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Posting link" value={form.postingLink} onChange={(v) => setField("postingLink", v)} />
          </div>
          <div className="mt-3">
            <label className="text-xs text-zinc-500 block mb-1">Summary</label>
            <textarea
              value={form.summary}
              onChange={(e) => setField("summary", e.target.value)}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 text-sm min-h-[70px]"
              placeholder="Short summary of the role, in case the posting link expires…"
            />
          </div>
          <div className="mt-3">
            <label className="text-xs text-zinc-500 block mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 text-sm min-h-[50px]"
            />
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <button
            onClick={submitAdd}
            disabled={saving}
            className="mt-3 rounded-md bg-emerald-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save application"}
          </button>
        </section>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No applications tracked yet. Analyze a posting or add one manually.
        </p>
      ) : (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Position</th>
                <th className="px-3 py-2">Industry</th>
                <th className="px-3 py-2">Compensation</th>
                <th className="px-3 py-2">Date applied</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {applications.map((app) => (
                <Fragment key={app.id}>
                  <tr className="align-top">
                    <td className="px-3 py-2 font-medium">{app.company}</td>
                    <td className="px-3 py-2">{app.position}</td>
                    <td className="px-3 py-2 text-zinc-500">{app.industry || "—"}</td>
                    <td className="px-3 py-2 text-zinc-500">{app.compensation || "—"}</td>
                    <td className="px-3 py-2 text-zinc-500">
                      {new Date(app.dateApplied).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={app.status}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-1 text-xs"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                        className="text-xs text-zinc-500 hover:underline mr-3"
                      >
                        {expandedId === app.id ? "Hide" : "Details"}
                      </button>
                      <button
                        onClick={() => deleteApplication(app.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {expandedId === app.id && (
                    <tr>
                      <td colSpan={7} className="px-3 py-3 bg-zinc-50 dark:bg-zinc-900 text-sm">
                        <div className="flex flex-col gap-1">
                          {app.location && (
                            <div>
                              <span className="font-medium">Location: </span>
                              {app.location}
                            </div>
                          )}
                          {app.postingLink && (
                            <div>
                              <span className="font-medium">Posting link: </span>
                              <a
                                href={app.postingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline break-all"
                              >
                                {app.postingLink}
                              </a>
                            </div>
                          )}
                          {app.summary && (
                            <div>
                              <span className="font-medium">Summary: </span>
                              {app.summary}
                            </div>
                          )}
                          {app.notes && (
                            <div>
                              <span className="font-medium">Notes: </span>
                              {app.notes}
                            </div>
                          )}
                          <div className="text-xs text-zinc-400 mt-1">
                            Source: {app.source === "analyzer" ? "Analyzed posting" : "Manual entry"}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-500 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 text-sm"
      />
    </div>
  );
}
