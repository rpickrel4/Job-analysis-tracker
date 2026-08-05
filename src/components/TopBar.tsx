export default function TopBar() {
  return (
    <header className="sticky top-0 z-10 bg-white/95 dark:bg-black/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 pt-[env(safe-area-inset-top)]">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center">
        <span className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">Job Hunt Copilot</span>
      </div>
    </header>
  );
}
