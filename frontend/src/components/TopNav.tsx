import { startLogin } from "@/const";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { TuluVoiceSampleButton } from "@/components/TuluVoiceSampleButton";
import { Search } from "@/components/Search";
import { languageOptions, supportedLanguageCodes } from "@shared/i18n";
import { Bot, Menu, UserRound, X } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { ALVAS_ROBO_ALT, ALVAS_ROBO_IMAGE } from "@/lib/alvasRobo";

export function TopNav({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const links = [
    { href: "/", label: "Home" }, { href: "/#explore", label: "Explore" }, { href: "/map", label: t("navMap") }, { href: "/ar", label: t("navAr") }, { href: "/history", label: t("navHistory"), compactOnly: true }, { href: "/account", label: t("navAccount"), compactOnly: true }, { href: "/admin", label: t("navAdmin"), compactOnly: true },
  ];
  const roboLink = { href: "/assistant", label: "Alvas Robo", icon: Bot };
  return (
    <header className={cn("sticky top-0 z-[1000] border-b transition-colors", transparent ? "border-[#6f382d]/45 bg-[#2b0f16]/95 backdrop-blur-xl" : "border-slate-200 bg-white/90 backdrop-blur-xl")}>
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link href="/" className="group flex min-w-[150px] shrink-0 items-center gap-2.5 whitespace-nowrap font-display text-lg font-bold tracking-tight text-slate-950">
          <span className="brand-orbit grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-white shadow-lg shadow-amber-500/15"><img src="/alvas-education-foundation-logo.png" alt="Alva's Education Foundation" className="h-full w-full object-contain p-1" /></span>
          <span className={cn("leading-tight", transparent ? "text-white" : "text-slate-950")}>AIET <span className="hidden text-amber-500 sm:inline">PathFinder</span><span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:text-[10px]">Alva's campus</span></span>
        </Link>
        <nav className="hidden shrink-0 items-center gap-0 lg:flex" aria-label="Main navigation">
          {links.map(link => <Link key={link.href} href={link.href} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium transition-colors", link.compactOnly && "hidden 2xl:inline-flex", (location === link.href || (link.href === "/" && location === "/")) ? "bg-cyan-500/15 text-cyan-700" : transparent ? "text-slate-200 hover:bg-white/10 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}>{link.label}</Link>)}
        </nav>
        <div className="hidden xl:block w-52 2xl:w-64">
          <Search placeholder="Search campus..." variant={transparent ? "dark" : "light"} />
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <label className="sr-only" htmlFor="pathfinder-language">{t("language")}</label><select id="pathfinder-language" value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} className={cn("h-9 max-w-24 rounded-lg border px-2 text-xs font-semibold outline-none", transparent ? "border-white/15 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-700")}><option value={languageOptions[language] ? language : "en"}>{languageOptions[language].nativeLabel}</option>{supportedLanguageCodes.filter((code) => code !== language).map((code) => <option key={code} value={code}>{languageOptions[code].nativeLabel}</option>)}</select><TuluVoiceSampleButton compact className={transparent ? "text-white" : "text-[#7e1532]"} />
          {isAuthenticated ? <><Link href="/account" className={cn("grid h-9 w-9 place-items-center rounded-lg", transparent ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100")} aria-label={t("navAccount")}><UserRound className="h-4 w-4" /></Link><button onClick={logout} className={cn("rounded-lg px-3 py-2 text-sm font-medium", transparent ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100")}>Sign out</button></> : <button onClick={() => startLogin()} className={cn("rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition", transparent ? "bg-white/10 hover:bg-white/15" : "bg-slate-950 hover:bg-slate-800")}>Campus sign in</button>}
          <Link href="/destinations" className="rounded-lg bg-gradient-to-r from-amber-300 via-yellow-400 to-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5">Plan route</Link>
          <Link href={roboLink.href} aria-label="Open Alvas Robo assistant" className={cn("group inline-flex h-10 items-center gap-2 rounded-xl border px-2.5 shadow-sm transition hover:-translate-y-0.5", location === roboLink.href ? "border-cyan-300/70 bg-cyan-300/15 text-cyan-700" : transparent ? "border-amber-200/25 bg-white/10 text-white hover:border-amber-200/50 hover:bg-white/15" : "border-amber-200 bg-amber-50 text-[#7e132b] hover:border-amber-300 hover:bg-amber-100")}><img src={ALVAS_ROBO_IMAGE} alt="" className="h-7 w-7 rounded-lg object-cover ring-1 ring-white/50" /><span className="text-sm font-bold">Alvas Robo</span></Link>
        </div>
        <button onClick={() => setOpen(!open)} className={cn("grid h-10 w-10 place-items-center rounded-lg lg:hidden", transparent ? "text-white hover:bg-white/10" : "text-slate-800 hover:bg-slate-100")} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className={cn("border-t px-4 py-3 lg:hidden", transparent ? "border-[#6f382d]/45 bg-[#2b0f16]" : "border-slate-200 bg-white")}>
        <div className="mb-3">
          <Search placeholder="Search destinations, cabins, labs..." variant={transparent ? "dark" : "light"} onSelect={() => setOpen(false)} />
        </div>
        <nav className="grid gap-1" aria-label="Mobile navigation">{[...links, roboLink].map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={cn("inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium", location === link.href ? "bg-cyan-500/15 text-cyan-700" : transparent ? "text-slate-200" : "text-slate-700")}>{link.href === roboLink.href ? <img src={ALVAS_ROBO_IMAGE} alt="" className="h-5 w-5 rounded-md object-cover" /> : null}{link.label}</Link>)}</nav>
        <label className="mt-3 grid gap-1 text-xs font-semibold"><span>{t("language")}</span><select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800">{supportedLanguageCodes.map((code) => <option key={code} value={code}>{languageOptions[code].label} · {languageOptions[code].nativeLabel}</option>)}</select></label><TuluVoiceSampleButton className="mt-2" />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden"><button onClick={() => startLogin()} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">Sign in</button><Link href="/destinations" className="rounded-lg bg-amber-300 px-3 py-2 text-center text-sm font-bold text-slate-950">Plan route</Link></div>
      </div>}
    </header>
  );
}
