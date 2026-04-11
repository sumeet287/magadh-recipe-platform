import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "linear-gradient(180deg, #0d0603 0%, #1a0c06 50%, #120804 100%)" }}
    >
      <div className="text-center max-w-lg">
        <p
          className="font-serif text-[8rem] sm:text-[10rem] font-bold leading-none select-none mb-4"
          style={{
            background: "linear-gradient(180deg, rgba(212,132,58,0.15) 0%, rgba(212,132,58,0.03) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-white/40 text-sm sm:text-base leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back to the good stuff.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #D4843A 0%, #c67530 100%)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(212,132,58,0.3)",
            }}
          >
            Go Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white/60 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Shop Products
          </Link>
        </div>
      </div>
    </div>
  );
}
