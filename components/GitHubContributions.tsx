import type { GitHubContributions } from "@/lib/github";

type Props = {
  contributions: GitHubContributions | null;
  locale: "ja" | "en";
};

function levelFor(count: number, max: number): string {
  if (count === 0) return "bg-white/[0.045] border-white/[0.04]";
  const ratio = max > 0 ? count / max : 0;
  if (ratio >= 0.75) return "bg-[#39D98A] border-[#39D98A]/70 shadow-[0_0_10px_rgba(57,217,138,0.25)]";
  if (ratio >= 0.45) return "bg-[#25A966] border-[#25A966]/70";
  if (ratio >= 0.2) return "bg-[#176F46] border-[#176F46]/70";
  return "bg-[#0E3F2C] border-[#0E3F2C]/70";
}

function formatDate(date: string, locale: "ja" | "en"): string {
  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function GitHubContributions({ contributions, locale }: Props) {
  if (!contributions) return null;

  const allDays = contributions.weeks.flatMap((week) => week.contributionDays);
  const max = Math.max(...allDays.map((day) => day.contributionCount), 1);
  const label = locale === "ja" ? "GitHub Activity" : "GitHub Activity";
  const title = locale === "ja" ? "Contribution Graph" : "Contribution Graph";
  const privateLabel = locale === "ja" ? "private含む" : "includes private";
  const rangeLabel = `${formatDate(contributions.from, locale)} - ${formatDate(contributions.to, locale)}`;

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-16 sm:py-20 border-t border-white/[0.06]">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-8">
        <div>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#39D98A] block mb-3">
            {label}
          </span>
          <h2 className="font-display font-bold text-display-md text-text-primary">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          <div>
            <div className="font-display text-3xl font-bold text-[#39D98A]">
              {contributions.totalContributions.toLocaleString()}
            </div>
            <div className="font-mono text-[9px] tracking-widest uppercase text-text-muted mt-1">
              Contributions
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-text-primary">
              {contributions.weeks.length}
            </div>
            <div className="font-mono text-[9px] tracking-widest uppercase text-text-muted mt-1">
              Weeks
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-accent-cyan">
              {contributions.restrictedContributionsCount.toLocaleString()}
            </div>
            <div className="font-mono text-[9px] tracking-widest uppercase text-text-muted mt-1">
              Private
            </div>
          </div>
        </div>
      </div>

      <div className="border border-white/[0.08] rounded-lg bg-bg-surface/30 p-4 sm:p-6 overflow-hidden">
        <div className="overflow-x-auto pb-2">
          <div
            className="grid grid-flow-col grid-rows-7 gap-1 min-w-max"
            aria-label={`${contributions.username} GitHub contributions`}
          >
            {contributions.weeks.flatMap((week) =>
              week.contributionDays.map((day) => (
                <div
                  key={day.date}
                  title={`${formatDate(day.date, locale)}: ${day.contributionCount} contributions`}
                  className={`h-3 w-3 rounded-[2px] border ${levelFor(day.contributionCount, max)}`}
                />
              ))
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="font-mono text-[10px] tracking-widest uppercase text-text-muted">
            @{contributions.username} / {rangeLabel}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] tracking-widest uppercase text-text-muted">
              Less
            </span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className={`h-3 w-3 rounded-[2px] border ${levelFor(level === 0 ? 0 : level * max / 4, max)}`}
              />
            ))}
            <span className="font-mono text-[9px] tracking-widest uppercase text-text-muted">
              More
            </span>
            <span className="font-mono text-[9px] tracking-widest uppercase text-accent-cyan/70 border border-accent-cyan/20 px-2 py-1 rounded-sm">
              {privateLabel}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
