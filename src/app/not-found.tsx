import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-base px-6 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="diag-lines absolute inset-0" />
        <div className="kana-mega absolute -right-8 top-1/2 -translate-y-1/2 text-[40vw] leading-none" aria-hidden>
          迷子
        </div>
      </div>

      <div className="tab-block mb-6 px-4 py-1.5 pr-7" style={{ background: "var(--accent)" }}>
        <span className="subtitle-bar text-[0.7rem] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--accent-ink)" }}>
          ✦ error · エラー
        </span>
      </div>

      <h1 className="text-[6rem] font-extrabold leading-none tracking-tighter text-accent stroke-glow sm:text-[10rem]">
        404
      </h1>
      <p className="subtitle-bar mt-2 text-sm uppercase tracking-[0.35em] text-ink/55">
        このページは修行の旅に出ました
      </p>
      <p className="mt-4 max-w-md text-lg text-ink/70">
        This page went on a training arc and hasn&apos;t come back. Maybe it&apos;ll return
        powered-up in a later season.
      </p>

      <Link
        href="/"
        className="group mt-8 inline-flex items-center gap-2 px-7 py-3 text-sm font-extrabold uppercase tracking-[0.15em]"
        style={{ background: "var(--accent)", color: "var(--accent-ink)", boxShadow: "5px 5px 0 var(--ink)" }}
      >
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to AniKit
      </Link>
    </main>
  );
}
