"use client";

import { useState } from "react";
import type { JobAnalysisJson } from "@/lib/types";

type AnalyzeResult = {
  jobAnalysis: { id: number };
  analysis: JobAnalysisJson;
};

type ChatMessage = {
  id: number | string;
  role: "user" | "assistant";
  content: string;
};

export default function AnalyzePage() {
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    setResult(null);
    setApplied(false);
    setShowApplyForm(false);
    setChatMessages([]);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || undefined,
          text: pastedText.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsManualText) setShowPasteBox(true);
        throw new Error(data.error || "Analysis failed");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const analysis = result?.analysis;

  const [applyFields, setApplyFields] = useState({
    company: "",
    position: "",
    industry: "",
    compensation: "",
    location: "",
    dateApplied: new Date().toISOString().slice(0, 10),
    status: "Applied",
    summary: "",
  });

  function openApplyForm() {
    if (!analysis) return;
    setApplyFields({
      company: analysis.company.name ?? "",
      position: analysis.position.title ?? "",
      industry: analysis.company.industry ?? "",
      compensation: analysis.position.compensation ?? "",
      location: analysis.position.location ?? "",
      dateApplied: new Date().toISOString().slice(0, 10),
      status: "Applied",
      summary: analysis.summary ?? "",
    });
    setShowApplyForm(true);
  }

  async function submitApplication() {
    if (!result) return;
    setApplying(true);
    setApplyError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...applyFields,
          postingLink: url.trim() || null,
          source: "analyzer",
          jobAnalysisId: result.jobAnalysis.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save application");
      setApplied(true);
      setShowApplyForm(false);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Failed to save application");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Analyze a Posting</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Paste a LinkedIn (or any) job posting link. If we can&apos;t fetch it automatically,
          you can paste the description text instead.
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 flex flex-col gap-3">
        <label className="text-sm font-medium">Posting URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.linkedin.com/jobs/view/..."
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 text-sm"
        />

        {!showPasteBox && (
          <button
            type="button"
            onClick={() => setShowPasteBox(true)}
            className="text-xs text-zinc-500 hover:underline self-start"
          >
            + Paste description text instead / as well
          </button>
        )}

        {showPasteBox && (
          <div>
            <label className="text-sm font-medium block mb-1">Job description text</label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste the full job posting text here…"
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 text-sm min-h-[160px]"
            />
          </div>
        )}

        <button
          onClick={runAnalysis}
          disabled={loading || (!url.trim() && !pastedText.trim())}
          className="self-start rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      {analysis && (
        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {analysis.position.title || "Untitled position"}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400">
                {analysis.company.name || "Unknown company"}
                {analysis.company.industry ? ` · ${analysis.company.industry}` : ""}
              </p>
            </div>
            <FitScore score={analysis.fit.score} verdict={analysis.fit.verdict} />
          </div>

          <p className="text-sm">{analysis.summary}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <InfoTile label="Location" value={analysis.position.location} />
            <InfoTile label="Employment type" value={analysis.position.employmentType} />
            <InfoTile label="Seniority" value={analysis.position.seniority} />
            <InfoTile label="Compensation" value={analysis.position.compensation} />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <ListSection title="Strengths" items={analysis.fit.strengths} tone="positive" />
            <ListSection title="Gaps" items={analysis.fit.gaps} tone="negative" />
            <ListSection title="Red flags" items={analysis.fit.redFlags} tone="negative" />
            <ListSection title="Questions to ask" items={analysis.fit.questionsToAsk} />
          </div>

          {analysis.fit.goalAlignment && (
            <div className="text-sm">
              <span className="font-medium">Goal alignment: </span>
              {analysis.fit.goalAlignment}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-5">
            <ListSection title="Key responsibilities" items={analysis.position.keyResponsibilities} />
            <ListSection title="Required qualifications" items={analysis.position.requiredQualifications} />
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            {applied ? (
              <p className="text-sm text-green-600 font-medium">
                ✓ Added to your application tracker.
              </p>
            ) : showApplyForm ? (
              <ApplyForm
                fields={applyFields}
                setFields={setApplyFields}
                onCancel={() => setShowApplyForm(false)}
                onSubmit={submitApplication}
                submitting={applying}
                error={applyError}
              />
            ) : (
              <button
                onClick={openApplyForm}
                className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm font-medium"
              >
                Mark as Applied
              </button>
            )}
          </div>
        </section>
      )}

      {result && (
        <AnalysisChat jobAnalysisId={result.jobAnalysis.id} messages={chatMessages} setMessages={setChatMessages} />
      )}
    </div>
  );
}

function AnalysisChat({
  jobAnalysisId,
  messages,
  setMessages,
}: {
  jobAnalysisId: number;
  messages: ChatMessage[];
  setMessages: (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
}) {
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendQuestion() {
    const trimmed = question.trim();
    if (!trimmed || sending) return;

    const tempId = `pending-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, role: "user", content: trimmed }]);
    setQuestion("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/analyze/${jobAnalysisId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get a response");
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        { id: data.userMessage.id, role: "user", content: data.userMessage.content },
        { id: data.assistantMessage.id, role: "assistant", content: data.assistantMessage.content },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get a response");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setQuestion(trimmed);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 flex flex-col gap-4">
      <div>
        <h2 className="font-medium">Ask about this role</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Follow-up questions grounded in this posting and your profile — e.g. &quot;how should I
          negotiate the comp?&quot; or &quot;is the on-call requirement a dealbreaker for me?&quot;
        </p>
      </div>

      {messages.length > 0 && (
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "self-end bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "self-start bg-zinc-100 dark:bg-zinc-900"
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendQuestion();
          }}
          placeholder="Ask a question about this role…"
          disabled={sending}
          className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 text-sm"
        />
        <button
          onClick={sendQuestion}
          disabled={sending || !question.trim()}
          className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}

function FitScore({ score, verdict }: { score: number; verdict: string }) {
  const color =
    score >= 75
      ? "text-emerald-600 border-emerald-300"
      : score >= 50
      ? "text-amber-600 border-amber-300"
      : "text-red-600 border-red-300";
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border ${color} px-4 py-2 shrink-0`}>
      <span className="text-2xl font-bold">{score}</span>
      <span className="text-[11px] font-medium">{verdict}</span>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-md bg-zinc-50 dark:bg-zinc-900 p-2">
      <div className="text-[11px] uppercase text-zinc-500">{label}</div>
      <div>{value || "—"}</div>
    </div>
  );
}

function ListSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "positive" | "negative";
}) {
  if (!items || items.length === 0) return null;
  const dot = tone === "positive" ? "text-emerald-500" : tone === "negative" ? "text-red-500" : "text-zinc-400";
  return (
    <div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <ul className="text-sm flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className={dot}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type ApplyFields = {
  company: string;
  position: string;
  industry: string;
  compensation: string;
  location: string;
  dateApplied: string;
  status: string;
  summary: string;
};

function ApplyForm({
  fields,
  setFields,
  onCancel,
  onSubmit,
  submitting,
  error,
}: {
  fields: ApplyFields;
  setFields: (f: ApplyFields) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  function set<K extends keyof ApplyFields>(key: K, value: ApplyFields[K]) {
    setFields({ ...fields, [key]: value });
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-medium text-sm">Confirm application details</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <TextField label="Company" value={fields.company} onChange={(v) => set("company", v)} />
        <TextField label="Position" value={fields.position} onChange={(v) => set("position", v)} />
        <TextField label="Industry" value={fields.industry} onChange={(v) => set("industry", v)} />
        <TextField label="Compensation" value={fields.compensation} onChange={(v) => set("compensation", v)} />
        <TextField label="Location" value={fields.location} onChange={(v) => set("location", v)} />
        <TextField
          label="Date applied"
          type="date"
          value={fields.dateApplied}
          onChange={(v) => set("dateApplied", v)}
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Confirm & Save"}
        </button>
        <button onClick={onCancel} className="text-sm text-zinc-500 hover:underline">
          Cancel
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function TextField({
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
