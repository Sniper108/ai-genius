export function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#07080d]">
      {/* Subtle aurora — clean, not overwhelming */}
      <div className="absolute -left-40 -top-52 h-[38rem] w-[38rem] animate-aurora rounded-full bg-electric/10 blur-[130px]" />
      <div
        className="absolute -right-40 top-40 h-[34rem] w-[34rem] animate-aurora rounded-full bg-cyan/10 blur-[130px]"
        style={{ animationDelay: "-9s" }}
      />

      {/* Faint grid, fading toward the edges */}
      <div className="absolute inset-0 bg-grid-lines bg-grid opacity-[0.5] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_50%,rgba(5,6,10,0.8)_100%)]" />
    </div>
  );
}
