"use client";

import { useState } from "react";
import type { JobAnalysisJson } from "@/lib/types";
import { Button, Card, Field, TextArea, TextInput } from "@/components/ui";

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

      <Card className="flex flex-col gap-3">
        <Field label="Posting URL">
          <TextInput
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.linkedin.com/jobs/view/..."
          />
        </Field>

        {!showPasteBox && (
          <button
            type="button"
            onClick={() => setShowPasteBox(true)}
            className="text-sm text-sage-700 dark:text-sage-400 underline self-start min-h-11 flex items-center"
          >
            + Paste description text instead / as well
          </button>
        )}

        {showPasteBox && (
          <Field label="Job description text">
            <TextArea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste the full job posting text here…"
              className="min-h-40"
            />
          </Field>
        )}

        <Button
          onClick={runAnalysis}
          disabled={loading || (!url.trim() && !pastedText.trim())}
          fullWidth
          className="sm:w-auto sm:self-start"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </Button>
        {error && <p className="text-sm text-clay-700 dark:text-clay-400">{error}</p>}
      </Card>

      {analysis && (
        <Card className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold break-words">
                {analysis.position.title || "Untitled position"}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 break-words">
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

          <div className="pt-2 border-t border-sage-200/70 dark:border-sage-900">
            {applied ? (
              <p className="text-sm text-sage-700 dark:text-sage-400 font-medium">
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
              <Button onClick={openApplyForm} variant="success" fullWidth className="sm:w-auto">
                Mark as Applied
              </Button>
            )}
          </div>
        </Card>
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
    <Card className="flex flex-col gap-4">
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
              className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
                m.role === "user"
                  ? "self-end bg-sage-700 text-white dark:bg-sage-600"
                  : "self-start bg-sage-50 dark:bg-sage-900/50"
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <TextInput
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendQuestion();
          }}
          placeholder="Ask a question…"
          disabled={sending}
          className="flex-1 min-w-0"
        />
        <Button onClick={sendQuestion} disabled={sending || !question.trim()} className="shrink-0 px-5">
          {sending ? "…" : "Send"}
        </Button>
      </div>
      {error && <p className="text-sm text-clay-700 dark:text-clay-400">{error}</p>}
    </Card>
  );
}

function FitScore({ score, verdict }: { score: number; verdict: string }) {
  const color =
    score >= 75
      ? "text-sage-700 dark:text-sage-400 border-sage-300 dark:border-sage-700"
      : score >= 50
      ? "text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800"
      : "text-clay-700 dark:text-clay-400 border-clay-300 dark:border-clay-800";
  return (
    <div className={`flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-0 rounded-xl border ${color} px-4 py-2 shrink-0 self-start`}>
      <span className="text-2xl font-bold">{score}</span>
      <span className="text-[11px] font-medium">{verdict}</span>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl bg-sage-50 dark:bg-sage-900/40 p-2.5 min-w-0">
      <div className="text-[11px] uppercase text-zinc-500">{label}</div>
      <div className="break-words">{value || "—"}</div>
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
  const dot = tone === "positive" ? "text-sage-500" : tone === "negative" ? "text-clay-500" : "text-zinc-400";
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <ul className="text-sm flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className={`${dot} shrink-0`}>•</span>
            <span className="break-words min-w-0">{item}</span>
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
        <Field label="Company">
          <TextInput value={fields.company} onChange={(e) => set("company", e.target.value)} />
        </Field>
        <Field label="Position">
          <TextInput value={fields.position} onChange={(e) => set("position", e.target.value)} />
        </Field>
        <Field label="Industry">
          <TextInput value={fields.industry} onChange={(e) => set("industry", e.target.value)} />
        </Field>
        <Field label="Compensation">
          <TextInput value={fields.compensation} onChange={(e) => set("compensation", e.target.value)} />
        </Field>
        <Field label="Location">
          <TextInput value={fields.location} onChange={(e) => set("location", e.target.value)} />
        </Field>
        <Field label="Date applied">
          <TextInput type="date" value={fields.dateApplied} onChange={(e) => set("dateApplied", e.target.value)} />
        </Field>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <Button onClick={onSubmit} disabled={submitting} variant="success" fullWidth className="sm:w-auto">
          {submitting ? "Saving…" : "Confirm & Save"}
        </Button>
        <button onClick={onCancel} className="text-sm text-zinc-500 underline min-h-11">
          Cancel
        </button>
      </div>
      {error && <p className="text-sm text-clay-700 dark:text-clay-400">{error}</p>}
    </div>
  );
}
