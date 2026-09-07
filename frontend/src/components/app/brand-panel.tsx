const FEATURES = [
  { label: "Submit", dot: "bg-spectrum-1" },
  { label: "Review", dot: "bg-spectrum-4" },
  { label: "Track", dot: "bg-spectrum-3" },
];


export function BrandPanel({
  headline,
  description,
}: {
  headline: string;
  description: string;
}) {
  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-primary via-brand-action to-brand-deep p-10 text-white lg:flex">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-spectrum-4/25 blur-3xl"
      />

      <div className="relative flex items-center gap-2.5 text-lg font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-base font-bold">
          W
        </span>

        Weekly Reports
      </div>

      <div className="relative">
        <h2 className="max-w-sm text-3xl font-bold leading-tight">
          {headline}
        </h2>

        <p className="mt-3 max-w-sm text-sm text-white/70">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {FEATURES.map((feature) => (
            <span
              key={feature.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${feature.dot}`} />
              {feature.label}
            </span>
          ))}
        </div>
      </div>

      <p className="relative text-xs text-white/50">
        &copy; {new Date().getFullYear()} Weekly Reports
      </p>
    </div>
  );
}
