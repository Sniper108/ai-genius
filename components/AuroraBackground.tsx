export function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Deep base */}
      <div className="absolute inset-0 bg-void" />

      {/* Aurora blobs */}
      <div className="absolute -left-40 -top-40 h-[42rem] w-[42rem] animate-aurora rounded-full bg-electric/20 blur-[120px]" />
      <div
        className="absolute -right-40 top-20 h-[38rem] w-[38rem] animate-aurora rounded-full bg-cyan/15 blur-[120px]"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="absolute bottom-[-15rem] left-1/3 h-[40rem] w-[40rem] animate-aurora rounded-full bg-claude/15 blur-[130px]"
        style={{ animationDelay: "-14s" }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-lines bg-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,6,10,0.9)_100%)]" />
    </div>
  );
}
