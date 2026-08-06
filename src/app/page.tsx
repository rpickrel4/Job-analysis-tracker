import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { INTERVIEW_QUESTIONS } from "@/lib/interviewQuestions";
import { statusColor } from "@/lib/statusColor";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [profile, answeredCount, applications, applicationsCount] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.interviewAnswer.count(),
    prisma.application.findMany({ orderBy: { dateApplied: "desc" }, take: 5 }),
    prisma.application.count(),
  ]);

  const totalQuestions = INTERVIEW_QUESTIONS.length;
  const hasResume = Boolean(profile?.resumeText);
  const hasSynthesizedProfile = Boolean(profile?.profileJson);

  const statusCounts = await prisma.application.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Here&apos;s where your job search stands.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          title="Profile"
          value={
            hasSynthesizedProfile ? "Ready" : hasResume ? "Needs synthesis" : "Not started"
          }
          detail={`Resume: ${hasResume ? "uploaded" : "not uploaded"} · Interview: ${answeredCount}/${totalQuestions} answered`}
          href="/profile"
          cta={hasSynthesizedProfile ? "Review profile" : "Complete profile"}
        />
        <Card
          title="Applications tracked"
          value={String(applicationsCount)}
          detail={statusCounts.map((s) => `${s.status}: ${s._count.status}`).join(" · ") || "No applications yet"}
          href="/tracker"
          cta="View tracker"
        />
        <Card
          title="Analyze a posting"
          value="Paste a link"
          detail="Get a full fit analysis against your profile before you apply."
          href="/analyze"
          cta="Analyze now"
        />
      </div>

      {!hasSynthesizedProfile && (
        <div className="rounded-2xl border border-amber-300/70 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-4 text-sm text-amber-900 dark:text-amber-200">
          Upload your resume and answer a few interview questions on the{" "}
          <Link href="/profile" className="underline font-medium">
            My Profile
          </Link>{" "}
          page so job analyses can be personalized to you.
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Recent applications</h2>
          <Link href="/tracker" className="text-sm text-sage-700 dark:text-sage-400 underline">
            View all
          </Link>
        </div>
        {applications.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nothing tracked yet. Analyze a posting or add one manually to get started.
          </p>
        ) : (
          <div className="rounded-2xl border border-sage-200/70 dark:border-sage-900 divide-y divide-sage-200/70 dark:divide-sage-900 overflow-hidden">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm bg-white dark:bg-sage-950/40">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {app.position} @ {app.company}
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400">
                    {new Date(app.dateApplied).toLocaleDateString()}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusColor(app.status)}`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card(props: { title: string; value: string; detail: string; href: string; cta: string }) {
  return (
    <Link
      href={props.href}
      className="rounded-2xl border border-sage-200/70 dark:border-sage-900 bg-white dark:bg-sage-950/40 p-4 flex flex-col gap-1 active:bg-sage-50 dark:active:bg-sage-900/40 transition-colors min-h-11"
    >
      <span className="text-xs uppercase tracking-wide text-sage-600 dark:text-sage-500">{props.title}</span>
      <span className="text-xl font-semibold break-words">{props.value}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400 break-words">{props.detail}</span>
      <span className="text-sm text-sage-700 dark:text-sage-400 font-medium mt-2">
        {props.cta} →
      </span>
    </Link>
  );
}
