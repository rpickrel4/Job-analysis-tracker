export default function TopBar() {
  return (
    <header className="sticky top-0 z-10 bg-sage-50/95 dark:bg-sage-950/95 backdrop-blur border-b border-sage-200 dark:border-sage-900 pt-[env(safe-area-inset-top)]">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center">
        <span className="font-semibold text-sage-800 dark:text-sage-200 truncate">Job Hunt Copilot</span>
      </div>
    </header>
  );
}
