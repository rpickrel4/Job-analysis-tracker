-- CreateTable
CREATE TABLE "Profile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "resumeText" TEXT,
    "resumeFileName" TEXT,
    "profileJson" TEXT,
    "profileSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InterviewAnswer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "questionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JobAnalysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT,
    "rawText" TEXT NOT NULL,
    "company" TEXT,
    "position" TEXT,
    "industry" TEXT,
    "location" TEXT,
    "employmentType" TEXT,
    "compensation" TEXT,
    "summary" TEXT,
    "fitScore" INTEGER,
    "analysisJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Application" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "industry" TEXT,
    "compensation" TEXT,
    "location" TEXT,
    "dateApplied" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Applied',
    "postingLink" TEXT,
    "summary" TEXT,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "jobAnalysisId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_jobAnalysisId_fkey" FOREIGN KEY ("jobAnalysisId") REFERENCES "JobAnalysis" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InterviewAnswer_questionId_key" ON "InterviewAnswer"("questionId");
