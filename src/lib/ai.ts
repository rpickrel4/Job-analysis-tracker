import { askClaude, askClaudeConversation, extractJson, type ChatTurn } from "./anthropic";
import type { CandidateProfileJson, JobAnalysisJson } from "./types";
import type { InterviewAnswer } from "@prisma/client";

/** Synthesizes the resume + interview answers into a structured candidate profile. */
export async function synthesizeProfile(params: {
  resumeText: string | null;
  answers: InterviewAnswer[];
}): Promise<CandidateProfileJson> {
  const { resumeText, answers } = params;

  const answersBlock = answers.length
    ? answers
        .map((a) => `Q (${a.category}): ${a.question}\nA: ${a.answer}`)
        .join("\n\n")
    : "(No interview answers provided yet.)";

  const prompt = `Here is the candidate's resume text:\n\n${
    resumeText?.trim() || "(No resume uploaded yet.)"
  }\n\n---\n\nHere are the candidate's answers to an interview about their work history, side projects, goals, and preferences:\n\n${answersBlock}\n\nSynthesize all of this into a single structured candidate profile. Be specific and pull real details from the resume/answers rather than generic statements. If information for a field is missing, use an empty string, empty array, or "Not specified" rather than inventing anything.

Respond with ONLY a JSON object matching this exact shape (no markdown fences, no commentary):
{
  "summary": "2-4 sentence narrative summary of who this candidate is professionally",
  "topSkills": ["skill1", "skill2", ...],
  "skillsToGrow": ["skill1", ...],
  "experienceHighlights": ["highlight1", "highlight2", ...],
  "careerGoals": "string describing 3-5 year goals",
  "ambitions": "string describing broader ambitions",
  "sideBusiness": "string describing any side business/projects and how they factor into job fit, or 'None' ",
  "workStylePreferences": "string describing preferred company size, remote/hybrid/onsite, team/culture fit",
  "compensationTarget": "string describing target comp range and floor",
  "dealBreakers": ["dealbreaker1", ...],
  "idealRoleCriteria": ["criterion1", ...]
}`;

  const response = await askClaude({
    system:
      "You are an expert career coach and technical recruiter who builds precise, evidence-based candidate profiles used to evaluate job fit. You always respond with strict JSON only.",
    prompt,
    maxTokens: 2048,
  });

  return extractJson<CandidateProfileJson>(response);
}

/** Analyzes a job posting's text against the candidate's stored profile. */
export async function analyzeJobPosting(params: {
  postingText: string;
  profile: CandidateProfileJson | null;
  url?: string | null;
}): Promise<JobAnalysisJson> {
  const { postingText, profile, url } = params;

  const profileBlock = profile
    ? JSON.stringify(profile, null, 2)
    : "(No candidate profile available yet — the user hasn't completed the interview/resume upload. Still extract job details, but note in goalAlignment that fit can't be properly assessed yet.)";

  const prompt = `Candidate profile:\n${profileBlock}\n\n---\n\nJob posting${
    url ? ` (source: ${url})` : ""
  }:\n\n${postingText}\n\nAnalyze this job posting for the candidate. Extract company and position details, write a summary that would still make sense to the candidate months later if the posting link expires, and produce a fit analysis grounded in the candidate profile above.

Respond with ONLY a JSON object matching this exact shape (no markdown fences, no commentary). Use null for genuinely unknown fields, empty arrays where nothing applies:
{
  "company": { "name": string|null, "industry": string|null, "size": string|null, "notes": string|null },
  "position": {
    "title": string|null,
    "location": string|null,
    "employmentType": string|null,
    "seniority": string|null,
    "compensation": string|null,
    "keyResponsibilities": string[],
    "requiredQualifications": string[],
    "niceToHaveQualifications": string[]
  },
  "summary": "3-5 sentence standalone summary of the role and company",
  "fit": {
    "score": number (0-100),
    "verdict": "one short phrase, e.g. 'Strong fit' / 'Worth applying' / 'Stretch role' / 'Poor fit'",
    "strengths": string[] (why the candidate matches),
    "gaps": string[] (where they fall short),
    "redFlags": string[] (concerning signals in the posting itself, e.g. vague comp, excessive requirements, culture concerns),
    "questionsToAsk": string[] (good questions for the candidate to ask in an interview),
    "goalAlignment": "1-3 sentences on how well this aligns with the candidate's stated goals/ambitions"
  }
}`;

  const response = await askClaude({
    system:
      "You are an expert career coach and technical recruiter. You give honest, specific, non-generic analysis grounded only in the provided posting and candidate profile. You always respond with strict JSON only.",
    prompt,
    maxTokens: 8000,
  });

  const analysis = extractJson<JobAnalysisJson>(response);

  if (
    !analysis ||
    typeof analysis !== "object" ||
    !analysis.company ||
    !analysis.position ||
    !analysis.fit ||
    typeof analysis.fit.score !== "number"
  ) {
    throw new Error(
      "The analysis came back in an unexpected format — this can happen when the fetched page wasn't actually the job posting (e.g. a login wall). Try pasting the description text directly."
    );
  }

  return analysis;
}

/** Answers a free-form follow-up question about an already-analyzed posting. */
export async function chatAboutAnalysis(params: {
  postingText: string;
  analysis: JobAnalysisJson;
  profile: CandidateProfileJson | null;
  history: ChatTurn[];
  question: string;
}): Promise<string> {
  const { postingText, analysis, profile, history, question } = params;

  const profileBlock = profile
    ? JSON.stringify(profile, null, 2)
    : "(No candidate profile available.)";

  const system = `You are an expert career coach and technical recruiter helping a candidate think through a specific job posting they've already had analyzed. Answer their follow-up questions directly and specifically, grounded in the posting text, your prior analysis, and their candidate profile below. Keep answers conversational and concise (a few sentences to a short paragraph, use brief lists only when genuinely helpful) — this is a chat, not a report. If something isn't stated in the posting or profile, say so rather than guessing.

Candidate profile:
${profileBlock}

Job posting text:
${postingText}

Your prior structured analysis of this posting:
${JSON.stringify(analysis, null, 2)}`;

  return askClaudeConversation({
    system,
    messages: [...history, { role: "user", content: question }],
    maxTokens: 1024,
  });
}
