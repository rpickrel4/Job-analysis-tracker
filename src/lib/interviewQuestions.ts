export type InterviewQuestion = {
  id: string;
  category: string;
  question: string;
  helperText?: string;
};

export const INTERVIEW_CATEGORIES = [
  "Work History",
  "Side Business & Projects",
  "Goals & Ambitions",
  "Skills & Strengths",
  "Work Style & Preferences",
  "Compensation & Constraints",
] as const;

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // Work History
  {
    id: "work_current_role",
    category: "Work History",
    question: "What's your current (or most recent) role, and what does a typical week look like?",
  },
  {
    id: "work_proudest_achievement",
    category: "Work History",
    question: "What's an accomplishment from your career you're most proud of, and why?",
  },
  {
    id: "work_biggest_challenge",
    category: "Work History",
    question: "Describe a significant challenge or failure you've dealt with professionally and what you learned.",
  },
  {
    id: "work_reason_for_leaving",
    category: "Work History",
    question: "What's driving you to look for something new right now?",
  },

  // Side Business & Projects
  {
    id: "side_business_overview",
    category: "Side Business & Projects",
    question: "Do you run any side businesses, freelance work, or personal projects? Describe what they are.",
    helperText: "If none, just say so — this helps the app avoid asking about it in analyses.",
  },
  {
    id: "side_business_time",
    category: "Side Business & Projects",
    question: "How much time/energy do these take, and do you want a future job to accommodate them (e.g. flexible hours)?",
  },

  // Goals & Ambitions
  {
    id: "goals_5_year",
    category: "Goals & Ambitions",
    question: "Where do you want to be in your career in 3-5 years?",
  },
  {
    id: "goals_next_role",
    category: "Goals & Ambitions",
    question: "What do you want your NEXT role specifically to give you (e.g. new skills, leadership, industry change, stability)?",
  },
  {
    id: "goals_dealbreakers",
    category: "Goals & Ambitions",
    question: "What are your absolute dealbreakers in a job or company (culture, commute, remote policy, industry, etc.)?",
  },

  // Skills & Strengths
  {
    id: "skills_top",
    category: "Skills & Strengths",
    question: "What are your strongest technical or professional skills?",
  },
  {
    id: "skills_growth",
    category: "Skills & Strengths",
    question: "What skills are you actively trying to grow or would like more exposure to?",
  },
  {
    id: "skills_weaknesses",
    category: "Skills & Strengths",
    question: "What's an honest gap or weakness in your background that a good-fit job should be forgiving of?",
  },

  // Work Style & Preferences
  {
    id: "style_environment",
    category: "Work Style & Preferences",
    question: "Do you prefer startups, mid-size companies, or large enterprises? Remote, hybrid, or in-office?",
  },
  {
    id: "style_team",
    category: "Work Style & Preferences",
    question: "What kind of team, manager, or culture brings out your best work?",
  },

  // Compensation & Constraints
  {
    id: "comp_target",
    category: "Compensation & Constraints",
    question: "What's your target total compensation range, and what's your absolute floor?",
  },
  {
    id: "comp_constraints",
    category: "Compensation & Constraints",
    question: "Any other constraints the app should weigh (location, visa/sponsorship, travel tolerance, start date)?",
  },
];
