'use client';

export default function SpecificationsLeftPage() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(180deg,#f7f0e4_0%,#f2e7d7_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,164,109,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(184,147,88,0.12),transparent_26%)]" />
      <div className="absolute inset-x-[8%] top-[8%] h-px bg-[linear-gradient(90deg,transparent,rgba(164,117,54,0.32),transparent)]" />
      <div className="absolute inset-y-[10%] left-[8%] w-px bg-[linear-gradient(180deg,transparent,rgba(164,117,54,0.24),transparent)]" />
      <div className="absolute inset-y-[10%] right-[8%] w-px bg-[linear-gradient(180deg,transparent,rgba(164,117,54,0.24),transparent)]" />
      <div className="absolute inset-x-[8%] bottom-[8%] h-px bg-[linear-gradient(90deg,transparent,rgba(164,117,54,0.32),transparent)]" />
    </div>
  );
}
