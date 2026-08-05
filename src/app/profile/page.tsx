"use client";

import { useEffect, useState, useCallback } from "react";
import { INTERVIEW_CATEGORIES, INTERVIEW_QUESTIONS } from "@/lib/interviewQuestions";
import type { CandidateProfileJson } from "@/lib/types";

type QuestionWithAnswer = (typeof INTERVIEW_QUESTIONS)[number] & { answer: string };

export default function ProfilePage() {
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [profileJson, setProfileJson] = useState<CandidateProfileJson | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesizeError, setSynthesizeError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [profileRes, interviewRes] = await Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/interview").then((r) => r.json()),
    ]);
    setResumeFileName(profileRes.profile?.resumeFileName ?? null);
    if (profileRes.profile?.profileJson) {
      setProfileJson(JSON.parse(profileRes.profile.profileJson));
    }
    setQuestions(interviewRes.questions);
    setLoadingQuestions(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    setResumeError(null);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch("/api/resume", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setResumeFileName(data.profile.resumeFileName);
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setResumeUploading(false);
      e.target.value = "";
    }
  }

  function updateAnswerLocally(id: string, answer: string) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, answer } : q)));
  }

  async function saveAnswer(id: string, answer: string) {
    setSavingId(id);
    try {
      await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: id, answer }),
      });
    } finally {
      setSavingId(null);
    }
  }

  async function handleSynthesize() {
    setSynthesizing(true);
    setSynthesizeError(null);
    try {
      const res = await fetch("/api/interview/synthesize", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to build profile");
      setProfileJson(data.profileJson);
    } catch (err) {
      setSynthesizeError(err instanceof Error ? err.message : "Failed to build profile");
    } finally {
      setSynthesizing(false);
    }
  }

  const answeredCount = questions.filter((q) => q.answer?.trim()).length;

  return (
    <div className="flex flex-col gap-10 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Upload your resume and answer a few questions. This becomes the context used to
          evaluate every job posting you analyze.
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
        <h2 className="font-medium mb-2">Resume</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
          PDF, DOCX, or TXT. We extract the text and use it alongside your interview answers.
        </p>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-sm font-medium">
            {resumeUploading ? "Uploading…" : resumeFileName ? "Replace resume" : "Upload resume"}
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={handleResumeUpload}
              disabled={resumeUploading}
            />
          </label>
          {resumeFileName && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{resumeFileName}</span>
          )}
        </div>
        {resumeError && <p className="text-sm text-red-600 mt-2">{resumeError}</p>}
      </section>

      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Interview</h2>
          <span className="text-sm text-zinc-500">
            {answeredCount}/{questions.length} answered
          </span>
        </div>

        {loadingQuestions ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : (
          <div className="flex flex-col gap-8">
            {INTERVIEW_CATEGORIES.map((category) => {
              const categoryQuestions = questions.filter((q) => q.category === category);
              if (categoryQuestions.length === 0) return null;
              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                    {category}
                  </h3>
                  <div className="flex flex-col gap-4">
                    {categoryQuestions.map((q) => (
                      <div key={q.id}>
                        <label className="text-sm font-medium block mb-1">{q.question}</label>
                        {q.helperText && (
                          <p className="text-xs text-zinc-500 mb-1">{q.helperText}</p>
                        )}
                        <textarea
                          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-2 text-sm min-h-[70px]"
                          value={q.answer}
                          onChange={(e) => updateAnswerLocally(q.id, e.target.value)}
                          onBlur={(e) => saveAnswer(q.id, e.target.value)}
                          placeholder="Your answer…"
                        />
                        {savingId === q.id && (
                          <span className="text-xs text-zinc-400">Saving…</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Synthesized Profile</h2>
          <button
            onClick={handleSynthesize}
            disabled={synthesizing}
            className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {synthesizing ? "Building…" : profileJson ? "Rebuild profile" : "Build profile"}
          </button>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
          Uses AI to combine your resume and interview answers into the profile used for job fit
          analysis. Rebuild anytime after adding more answers.
        </p>
        {synthesizeError && <p className="text-sm text-red-600 mb-3">{synthesizeError}</p>}
        {profileJson ? (
          <div className="flex flex-col gap-3 text-sm">
            <p>{profileJson.summary}</p>
            <ProfileField label="Top skills" items={profileJson.topSkills} />
            <ProfileField label="Skills to grow" items={profileJson.skillsToGrow} />
            <ProfileField label="Experience highlights" items={profileJson.experienceHighlights} />
            <ProfileText label="Career goals" text={profileJson.careerGoals} />
            <ProfileText label="Ambitions" text={profileJson.ambitions} />
            <ProfileText label="Side business" text={profileJson.sideBusiness} />
            <ProfileText label="Work style preferences" text={profileJson.workStylePreferences} />
            <ProfileText label="Compensation target" text={profileJson.compensationTarget} />
            <ProfileField label="Dealbreakers" items={profileJson.dealBreakers} />
            <ProfileField label="Ideal role criteria" items={profileJson.idealRoleCriteria} />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            No profile built yet. Upload a resume and/or answer some interview questions, then
            click &quot;Build profile&quot;.
          </p>
        )}
      </section>
    </div>
  );
}

function ProfileField({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <span className="font-medium">{label}: </span>
      <span className="text-zinc-600 dark:text-zinc-400">{items.join(", ")}</span>
    </div>
  );
}

function ProfileText({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <span className="font-medium">{label}: </span>
      <span className="text-zinc-600 dark:text-zinc-400">{text}</span>
    </div>
  );
}
