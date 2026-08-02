import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="text-gradient text-7xl font-black">404</div>
      <p className="mt-3 text-white/50">This sector of the fleet doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-gradient-to-br from-electric to-cyan px-5 py-3 text-sm font-semibold text-white shadow-glow shadow-electric/40 transition-transform hover:scale-105"
      >
        Back to Mission Control
      </Link>
    </div>
  );
}
