export type CandidateProfileJson = {
  summary: string;
  topSkills: string[];
  skillsToGrow: string[];
  experienceHighlights: string[];
  careerGoals: string;
  ambitions: string;
  sideBusiness: string;
  workStylePreferences: string;
  compensationTarget: string;
  dealBreakers: string[];
  idealRoleCriteria: string[];
};

export type JobAnalysisJson = {
  company: {
    name: string | null;
    industry: string | null;
    size: string | null;
    notes: string | null;
  };
  position: {
    title: string | null;
    location: string | null;
    employmentType: string | null;
    seniority: string | null;
    compensation: string | null;
    keyResponsibilities: string[];
    requiredQualifications: string[];
    niceToHaveQualifications: string[];
  };
  summary: string;
  fit: {
    score: number;
    verdict: string;
    strengths: string[];
    gaps: string[];
    redFlags: string[];
    questionsToAsk: string[];
    goalAlignment: string;
  };
};
