import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Search, 
  Clock, 
  MapPin, 
  Globe, 
  RefreshCw, 
  ChevronRight, 
  X, 
  AlertCircle,
  Database,
  Calendar,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MatchDetailView from "./components/MatchDetailView";
import HeroSlideshow from "./components/HeroSlideshow";
// @ts-ignore
import predictScoreLogo from "./assets/images/ChatGPT_Image_Jun_25__2026__10_15_38_AM-removebg-preview.png";
// @ts-ignore
import worldCupHeroBanner from "./assets/images/ChatGPT Image Jun 25, 2026, 11_35_26 AM.png";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://iewnlzrzdtuxykgitmft.supabase.co";
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "your-supabase-anon-key";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const Auth = {
  getToken: () => localStorage.getItem('ps_token'),
  getUser: () => {
    const u = localStorage.getItem('ps_user');
    return u ? JSON.parse(u) : null;
  },
  isLoggedIn: () => !!localStorage.getItem('ps_token'),
  login: (token: string, user: any) => {
    localStorage.setItem('ps_token', token);
    localStorage.setItem('ps_user', JSON.stringify(user));
  },
  logout: () => {
    localStorage.removeItem('ps_token');
    localStorage.removeItem('ps_user');
  }
};


export interface MatchEvent {
  type: "goal" | "card" | "info";
  team: string;
  player: string;
  minute: number;
  detail?: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  homeTeamCode: string;
  homeTeamFlag: string;
  awayTeam: string;
  awayTeamCode: string;
  awayTeamFlag: string;
  homeScore: number;
  awayScore: number;
  status: "UPCOMING" | "LIVE" | "FINISHED";
  rawStatus: string;
  minute?: number;
  group: string;
  stadium: string;
  date: string;
  time: string;
  stage: string;
  events: MatchEvent[];
}

interface Prediction {
  match_winner: {
    home_win: number;
    draw: number;
    away_win: number;
    reasoning: string;
  };
  first_half: {
    home_win: number;
    draw: number;
    away_win: number;
  };
  goals: {
    over_2_5: number;
    both_teams_score: number;
    expected_goals: number;
  };
  confidence: "low" | "medium" | "high";
  summary: string;
}

function normalizePrediction(data: any): Prediction {
  const d = data || {};
  const match_winner = d.match_winner || {};
  const first_half = d.first_half || {};
  const goals = d.goals || {};
  
  return {
    match_winner: {
      home_win: typeof match_winner.home_win === 'number' ? match_winner.home_win : 0,
      draw: typeof match_winner.draw === 'number' ? match_winner.draw : 0,
      away_win: typeof match_winner.away_win === 'number' ? match_winner.away_win : 0,
      reasoning: String(match_winner.reasoning || ""),
    },
    first_half: {
      home_win: typeof first_half.home_win === 'number' ? first_half.home_win : 0,
      draw: typeof first_half.draw === 'number' ? first_half.draw : 0,
      away_win: typeof first_half.away_win === 'number' ? first_half.away_win : 0,
    },
    goals: {
      over_2_5: typeof goals.over_2_5 === 'number' ? goals.over_2_5 : 0,
      both_teams_score: typeof goals.both_teams_score === 'number' ? goals.both_teams_score : 0,
      expected_goals: typeof goals.expected_goals === 'number' ? goals.expected_goals : 0,
    },
    confidence: (d.confidence === "low" || d.confidence === "medium" || d.confidence === "high") ? d.confidence : "medium",
    summary: String(d.summary || ""),
  };
}

type TabType = "ALL" | "LIVE" | "UPCOMING" | "ALL_RESULTS" | "FINISHED" | "RESULTS" | "LEADERBOARD";

// Global FIFA code to ISO mapping and name to ISO mapping
const FIFA_TO_ISO: Record<string, string> = {
  // CONCACAF
  usa: "us", can: "ca", mex: "mx", crc: "cr", pan: "pa", jam: "jm", hon: "hn", slv: "sv", glp: "gp",
  hai: "ht", gua: "gt", lca: "lc", vin: "vc", tca: "tc", bermuda: "bm", ant: "ag", aru: "aw", bah: "bs",
  bar: "bb", blz: "bz", cay: "ky", cub: "cu", cuw: "cw", dma: "dm", dom: "do", grn: "gd", pur: "pr",
  // CONMEBOL
  arg: "ar", bra: "br", uru: "uy", col: "co", ecu: "ec", per: "pe", chi: "cl", par: "py", ven: "ve", bol: "bo",
  // UEFA
  ger: "de", ita: "it", eng: "gb-eng", esp: "es", fra: "fr", por: "pt", ned: "nl", cro: "hr", bel: "be",
  swe: "se", sui: "ch", den: "dk", pol: "pl", ukr: "ua", aut: "at", cze: "cz", tur: "tr", sco: "gb-sct",
  wal: "gb-wls", nir: "gb-nir", alb: "al", and: "ad", arm: "am", aze: "az", blr: "by", bul: "bg", cyp: "cy",
  est: "ee", fin: "fi", fro: "fo", geo: "ge", gib: "gi", gre: "gr", hun: "hu", isl: "is", isr: "il",
  kaz: "kz", lva: "lv", lie: "li", ltu: "lt", lux: "lu", mda: "md", mkd: "mk", mlt: "mt", mne: "me",
  nor: "no", rou: "ro", rus: "ru", smr: "sm", srb: "rs", svk: "sk", svn: "si", gbr: "gb",
  // CAF
  mar: "ma", sen: "sn", rsa: "za", nga: "ng", egy: "eg", gha: "gh", cmr: "cm", civ: "ci", alg: "dz",
  tun: "tn", ang: "ao", ben: "bj", bfa: "bf", bdi: "bi", cpv: "cv", cta: "cf", cha: "td", com: "km",
  cod: "cd", cgo: "cg", dji: "dj", eri: "er", eth: "et", gab: "ga", gam: "gm", gui: "gn", ken: "ke",
  lbr: "lr", lby: "ly", mad: "mg", mwi: "mw", mli: "ml", mtn: "mr", mri: "mu", moz: "mz", nam: "na",
  nig: "ne", rwa: "rw", stp: "st", sey: "sc", sle: "sl", som: "so", ssd: "ss", swz: "sz", tan: "tz",
  tog: "tg", uga: "ug", zam: "zm", zim: "zw",
  // AFC
  jpn: "jp", kor: "kr", aus: "au", ksa: "sa", irn: "ir", irq: "iq", qat: "qa", uae: "ae", chn: "cn",
  ind: "in", afg: "af", ban: "bd", bhr: "bh", bru: "bn", cam: "kh", hkg: "hk", ina: "id", jor: "jo",
  kgz: "kg", kuw: "kw", lao: "la", lbn: "lb", mac: "mo", mas: "my", mdv: "mv", mgl: "mn", mya: "mm",
  nep: "np", oma: "om", pak: "pk", ple: "ps", phi: "ph", sgp: "sg", sri: "lk", syr: "sy", tjk: "tj",
  tha: "th", tls: "tl", tkm: "tm", uzb: "uz", vie: "vn", yem: "ye", prk: "kp", tpe: "tw",
  // OFC
  nzl: "nz", fij: "fj", png: "pg", sam: "ws", sol: "sb", tah: "pf", tga: "to", van: "vu", cok: "ck"
};

const NAME_TO_ISO: Record<string, string> = {
  "united states": "us", "usa": "us", "germany": "de", "deutschland": "de", "canada": "ca", "japan": "jp",
  "mexico": "mx", "italy": "it", "italia": "it", "england": "gb-eng", "brazil": "br", "brasil": "br",
  "spain": "es", "espana": "es", "españa": "es", "france": "fr", "argentina": "ar", "portugal": "pt",
  "netherlands": "nl", "holland": "nl", "croatia": "hr", "morocco": "ma", "senegal": "sn", "belgium": "be",
  "uruguay": "uy", "south korea": "kr", "korea republic": "kr", "korea dpr": "kp", "north korea": "kp",
  "korea": "kr", "australia": "au", "colombia": "co", "sweden": "se", "switzerland": "ch", "denmark": "dk",
  "poland": "pl", "ukraine": "ua", "austria": "at", "turkey": "tr", "türkiye": "tr", "nigeria": "ng",
  "egypt": "eg", "ghana": "gh", "cameroon": "cm", "saudi arabia": "sa", "china": "cn", "india": "in",
  "new zealand": "nz", "chile": "cl", "ecuador": "ec", "peru": "pe", "paraguay": "py", "venezuela": "ve",
  "bolivia": "bo", "costa rica": "cr", "panama": "pa", "honduras": "hn", "el salvador": "sv", "jamaica": "jm",
  "trinidad": "tt", "haiti": "ht", "guatemala": "gt", "algeria": "dz", "tunisia": "tn", "ivory coast": "ci",
  "cote d'ivoire": "ci", "côte d'ivoire": "ci", "south africa": "za", "dr congo": "cd", "congo dr": "cd",
  "congo": "cg", "democratic republic of the congo": "cd", "republic of ireland": "ie", "ireland": "ie",
  "scotland": "gb-sct", "wales": "gb-wls", "northern ireland": "gb-nir", "qatar": "qa", "iraq": "iq",
  "iran": "ir", "united arab emirates": "ae", "uae": "ae", "uzbekistan": "uz", "jordan": "jo", "oman": "om",
  "bahrain": "bh", "palestine": "ps", "kyrgyzstan": "kg", "indonesia": "id", "vietnam": "vn", "thailand": "th",
  "malaysia": "my", "singapore": "sg", "philippines": "ph", "greece": "gr", "norway": "no", "finland": "fi",
  "czechia": "cz", "czech republic": "cz", "slovakia": "sk", "slovenia": "si", "romania": "ro", "bulgaria": "bg",
  "hungary": "hu", "serbia": "rs", "georgia": "ge", "albania": "al", "iceland": "is", "mali": "ml",
  "guinea": "gn", "angola": "ao", "burkina faso": "bf", "cape verde": "cv", "cabo verde": "cv", "gabon": "ga",
  "zambia": "zm", "zimbabwe": "zw", "kenya": "ke", "uganda": "ug", "togo": "tg", "benin": "bj", "madagascar": "mg"
};

function getFlagEmoji(iso: string): string {
  if (!iso) return "🏳️";
  const lower = iso.toLowerCase().trim();
  if (lower === "gb-eng") return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (lower === "gb-sct") return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
  if (lower === "gb-wls") return "🏴󠁧󠁢󠁷󠁬󠁳󠁿";
  if (lower === "gb-nir") return "🏴󠁧󠁢󠁮󠁩󠁲󠁿";
  if (lower.length === 2) {
    try {
      return String.fromCodePoint(...[...lower.toUpperCase()].map(c => c.charCodeAt(0) + 127397));
    } catch {
      return "🏳️";
    }
  }
  return "🏳️";
}

// Get high-quality actual/real flag images from FlagCDN beside names
function getFlagUrl(team: string, code?: string): string {
  const name = team ? team.toLowerCase().trim() : "";
  const tCode = code ? code.toLowerCase().trim() : "";

  // 1. Try matching FIFA code
  if (tCode && FIFA_TO_ISO[tCode]) {
    return `https://flagcdn.com/w80/${FIFA_TO_ISO[tCode]}.png`;
  }

  // 2. Try matching name exact parts
  for (const [key, iso] of Object.entries(NAME_TO_ISO)) {
    if (name.includes(key)) {
      return `https://flagcdn.com/w80/${iso}.png`;
    }
  }

  // 3. Fallback to basic ISO two-letter check
  if (tCode.length === 2) {
    return `https://flagcdn.com/w80/${tCode}.png`;
  }

  return "https://flagcdn.com/w80/un.png";
}

// Map common world cup countries to flags automatically to keep the UI beautiful
function getFlag(team: string): string {
  if (!team) return "🏳️";
  const name = team.toLowerCase().trim();

  // If it matches a FIFA code directly
  if (name.length === 3 && FIFA_TO_ISO[name]) {
    return getFlagEmoji(FIFA_TO_ISO[name]);
  }

  // Try matching by name
  for (const [key, code] of Object.entries(NAME_TO_ISO)) {
    if (name.includes(key)) {
      return getFlagEmoji(code);
    }
  }

  return "🏳️";
}

function getTodayDateString(): string {
  const d = new Date();
  const options = { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" } as const;
  const formatter = new Intl.DateTimeFormat("en-CA", options); // 'en-CA' gives YYYY-MM-DD
  return formatter.format(d);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const justDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const parts = justDate.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const [year, month, day] = parts;
      // Use explicit UTC and safe hour of 12:00 to prevent local timezone shifts in formatting
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      return date.toLocaleDateString("en-NG", {
        timeZone: "Africa/Lagos",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-NG", {
        timeZone: "Africa/Lagos",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const justDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const parts = justDate.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const [year, month, day] = parts;
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      return date.toLocaleDateString("en-NG", {
        timeZone: "Africa/Lagos",
        month: "short",
        day: "numeric"
      });
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-NG", {
        timeZone: "Africa/Lagos",
        month: "short",
        day: "numeric"
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function getDisplayStatusText(raw: string): string {
  if (!raw) return "FT";
  const upper = raw.toUpperCase().trim();
  if (upper === "FT" || upper === "FINISHED" || upper === "STATUS_FINAL") return "FT";
  if (upper === "AET") return "AET";
  if (upper === "PEN") return "PEN";
  return upper;
}


interface PlayerInfo {
  number: string | number;
  name: string;
  position: string;
}

const getPlayersList = (teamObj: any): PlayerInfo[] => {
  if (!teamObj) return [];
  const list = teamObj.lineup || teamObj.starters || teamObj.players || [];
  if (!Array.isArray(list)) return [];
  return list.map((p: any) => {
    const num = p.number ?? p.jersey ?? p.jersey_number ?? p.shirt ?? p.shirt_number ?? "";
    const name = p.name ?? p.player_name ?? p.player ?? "";
    const position = p.position ?? p.pos ?? p.role ?? "";
    return { number: num, name, position };
  });
};

const getPositionBadge = (pos: string) => {
  const normalized = (pos || "").toUpperCase();
  if (normalized.includes("GK") || normalized.includes("GOA")) {
    return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
  }
  if (normalized.includes("DEF") || normalized.includes("BACK")) {
    return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
  }
  if (normalized.includes("MID") || normalized.includes("CEN") || normalized.includes("HALF")) {
    return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
  }
  if (normalized.includes("FWD") || normalized.includes("ATT") || normalized.includes("STR") || normalized.includes("FOR")) {
    return "bg-red-500/20 text-red-400 border border-red-500/30";
  }
  return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
};

const renderPredictionBar = (title: string, pred: any) => {
  const home = Number(pred?.home_win ?? pred?.homeWin ?? pred?.home ?? 0);
  const draw = Number(pred?.draw ?? 0);
  const away = Number(pred?.away_win ?? pred?.awayWin ?? pred?.away ?? 0);
  const total = (home + draw + away) || 100;
  
  const homePct = Math.round((home / total) * 100);
  const drawPct = Math.round((draw / total) * 100);
  const awayPct = 100 - homePct - drawPct;

  return (
    <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
      <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">{title}</span>
      <div className="h-5 rounded-lg overflow-hidden flex text-[10px] font-mono font-bold text-white shadow-2xs">
        {homePct > 0 && (
          <div 
            className="h-full bg-brand-primary flex items-center justify-center transition-all duration-300" 
            style={{ width: `${homePct}%` }}
            title={`Home Win: ${homePct}%`}
          >
            {homePct >= 15 ? `${homePct}%` : ""}
          </div>
        )}
        {drawPct > 0 && (
          <div 
            className="h-full bg-slate-400 flex items-center justify-center transition-all duration-300" 
            style={{ width: `${drawPct}%` }}
            title={`Draw: ${drawPct}%`}
          >
            {drawPct >= 15 ? `${drawPct}%` : ""}
          </div>
        )}
        {awayPct > 0 && (
          <div 
            className="h-full bg-rose-500 flex items-center justify-center transition-all duration-300" 
            style={{ width: `${awayPct}%` }}
            title={`Away Win: ${awayPct}%`}
          >
            {awayPct >= 15 ? `${awayPct}%` : ""}
          </div>
        )}
      </div>
      <div className="flex justify-between text-[9px] font-mono text-brand-text-secondary font-semibold px-0.5">
        <span>HOME</span>
        <span>DRAW</span>
        <span>AWAY</span>
      </div>
    </div>
  );
};

const CollapsibleResultCardLineups = ({ matchId }: { matchId: string }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const toggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!expanded && !data) {
      setLoading(true);
      try {
        const url = `/api/lineups?match_id=${matchId}`;
        const res = await fetch(url);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch lineups for card", err);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  const lineupsAvailable = data && (data.lineups_available === true || data.lineups_available === "true" || data.hasLineups === true);

  return (
    <div className="mt-2 border-t border-brand-border/40 pt-2" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={toggleExpand}
        className="flex items-center gap-1.5 text-[10px] font-bold text-brand-primary hover:text-brand-primary-hover tracking-wide uppercase transition cursor-pointer"
      >
        <span>📋</span>
        <span>{expanded ? "Hide Lineups ▲" : "Show Lineups ▼"}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-4 space-x-2">
              <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-mono text-brand-text-secondary animate-pulse">Loading lineups...</span>
            </div>
          )}

          {!loading && !lineupsAvailable && (
            <div className="p-3 border border-brand-border rounded-xl bg-brand-bg text-center text-brand-text-secondary text-[10px] font-mono">
              Lineups not yet announced
            </div>
          )}

          {!loading && lineupsAvailable && (
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              {/* Home Lineup */}
              <div className="bg-brand-bg border border-brand-border p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-1 gap-1">
                  <span className="font-bold text-brand-text-primary truncate">{data.home?.team}</span>
                  {data.home?.formation && (
                    <span className="text-[8px] px-1 bg-brand-primary/10 text-brand-primary rounded font-mono font-bold">
                      {data.home.formation}
                    </span>
                  )}
                </div>
                <div className="space-y-1 font-mono text-[10px]">
                  {getPlayersList(data.home).slice(0, 11).map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-1">
                      <span className="text-brand-text-secondary truncate max-w-[80px]">
                        {p.number}. {p.name}
                      </span>
                      {p.position && (
                        <span className="text-[7px] bg-brand-border text-brand-text-secondary px-1 rounded uppercase scale-90">
                          {p.position.substring(0, 2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Away Lineup */}
              <div className="bg-brand-bg border border-brand-border p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-1 gap-1">
                  <span className="font-bold text-brand-text-primary truncate">{data.away?.team}</span>
                  {data.away?.formation && (
                    <span className="text-[8px] px-1 bg-brand-primary/10 text-brand-primary rounded font-mono font-bold">
                      {data.away.formation}
                    </span>
                  )}
                </div>
                <div className="space-y-1 font-mono text-[10px]">
                  {getPlayersList(data.away).slice(0, 11).map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-1">
                      <span className="text-brand-text-secondary truncate max-w-[80px]">
                        {p.number}. {p.name}
                      </span>
                      {p.position && (
                        <span className="text-[7px] bg-brand-border text-brand-text-secondary px-1 rounded uppercase scale-90">
                          {p.position.substring(0, 2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(Auth.isLoggedIn());
  const [currentUser, setCurrentUser] = useState<any>(Auth.getUser());

  // Modal & form states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authFormLoading, setAuthFormLoading] = useState(false);

  // Expose global modal control functions on window scope
  useEffect(() => {
    (window as any).openAuthModal = () => {
      setAuthModalOpen(true);
      setAuthError(null);
    };
    (window as any).closeAuthModal = () => {
      setAuthModalOpen(false);
      setAuthError(null);
    };
    return () => {
      delete (window as any).openAuthModal;
      delete (window as any).closeAuthModal;
    };
  }, []);

  const handleLogout = () => {
    Auth.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>, type: 'login' | 'signup') => {
    e.preventDefault();
    setAuthError(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string || '').trim();
    const password = formData.get('password') as string || '';

    if (type === 'signup') {
      const name = (formData.get('name') as string || '').trim();
      const confirmPassword = formData.get('confirmPassword') as string || '';

      if (name.length < 2) {
        setAuthError("Full Name must be at least 2 characters");
        return;
      }
      if (!email.includes("@")) {
        setAuthError("Please enter a valid email address");
        return;
      }
      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        setAuthError("Passwords do not match");
        return;
      }

      setAuthFormLoading(true);
      try {
        const response = await fetch(`/api/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name, email, password, confirmPassword })
        });

        const data = await response.json();

        if (!response.ok) {
          setAuthError(data.error || "Failed to sign up");
          setAuthFormLoading(false);
          return;
        }

        // Success!
        Auth.login(data.token, data.user);
        setIsLoggedIn(true);
        setCurrentUser(data.user);

        // Reset modal and forms
        setAuthModalOpen(false);
        setAuthTab('login');
        setAuthError(null);
        e.currentTarget.reset();
      } catch (err: any) {
        setAuthError(err.message || "An unexpected error occurred");
      } finally {
        setAuthFormLoading(false);
      }
    } else {
      if (!email || !password) {
        setAuthError("Email and password are required");
        return;
      }

      setAuthFormLoading(true);
      try {
        const response = await fetch(`/api/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          setAuthError(data.error || "Failed to sign in");
          setAuthFormLoading(false);
          return;
        }

        // Success!
        Auth.login(data.token, data.user);
        setIsLoggedIn(true);
        setCurrentUser(data.user);

        // Reset modal and forms
        setAuthModalOpen(false);
        setAuthTab('login');
        setAuthError(null);
        e.currentTarget.reset();
      } catch (err: any) {
        setAuthError(err.message || "An unexpected error occurred");
      } finally {
        setAuthFormLoading(false);
      }
    }
  };

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMatchPage, setSelectedMatchPage] = useState<Match | null>(null);
  const selectedMatch = selectedMatchPage;
  const setSelectedMatch = setSelectedMatchPage;
  const [isFallbackMatches, setIsFallbackMatches] = useState(false);
  const [apiErrorMsg, setApiErrorMsg] = useState<string | null>(null);

  // Lineups states
  const [lineups, setLineups] = useState<any>(null);
  const [lineupsLoading, setLineupsLoading] = useState(false);
  const [lineupsSectionExpanded, setLineupsSectionExpanded] = useState(false);
  const [detailTab, setDetailTab] = useState<'events' | 'leaders' | 'lineups'>('events');
  const drawerTab = detailTab;
  const setDrawerTab = setDetailTab;
  const [benchExpanded, setBenchExpanded] = useState(false);
  const [substitutesHover, setSubstitutesHover] = useState(false);

  // Combined prediction states
  const [combinedPrediction, setCombinedPrediction] = useState<any>(null);
  const [combinedLoading, setCombinedLoading] = useState(false);
  const [combinedError, setCombinedError] = useState<string | null>(null);

  // Match events states
  const [matchEvents, setMatchEvents] = useState<any>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Results tab states
  const [resultsMatches, setResultsMatches] = useState<Match[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [hasFetchedResults, setHasFetchedResults] = useState(false);

  const [allResults, setAllResults] = useState<Match[]>([]);
  const [allResultsLoading, setAllResultsLoading] = useState(false);
  const [allResultsError, setAllResultsError] = useState<string | null>(null);
  const [allResultsFetched, setAllResultsFetched] = useState(false);
  const [allResultsSelectedDate, setAllResultsSelectedDate] = useState<string | null>(null);
  
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  
  // PredictScore predictions state
  const [predictions, setPredictions] = useState<Record<string, { home: number; away: number }>>(() => {
    try {
      const saved = localStorage.getItem("predictscore_predictions");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [myResult, setMyResult] = useState<any>(null);

  useEffect(() => {
    setMyResult(null);
    const user = currentUser;
    if (selectedMatchPage && selectedMatchPage.status === "FINISHED" && user) {
      const fetchMyResult = async () => {
        try {
          const { data } = await supabase
            .from('prediction_results')
            .select('*')
            .eq('match_id', selectedMatchPage.id)
            .eq('user_id', user.id)
            .single();
          if (data) setMyResult(data);
        } catch (e) {
          console.error("Failed to fetch myResult:", e);
        }
      };
      fetchMyResult();
    }
  }, [selectedMatchPage, currentUser]);

  const savePrediction = async (matchId: string, home: number, away: number) => {
    const updated = { ...predictions, [matchId]: { home, away } };
    setPredictions(updated);
    localStorage.setItem('predictscore_predictions', JSON.stringify(updated));

    const user = currentUser;
    if (!user) return; // Only save to DB if logged in

    try {
      await supabase.from('user_predictions').upsert({
        user_id:    user.id,
        user_email: user.email,
        match_id:   matchId,
        home_team:  selectedMatchPage?.homeTeam || '',
        away_team:  selectedMatchPage?.awayTeam || '',
        pred_home:  home,
        pred_away:  away,
        match_date: selectedMatchPage?.date || '',
      }, { onConflict: 'user_id,match_id' });
    } catch (e) {
      console.error('Failed to save prediction to DB', e);
    }
  };

  const removePrediction = (matchId: string) => {
    const updated = { ...predictions };
    delete updated[matchId];
    setPredictions(updated);
    localStorage.setItem("predictscore_predictions", JSON.stringify(updated));
  };

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  const fetchLeaderboard = async () => {
    setLbLoading(true);
    try {
      const res = await fetch(
        'https://predict-score.app.n8n.cloud/webhook/leaderboard'
      );
      const data = await res.json();
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLbLoading(false);
    }
  };

  const fetchFixtures = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = "https://predict-score.app.n8n.cloud/webhook/world-cup-fixtures";
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Tournament status query code: ${response.status}`);
      }
      
      const responseText = await response.text();
      if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response received from the tournament feed.");
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (jsonParseErr: any) {
        throw new Error(`Invalid JSON format returned: ${jsonParseErr.message}`);
      }
      
      console.log("Webhook response data:", data);

      let rawMatches: any[] = [];
      let errorMsg: string | null = null;

      if (data && typeof data === "object" && !Array.isArray(data) && "matches" in data) {
        errorMsg = data.errorMsg || null;
        if (Array.isArray(data.matches)) {
          rawMatches = data.matches;
        }
      } else if (Array.isArray(data)) {
        rawMatches = data;
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.matches)) {
          rawMatches = data.matches;
        } else if (Array.isArray(data.fixtures)) {
          rawMatches = data.fixtures;
        } else if (Array.isArray(data.data)) {
          rawMatches = data.data;
        }
      }

      if (rawMatches.length === 0) {
        throw new Error("No active match fixtures returned from tournament feed.");
      }

      setIsFallbackMatches(false);
      setApiErrorMsg(errorMsg);

      const statusMap: Record<string, string> = {
        'STATUS_IN_PROGRESS': 'LIVE',
        'STATUS_HALFTIME':    'LIVE',
        'STATUS_SCHEDULED':   'UPCOMING',
        'STATUS_POSTPONED':   'UPCOMING',
        'STATUS_FINAL':       'FINISHED',
        'LIVE':               'LIVE',
        'UPCOMING':           'UPCOMING',
        'FINISHED':           'FINISHED',
        'FT':                 'FINISHED',
        'AET':                'FINISHED',
        'PEN':                'FINISHED',
      };

      const parsedMatches: Match[] = rawMatches.map((item: any, idx: number) => {
        const homeTeam = item.homeTeam || item.home_team || "Home Team";
        const awayTeam = item.awayTeam || item.away_team || "Away Team";
        const rawStatus = item.status || 'UPCOMING';
        const minute = item.minute ? Number(item.minute) : undefined;

        let status = (statusMap[rawStatus] || 'UPCOMING') as "UPCOMING" | "LIVE" | "FINISHED";

        if (status === "UPCOMING" && minute && minute > 0 && minute <= 90) {
          status = "LIVE";
        }

        return {
          id:            String(item.id || item.match_id || `match-${idx}`),
          homeTeam,
          homeTeamCode:  item.homeTeamCode || homeTeam.substring(0, 3).toUpperCase(),
          homeTeamFlag:  item.homeTeamFlag || getFlag(homeTeam),
          awayTeam,
          awayTeamCode:  item.awayTeamCode || awayTeam.substring(0, 3).toUpperCase(),
          awayTeamFlag:  item.awayTeamFlag || getFlag(awayTeam),
          homeScore:     Number(item.homeScore ?? item.home_score ?? 0),
          awayScore:     Number(item.awayScore ?? item.away_score ?? 0),
          status,
          rawStatus,
          minute,
          group:         item.group  || item.stage || "Group Stage",
          stadium:       item.venue  || item.stadium || "FIFA World Cup Stadium",
          date:          item.date   || getTodayDateString(),
          time:          item.time   || "",
          stage:         item.stage  || "Group Stage",
          events:        Array.isArray(item.events) ? item.events : []
        };
      });

      setMatches(parsedMatches);

      if (parsedMatches.length > 0) {
        const todayStr = getTodayDateString();
        const hasTodayMatches = parsedMatches.some(m => m.date === todayStr);
        if (!hasTodayMatches) {
          setSelectedDate(parsedMatches[0].date);
        }
      }

      if (selectedMatchPage) {
        const updated = parsedMatches.find(m => m.id === selectedMatchPage.id);
        if (updated) setSelectedMatchPage(updated);
      }
    } catch (err: any) {
      console.warn("Error fetching fixtures:", err);
      setError("Unable to load fixtures right now. Please refresh the page.");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllResults = async () => {
    setAllResultsLoading(true);
    setAllResultsError(null);
    try {
      let data;
      try {
        console.log("Fetching all results from server proxy...");
        const res = await fetch("/api/results");
        if (!res.ok) {
          throw new Error(`Proxy results response status: ${res.status}`);
        }
        const payload = await res.json();
        // Check if the proxy payload matches the expected structure
        if (payload && payload.matches) {
          data = payload.matches;
        } else {
          data = payload;
        }
      } catch (proxyErr) {
        console.warn("Proxy fetch failed, attempting direct Supabase request...", proxyErr);
        const SUPABASE_URL = "https://iewnlzrzdtuxykgitmft.supabase.co";
        const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "your-supabase-anon-key";

        if (!SUPABASE_KEY || SUPABASE_KEY === "your-supabase-anon-key") {
          throw new Error("Supabase API key is missing or default.");
        } else {
          try {
            const res = await fetch(
              `${SUPABASE_URL}/rest/v1/wc_all_results?order=date.desc`,
              {
                headers: {
                  apikey: SUPABASE_KEY,
                  Authorization: `Bearer ${SUPABASE_KEY}`,
                  Accept: "application/json",
                }
              }
            );

            if (!res.ok) {
              const errText = await res.text();
              throw new Error(`Supabase error ${res.status}: ${errText}`);
            }

            data = await res.json();
          } catch (directErr: any) {
            console.error("Direct Supabase fetch failed:", directErr);
            throw directErr;
          }
        }
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format from Supabase");
      }

      const mapped: Match[] = data.map((item: any) => {
        const homeTeam = item.home_team || item.homeTeam || "Home Team";
        const awayTeam = item.away_team || item.awayTeam || "Away Team";
        return {
          id:            String(item.match_id || item.id || Math.random()),
          homeTeam,
          homeTeamCode:  item.home_team_code || item.homeTeamCode || homeTeam.substring(0, 3).toUpperCase(),
          homeTeamFlag:  getFlag(homeTeam),
          awayTeam,
          awayTeamCode:  item.away_team_code || item.awayTeamCode || awayTeam.substring(0, 3).toUpperCase(),
          awayTeamFlag:  getFlag(awayTeam),
          homeScore:     Number(item.home_score ?? item.homeScore ?? 0),
          awayScore:     Number(item.away_score ?? item.awayScore ?? 0),
          status:        "FINISHED" as const,
          rawStatus:     "FINISHED",
          minute:        undefined,
          group:         item.group_name || item.group || "Group Stage",
          stadium:       item.stadium    || "",
          date:          item.date       || "",
          time:          "",
          stage:         item.stage      || "Group Stage",
          events:        [],
        };
      });

      setAllResults(mapped);
      setAllResultsFetched(true);
    } catch (err: any) {
      console.error("fetchAllResults error:", err);
      setAllResultsError(
        `Could not load results: ${err.message || "Unknown error"}`
      );
    } finally {
      setAllResultsLoading(false);
    }
  };

  const fetchResults = async () => {
    setResultsLoading(true);
    setResultsError(null);
    try {
      let response;
      try {
        response = await fetch("/api/results");
        if (!response.ok) {
          throw new Error(`Proxy results response status: ${response.status}`);
        }
      } catch (proxyErr) {
        console.log("Proxy results endpoint fetch status: offline-mode, trying direct Supabase REST endpoint", proxyErr);
        const url = "https://iewnlzrzdtuxykgitmft.supabase.co/rest/v1/wc_all_results?order=date.desc";
        const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "your-supabase-anon-key";

        if (!anonKey || anonKey === "your-supabase-anon-key") {
          throw new Error("Supabase API key is missing or default.");
        } else {
          try {
            response = await fetch(url, {
              headers: {
                "Accept": "application/json",
                "apikey": anonKey,
                "Authorization": `Bearer ${anonKey}`
              }
            });
          } catch (directErr) {
            console.error("Direct Supabase fetch failed:", directErr);
            throw directErr;
          }
        }
      }

      if (!response.ok) {
        throw new Error(`Results query code: ${response.status}`);
      }

      const data = await response.json();
      console.log("Webhook results response data:", data);

      let rawMatches: any[] = [];
      if (data && typeof data === "object" && !Array.isArray(data) && "matches" in data) {
        if (Array.isArray(data.matches)) {
          rawMatches = data.matches;
        }
      } else if (Array.isArray(data)) {
        rawMatches = data;
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.matches)) {
          rawMatches = data.matches;
        } else if (Array.isArray(data.fixtures)) {
          rawMatches = data.fixtures;
        } else if (Array.isArray(data.data)) {
          rawMatches = data.data;
        }
      } else {
        throw new Error("Invalid response format. Expected an array of results.");
      }

      const statusMap: Record<string, string> = {
        'STATUS_IN_PROGRESS': 'LIVE',
        'STATUS_HALFTIME':    'LIVE',
        'STATUS_SCHEDULED':   'UPCOMING',
        'STATUS_POSTPONED':   'UPCOMING',
        'STATUS_FINAL':       'FINISHED',
        'LIVE':               'LIVE',
        'UPCOMING':           'UPCOMING',
        'FINISHED':           'FINISHED',
        'FT':                 'FINISHED',
        'AET':                'FINISHED',
        'PEN':                'FINISHED',
      };

      const parsedResults: Match[] = rawMatches.map((item: any, idx: number) => {
        const homeTeam = item.homeTeam || item.home_team || "Home Team";
        const awayTeam = item.awayTeam || item.away_team || "Away Team";
        const rawStatus = item.status || 'FINISHED';

        return {
          id:            String(item.id || item.match_id || `result-${idx}`),
          homeTeam,
          homeTeamCode:  item.homeTeamCode || homeTeam.substring(0, 3).toUpperCase(),
          homeTeamFlag:  item.homeTeamFlag || getFlag(homeTeam),
          awayTeam,
          awayTeamCode:  item.awayTeamCode || awayTeam.substring(0, 3).toUpperCase(),
          awayTeamFlag:  item.awayTeamFlag || getFlag(awayTeam),
          homeScore:     Number(item.homeScore ?? item.home_score ?? 0),
          awayScore:     Number(item.awayScore ?? item.away_score ?? 0),
          status:        (statusMap[rawStatus] || 'FINISHED') as "UPCOMING" | "LIVE" | "FINISHED",
          rawStatus,
          minute:        item.minute ? Number(item.minute) : undefined,
          group:         item.group  || item.stage || "Group Stage",
          stadium:       item.venue  || item.stadium || "FIFA World Cup Stadium",
          date:          item.date   || getTodayDateString(),
          time:          item.time   || "",
          stage:         item.stage  || "Group Stage",
          events:        Array.isArray(item.events) ? item.events : []
        };
      });

      // Show the most recent matches at the top (sorted by date/time descending)
      parsedResults.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
        const dateB = new Date(`${b.date}T${b.time || "00:00"}`).getTime();
        return dateB - dateA;
      });

      setResultsMatches(parsedResults);
      setHasFetchedResults(true);

      // Keep details overlay updated if currently open
      if (selectedMatchPage) {
        const updated = parsedResults.find(m => m.id === selectedMatchPage.id);
        if (updated) setSelectedMatchPage(updated);
      }
    } catch (err: any) {
      console.log("Error fetching results:", err);
      setResultsError(err.message || "An unexpected error occurred while fetching match results.");
    } finally {
      setResultsLoading(false);
    }
  };

  const fetchPrediction = async (homeTeam: string, awayTeam: string) => {
    setPrediction(null);
    setPredictionError(null);
    setPredictionLoading(true);
    try {
      const url = `/api/predict?home_team=${encodeURIComponent(homeTeam)}&away_team=${encodeURIComponent(awayTeam)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Prediction fetch failed");
      const data = await res.json();
      setPrediction(normalizePrediction(data));
    } catch (err: any) {
      setPredictionError("Could not load prediction. Please try again.");
    } finally {
      setPredictionLoading(false);
    }
  };

  const fetchCombinedPrediction = async (matchId: string, homeTeam: string, awayTeam: string) => {
    setCombinedPrediction(null);
    setCombinedError(null);
    setCombinedLoading(true);
    try {
      const url = `/api/predict-combined?match_id=${matchId}&home_team=${encodeURIComponent(homeTeam)}&away_team=${encodeURIComponent(awayTeam)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch combined prediction");
      const data = await res.json();
      setCombinedPrediction(data);
    } catch (err: any) {
      console.error("Combined prediction fetch failed:", err);
      setCombinedError("Could not load combined AI analysis.");
    } finally {
      setCombinedLoading(false);
    }
  };

  const fetchMatchEvents = async (matchId: string, matchDate: string) => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const dateFormatted = matchDate.replace(/-/g, '').substring(0, 8);
      const url = `https://predict-score.app.n8n.cloud/webhook/match-events?match_id=${matchId}&date=${dateFormatted}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch match events');
      const data = await res.json();
      setMatchEvents(data);
    } catch (err: any) {
      setEventsError('Could not load match events.');
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchLineups = async (
    matchId: string,
    homeTeam: string,
    awayTeam: string,
    matchDate: string
  ) => {
    setLineupsLoading(true);
    try {
      const url = `/api/lineups` +
        `?match_id=${matchId}` +
        `&home_team=${encodeURIComponent(homeTeam)}` +
        `&away_team=${encodeURIComponent(awayTeam)}` +
        `&match_date=${matchDate}`;
      const res = await fetch(url);
      const data = await res.json();
      setLineups(data);
    } catch (e) {
      console.error('Lineups fetch failed', e);
    } finally {
      setLineupsLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures();
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "RESULTS" && !hasFetchedResults) {
      fetchResults();
    }
  };

  // Filter logic
  const matchDataset = activeTab === "RESULTS" ? resultsMatches : matches;

  const filteredMatches = matchDataset.filter((match) => {
    let matchesTab = false;
    if (activeTab === "RESULTS") {
      matchesTab = true;
    } else if (activeTab === "ALL") {
      // Today's Match - only matches scheduled to hold that particular day
      matchesTab = match.date === selectedDate;
    } else if (activeTab === "LIVE") {
      matchesTab = match.status === "LIVE";
    } else if (activeTab === "UPCOMING") {
      // Upcoming should show all matches with status === "UPCOMING"
      matchesTab = match.status === "UPCOMING";
    } else if (activeTab === "FINISHED") {
      // Completed should show all completed matches played in the tournament
      // A match is considered completed if its status is any of the following: FT, AET, PEN or FINISHED
      matchesTab = match.status === "FINISHED" || ["FT", "AET", "PEN", "FINISHED", "STATUS_FINAL"].includes(match.rawStatus);
    }
    
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !query ||
      match.homeTeam.toLowerCase().includes(query) ||
      match.awayTeam.toLowerCase().includes(query) ||
      match.homeTeamCode.toLowerCase().includes(query) ||
      match.awayTeamCode.toLowerCase().includes(query) ||
      match.group.toLowerCase().includes(query) ||
      match.stadium.toLowerCase().includes(query) ||
      match.stage.toLowerCase().includes(query);

    return matchesTab && matchesSearch;
  });

  // Sort completed matches by date, with the most recently completed matches appearing first.
  if (activeTab === "FINISHED" || activeTab === "RESULTS") {
    filteredMatches.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || "00:00"}`).getTime();
      return dateB - dateA;
    });
  }

  const displayMatches = activeTab === "ALL_RESULTS"
    ? allResults.filter((match) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = 
          !query ||
          (match.homeTeam || "").toLowerCase().includes(query) ||
          (match.awayTeam || "").toLowerCase().includes(query) ||
          (match.homeTeamCode || "").toLowerCase().includes(query) ||
          (match.awayTeamCode || "").toLowerCase().includes(query) ||
          (match.group || "").toLowerCase().includes(query) ||
          (match.stadium || "").toLowerCase().includes(query) ||
          (match.stage || "").toLowerCase().includes(query);

        const matchJustDate = (match.date || "").includes("T") ? match.date.split("T")[0] : (match.date || "");
        const matchesDate = !allResultsSelectedDate || matchJustDate === allResultsSelectedDate;

        return matchesSearch && matchesDate;
      })
    : filteredMatches;

  const renderMatchCard = (match: Match) => {
    const isLive = match.status === "LIVE";
    const isFinished = match.status === "FINISHED";
    const isUpcoming = match.status === "UPCOMING";
    
    return (
      <motion.div
        key={match.id}
        layoutId={`match-card-${match.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        onClick={() => {
          setSelectedMatchPage(match);
          if (activeTab !== "ALL_RESULTS") {
            fetchPrediction(match.homeTeam, match.awayTeam);
          }
          if (match.status === "UPCOMING") {
            fetchCombinedPrediction(match.id, match.homeTeam, match.awayTeam);
          }
          setMatchEvents(null);
          setLineups(null);
          setLineupsSectionExpanded(false);
          setDetailTab('events');
          fetchMatchEvents(match.id, match.date);
          fetchLineups(match.id, match.homeTeam, match.awayTeam, match.date);
        }}
        className={`group border rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden shadow-xs relative bg-brand-surface hover:bg-brand-primary/5 ${
          isLive 
            ? "border-brand-error/40 ring-1 ring-brand-error/20 hover:border-brand-error/60" 
            : selectedMatchPage?.id === match.id
            ? "border-brand-primary ring-2 ring-brand-primary/20"
            : "border-brand-border hover:border-brand-primary/30"
        }`}
      >
        {/* Match Stage/Group Info Header */}
        <div className="px-4 py-2.5 border-b border-brand-border flex items-center justify-between text-[11px] font-mono text-brand-text-secondary bg-brand-bg">
          <div className="flex items-center space-x-2">
            <span className="text-brand-primary font-bold uppercase tracking-[1px]">{match.stage}</span>
            <span className="text-brand-border">•</span>
            <span className="text-brand-text-secondary font-semibold">{match.group}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-brand-text-secondary">
            <MapPin className="w-3.5 h-3.5 text-brand-text-secondary" />
            <span className="truncate max-w-[150px] sm:max-w-none">{match.stadium.split(",")[0]}</span>
          </div>
        </div>

        {/* Teams & Scores Banner */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex-1 flex items-center justify-end space-x-3 text-right">
            <span className="font-display font-bold text-sm sm:text-base hidden sm:inline group-hover:text-brand-primary text-brand-text-primary transition">
              {match.homeTeam}
            </span>
            <span className="font-display font-extrabold text-sm sm:hidden group-hover:text-brand-primary text-brand-text-primary transition">
              {match.homeTeamCode}
            </span>
            <img 
              src={getFlagUrl(match.homeTeam, match.homeTeamCode)} 
              alt={`${match.homeTeam} flag`} 
              className="w-8 h-5.5 sm:w-10 sm:h-7 object-cover rounded-md shadow-sm border border-brand-border shrink-0 filter drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Score / Time Badge */}
          <div className="flex flex-col items-center justify-center min-w-[70px] sm:min-w-[100px] shrink-0">
            {isLive ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center space-x-2 bg-brand-error border-none px-3 py-1 rounded-full text-white font-mono font-black text-sm sm:text-base tracking-widest shadow-xs">
                  <span>{match.homeScore}</span>
                  <span className="text-white/60">:</span>
                  <span>{match.awayScore}</span>
                </div>
                <span className="flex items-center text-[10px] text-brand-error font-extrabold mt-1.5 tracking-wider uppercase font-mono bg-brand-error/20 border border-brand-error/30 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-error mr-1 animate-ping"></span>
                  Live • {match.minute}'
                </span>
              </div>
            ) : isFinished ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center space-x-2 bg-brand-border border border-brand-border px-3 py-1 rounded-full text-brand-text-secondary font-mono font-bold text-sm sm:text-base">
                  <span>{match.homeScore}</span>
                  <span className="text-brand-text-secondary/80">:</span>
                  <span>{match.awayScore}</span>
                </div>
                <span className="text-[9px] text-brand-primary font-bold mt-1.5 tracking-wider uppercase bg-brand-primary/10 border border-brand-primary/35 px-2 py-0.5 rounded">
                  {getDisplayStatusText(match.rawStatus)}
                </span>
                <span className="text-[9px] text-brand-text-secondary font-medium mt-1 font-mono text-center">
                  {formatDate(match.date)}
                  {match.time ? ` • ${match.time}` : ""}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-xs text-brand-primary font-mono bg-brand-primary/10 px-2.5 py-1 rounded-lg border border-brand-primary/20 font-bold">
                  {match.time}
                </div>
                <div className="text-[9px] text-brand-text-secondary mt-1.5 font-bold tracking-wide uppercase">
                  Scheduled
                </div>
              </div>
            )}
            
            {/* Prediction Badge */}
            {predictions[match.id] && (
              <span className="text-[9px] text-brand-primary font-bold mt-1.5 bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full flex items-center justify-center gap-0.5">
                🔮 {predictions[match.id].home}-{predictions[match.id].away}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex items-center justify-start space-x-3 text-left">
            <img 
              src={getFlagUrl(match.awayTeam, match.awayTeamCode)} 
              alt={`${match.awayTeam} flag`} 
              className="w-8 h-5.5 sm:w-10 sm:h-7 object-cover rounded-md shadow-sm border border-brand-border shrink-0 filter drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
            <span className="font-display font-bold text-sm sm:text-base hidden sm:inline group-hover:text-brand-primary text-brand-text-primary transition">
              {match.awayTeam}
            </span>
            <span className="font-display font-extrabold text-sm sm:hidden group-hover:text-brand-primary text-brand-text-primary transition">
              {match.awayTeamCode}
            </span>
          </div>
        </div>

        {/* Timeline Events Preview on Card */}
        {match.events && match.events.length > 0 && (
          <div className="px-4 py-2 border-t border-brand-border bg-brand-bg text-[10px] text-brand-text-secondary flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-brand-text-secondary/60 uppercase font-black text-[9px] tracking-wider">Events:</span>
            {match.events.slice(-3).map((evt, idx) => (
              <span key={idx} className="flex items-center gap-1 bg-brand-surface border border-brand-border px-1.5 py-0.5 rounded font-mono text-brand-text-secondary font-medium">
                <span>{evt.minute}'</span>
                <span>{evt.type === "goal" ? "⚽" : evt.type === "card" ? "🟨" : "ℹ️"}</span>
                <span className="text-brand-text-primary font-semibold max-w-[80px] sm:max-w-[120px] truncate">{evt.player}</span>
              </span>
            ))}
            {match.events.length > 3 && (
              <span className="text-[9px] text-brand-primary font-bold font-mono">+{match.events.length - 3} more</span>
            )}
          </div>
        )}

        {/* All Results Lineups section */}
        {activeTab === "ALL_RESULTS" && (
          <div className="px-4 pb-3 border-t border-brand-border bg-brand-bg">
            <CollapsibleResultCardLineups matchId={match.id} />
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary font-sans selection:bg-brand-primary selection:text-brand-bg">
      {/* Top Header */}
      <header className="bg-brand-primary border-b border-brand-primary-hover/30 text-white sticky top-0 z-40 px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex items-center">
              <img 
                src={predictScoreLogo} 
                alt="PredictScore Logo" 
                className="h-20 sm:h-24 w-auto object-contain shrink-0" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col gap-1 sm:border-l sm:border-white/20 sm:pl-5">
              <p className="text-[11px] text-white/95 font-medium">World Cup 2026™ Real-Time Fixtures & predictions</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div id="auth-header-area" className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedMatchPage(null);
                  setActiveTab("LEADERBOARD");
                  fetchLeaderboard();
                }}
                className={`text-xs text-white border border-white hover:bg-brand-primary-hover px-4 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${activeTab === "LEADERBOARD" ? "bg-brand-primary-hover" : ""}`}
              >
                🏆 Leaderboard
              </button>
              {!isLoggedIn ? (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-white hover:bg-brand-secondary text-brand-primary text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-sm"
                >
                  Sign In / Sign Up
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white">
                    Hello, <span>{currentUser?.username}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-white border border-white hover:bg-brand-primary-hover hover:border-brand-primary-hover px-4 py-2 rounded-xl font-bold transition cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic Feed Refresh button */}
            <button
              onClick={fetchFixtures}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-transparent border border-white text-white hover:bg-brand-primary-hover hover:border-brand-primary-hover text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Feed</span>
            </button>

            {activeTab === "ALL_RESULTS" && (
              <button
                onClick={fetchAllResults}
                disabled={allResultsLoading}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-transparent border border-white text-white hover:bg-brand-primary-hover hover:border-brand-primary-hover text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${allResultsLoading ? "animate-spin" : ""}`} />
                <span>Refresh Results</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {selectedMatchPage ? (
        <main className="max-w-3xl mx-auto px-4 py-6">
          <MatchDetailView
            match={selectedMatchPage}
            onBack={() => setSelectedMatchPage(null)}
            predictions={predictions}
            savePrediction={savePrediction}
            removePrediction={removePrediction}
            getFlagUrl={getFlagUrl}
            matchEvents={matchEvents}
            eventsLoading={eventsLoading}
            eventsError={eventsError}
            lineups={lineups}
            lineupsLoading={lineupsLoading}
            getPlayersList={getPlayersList}
            benchExpanded={benchExpanded}
            setBenchExpanded={setBenchExpanded}
            prediction={prediction}
            predictionLoading={predictionLoading}
            predictionError={predictionError}
            combinedPrediction={combinedPrediction}
            combinedLoading={combinedLoading}
            combinedError={combinedError}
            hideAIPrediction={activeTab === "ALL_RESULTS"}
            isLoggedIn={isLoggedIn}
            myResult={myResult}
          />
        </main>
      ) : (
        <>
          {/* Hero Section */}
          <div className="max-w-3xl mx-auto px-4 mt-6 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-brand-border/60 bg-[#090F1E] shadow-2xl">
              {/* Invisible placeholder image to maintain the exact responsive height of the first slide */}
              <img 
                src={worldCupHeroBanner} 
                alt="Placeholder" 
                className="w-full h-auto object-cover opacity-0 pointer-events-none"
                referrerPolicy="no-referrer"
              />
              {/* The actual slideshow absolutely positioned over the placeholder */}
              <div className="absolute inset-0 w-full h-full">
                <HeroSlideshow fallbackImage={worldCupHeroBanner} />
              </div>
            </div>
          </div>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:py-8">
        <div className="space-y-6">
          

          {/* Main Error/Fetch Failure State */}
          {error && (
            <div className="bg-brand-error/10 border border-brand-error/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start gap-4 shadow-sm">
              <div className="bg-brand-error/20 p-2.5 rounded-xl text-brand-error shrink-0">
                <AlertCircle className="w-6 h-6 text-brand-error" />
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-display font-bold text-sm sm:text-base text-brand-error">Connection Sync Failed</h4>
                <p className="text-xs text-brand-text-secondary font-medium leading-relaxed">
                  Could not retrieve tournament matches. Please verify your connection or try again later.
                </p>
                <code className="block bg-brand-bg border border-brand-border p-2.5 rounded-xl text-[10px] font-mono text-brand-error break-all">
                  {error}
                </code>
                <button
                  onClick={fetchFixtures}
                  className="bg-brand-error hover:bg-red-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Server Connection</span>
                </button>
              </div>
            </div>
          )}

          {/* Results Error/Fetch Failure State */}
          {activeTab === "RESULTS" && resultsError && (
            <div className="bg-brand-error/10 border border-brand-error/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start gap-4 shadow-sm">
              <div className="bg-brand-error/20 p-2.5 rounded-xl text-brand-error shrink-0">
                <AlertCircle className="w-6 h-6 text-brand-error" />
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-display font-bold text-sm sm:text-base text-brand-error">Results Sync Failed</h4>
                <p className="text-xs text-brand-text-secondary font-medium leading-relaxed">
                  Could not retrieve completed tournament results. Please verify your connection or try again later.
                </p>
                <code className="block bg-brand-bg border border-brand-border p-2.5 rounded-xl text-[10px] font-mono text-brand-error break-all">
                  {resultsError}
                </code>
                <button
                  onClick={fetchResults}
                  className="bg-brand-error hover:bg-red-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Results Connection</span>
                </button>
              </div>
            </div>
          )}

          {/* Control Bar: Filters & Search */}
          <div className="bg-brand-surface border border-brand-border shadow-xs p-4 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
              {/* Tabs */}
              <div className="flex p-1 bg-brand-bg rounded-xl border border-brand-border overflow-x-auto shrink-0">
                {(["ALL", "LIVE", "UPCOMING", "ALL_RESULTS"] as TabType[]).map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab as TabType);
                        if (tab === "ALL") {
                          setSelectedDate(getTodayDateString());
                        }
                        if (tab === "ALL_RESULTS" && !allResultsFetched) {
                          fetchAllResults();
                        }
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition cursor-pointer whitespace-nowrap ${
                        isActive 
                          ? "bg-brand-primary text-brand-bg shadow-sm font-bold" 
                          : "text-brand-text-secondary hover:text-brand-text-primary"
                      }`}
                    >
                      {tab === "LIVE" ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-error animate-pulse"></span>
                          Live ({matches.filter(m => m.status === "LIVE").length})
                        </span>
                      ) : tab === "UPCOMING" ? (
                        `Upcoming`
                      ) : tab === "ALL_RESULTS" ? (
                        `All Results (${allResults.length})`
                      ) : (
                        `Today's Match`
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Match Counter */}
              {activeTab !== "LEADERBOARD" && (
                <span className="text-xs text-brand-text-secondary font-mono self-center font-semibold">
                  {activeTab === "ALL_RESULTS" 
                    ? `Showing ${displayMatches.length} of ${allResults.length} matches`
                    : `Showing ${filteredMatches.length} of ${matches.length} matches`
                  }
                </span>
              )}
            </div>

            {/* Search Input & Calendar Picker */}
            {activeTab !== "LEADERBOARD" && (
              <div className="flex gap-2.5 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-secondary w-4 h-4" />
                <input
                  type="text"
                  placeholder="Filter matches by country, group, stadium..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm placeholder:text-brand-text-secondary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-brand-text-primary transition font-medium"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Calendar Selector */}
              {(activeTab === "ALL" || activeTab === "ALL_RESULTS") && (
                <div className="relative flex items-center justify-center h-[38px] px-3.5 rounded-xl bg-brand-bg border border-brand-border hover:border-brand-primary/40 transition cursor-pointer shrink-0 group">
                  <Calendar className="w-4.5 h-4.5 text-brand-primary group-hover:scale-105 transition" />
                  <span className="text-xs font-bold text-brand-text-primary ml-2 hidden sm:inline">
                    {activeTab === "ALL"
                      ? (selectedDate ? formatDate(selectedDate) : "Select Date")
                      : (allResultsSelectedDate ? formatDate(allResultsSelectedDate) : "All Dates")
                    }
                  </span>
                  <span className="text-xs font-bold text-brand-text-primary ml-2 sm:hidden">
                    {activeTab === "ALL"
                      ? (selectedDate ? selectedDate.substring(5) : "Select")
                      : (allResultsSelectedDate ? allResultsSelectedDate.substring(5) : "All")
                    }
                  </span>
                  <input 
                    type="date"
                    value={activeTab === "ALL" ? (selectedDate || "") : (allResultsSelectedDate || "")}
                    onChange={(e) => {
                      if (activeTab === "ALL") {
                        setSelectedDate(e.target.value || getTodayDateString());
                      } else {
                        setAllResultsSelectedDate(e.target.value || null);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              )}

              {/* Reset to Today Button */}
              {activeTab === "ALL" && selectedDate !== getTodayDateString() && (
                <button
                  onClick={() => setSelectedDate(getTodayDateString())}
                  title="Reset to Today"
                  className="flex items-center justify-center w-[38px] h-[38px] rounded-xl bg-brand-primary/15 border border-brand-primary/30 text-brand-primary hover:bg-brand-primary hover:text-brand-bg transition cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {activeTab === "ALL_RESULTS" && allResultsSelectedDate && (
                <button
                  onClick={() => setAllResultsSelectedDate(null)}
                  title="Clear Date Filter"
                  className="flex items-center justify-center w-[38px] h-[38px] rounded-xl bg-brand-primary/15 border border-brand-primary/30 text-brand-primary hover:bg-brand-primary hover:text-brand-bg transition cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            )}
          </div>

          {activeTab === "LEADERBOARD" ? (
            <div className="space-y-4">
              {/* Header Card */}
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 mb-4">
                <h2 className="font-display font-bold text-lg text-brand-text-primary">🏆 Prediction Leaderboard</h2>
                <p className="text-brand-text-secondary text-sm">Who's the best predictor at World Cup 2026?</p>
                
                {currentUser && (() => {
                  const userRankIndex = leaderboard.findIndex(item => item.user_id === currentUser.id);
                  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : null;
                  const userRankData = userRankIndex !== -1 ? leaderboard[userRankIndex] : null;
                  if (userRank !== null && userRankData) {
                    return (
                      <div className="bg-brand-primary/10 rounded-xl p-3 text-center mt-3 text-brand-text-primary text-sm font-semibold">
                        Your rank: #{userRank} · {userRankData.total_points ?? userRankData.points ?? 0} points · {userRankData.accuracy_pct ?? userRankData.accuracy ?? 0}% accuracy
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {lbLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="border border-brand-border rounded-2xl p-12 text-center bg-brand-surface shadow-xs space-y-4">
                  <div className="text-4xl">🏆</div>
                  <h3 className="font-bold text-brand-text-primary text-lg">No predictions yet</h3>
                  <p className="text-brand-text-secondary text-sm">Be the first to predict a match and claim the top spot!</p>
                  <button 
                    onClick={() => {
                      setActiveTab("ALL");
                      setSelectedDate(getTodayDateString());
                    }} 
                    className="bg-brand-primary hover:bg-[#009e4f] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm mx-auto block"
                  >
                    Make Your First Prediction
                  </button>
                </div>
              ) : (
                <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
                  {/* Table Header Row */}
                  <div className="bg-brand-secondary px-4 py-2 grid grid-cols-12 gap-2 text-brand-text-secondary text-xs font-semibold uppercase">
                    <div className="col-span-2">Rank</div>
                    <div className="col-span-5">Player</div>
                    <div className="col-span-2 text-center">Pts</div>
                    <div className="col-span-1 text-center">Exact</div>
                    <div className="col-span-2 text-right">Accuracy</div>
                  </div>

                  {/* Table Rows (Max 50) */}
                  <div className="divide-y divide-brand-border">
                    {leaderboard.slice(0, 50).map((item, idx) => {
                      const rank = idx + 1;
                      const emailVal = item.user_email || item.email || "";
                      const pointsVal = item.total_points ?? item.points ?? 0;
                      const exactVal = item.exact_scores ?? item.exact ?? 0;
                      const accuracyVal = item.accuracy_pct ?? item.accuracy ?? 0;
                      const isMe = currentUser && (item.user_id === currentUser.id || emailVal.toLowerCase() === currentUser.email?.toLowerCase());

                      const maskEmail = (emailStr: string) => {
                        if (!emailStr) return "";
                        const parts = emailStr.split("@");
                        if (parts.length < 2) return emailStr;
                        const usernameStr = parts[0];
                        const domainStr = parts[1];
                        const maskedUsername = usernameStr.length > 3 ? usernameStr.substring(0, 3) + "***" : usernameStr + "***";
                        return `${maskedUsername}@${domainStr}`;
                      };

                      return (
                        <div key={item.user_id || idx} className="px-4 py-3 grid grid-cols-12 gap-2 items-center hover:bg-brand-secondary/30 transition">
                          {/* Rank Column */}
                          <div className="col-span-2 flex items-center">
                            {rank === 1 ? (
                              <span className="text-xl" title="1st Place">🥇</span>
                            ) : rank === 2 ? (
                              <span className="text-xl" title="2nd Place">🥈</span>
                            ) : rank === 3 ? (
                              <span className="text-xl" title="3rd Place">🥉</span>
                            ) : (
                              <span className="text-brand-text-secondary font-bold text-sm ml-1">#{rank}</span>
                            )}
                          </div>

                          {/* Player Column */}
                          <div className="col-span-5 flex items-center space-x-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {emailVal ? emailVal[0].toUpperCase() : "U"}
                            </div>
                            <div className="min-w-0 flex items-center space-x-1.5">
                              <span className="text-sm font-semibold text-brand-text-primary truncate">
                                {maskEmail(emailVal)}
                              </span>
                              {isMe && (
                                <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-primary/20 shrink-0">
                                  You
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Points Column */}
                          <div className="col-span-2 text-center font-bold text-brand-text-primary text-sm">
                            {pointsVal}
                          </div>

                          {/* Exact Column */}
                          <div className="col-span-1 text-center text-brand-success text-sm font-semibold">
                            {exactVal} 🎯
                          </div>

                          {/* Accuracy Column */}
                          <div className="col-span-2 text-right">
                            <div className="text-brand-text-primary text-sm font-semibold">{accuracyVal}%</div>
                            <div className="w-full h-1 bg-brand-border rounded overflow-hidden mt-1">
                              <div className="h-full bg-brand-primary rounded" style={{ width: `${accuracyVal}%` }}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Results Action Header (Load Results) */}
              {activeTab === "RESULTS" && !(activeTab === "RESULTS" ? resultsLoading : loading) && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-brand-surface border border-brand-border/60 px-5 py-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-brand-primary" />
                    <span className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
                      Completed Tournament Results
                    </span>
                    <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                      {filteredMatches.length} Matches
                    </span>
                  </div>
                  <button
                    onClick={fetchResults}
                    disabled={resultsLoading}
                    className="flex items-center space-x-1.5 px-4.5 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary/80 border border-brand-primary/20 text-brand-bg text-xs font-black tracking-wide transition cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resultsLoading ? "animate-spin" : ""}`} />
                    <span>Load Results</span>
                  </button>
                </div>
              )}

              {activeTab === "ALL_RESULTS" && allResultsLoading && (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="w-6 h-6 border-2 border-[#00E676] border-t-transparent 
                                  rounded-full animate-spin"></div>
                  <p className="text-sm font-medium" style={{ color: "#A0AEC0" }}>
                    Loading all World Cup results...
                  </p>
                </div>
              )}

              {activeTab === "ALL_RESULTS" && allResultsError && (
                <div className="p-4 rounded-xl border text-sm font-medium"
                  style={{ 
                    background: "#EF444410", 
                    borderColor: "#EF444430", 
                    color: "#EF4444" 
                  }}>
                  {allResultsError}
                  <button
                    onClick={fetchAllResults}
                    className="block mt-2 text-xs font-bold underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Dynamic Match Fixtures List */}
              {(activeTab === "RESULTS" ? resultsLoading : activeTab === "ALL_RESULTS" ? allResultsLoading : loading) ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((placeholder) => (
                    <div 
                      key={placeholder}
                      className="border border-brand-border rounded-2xl p-5 bg-brand-surface space-y-4 animate-pulse"
                    >
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-brand-border rounded w-1/4"></div>
                        <div className="h-3 bg-brand-border rounded w-1/3"></div>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center space-x-3 w-1/3">
                          <div className="w-8 h-8 rounded-full bg-brand-border"></div>
                          <div className="h-4 bg-brand-border rounded w-2/3"></div>
                        </div>
                        <div className="w-12 h-6 bg-brand-border rounded-full"></div>
                        <div className="flex items-center space-x-3 w-1/3 justify-end">
                          <div className="h-4 bg-brand-border rounded w-2/3 text-right"></div>
                          <div className="w-8 h-8 rounded-full bg-brand-border"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayMatches.length === 0 ? (
                <div className="border border-brand-border rounded-2xl p-12 text-center bg-brand-surface shadow-xs">
                  {activeTab === "ALL" ? (
                    <Calendar className="w-8 h-8 text-brand-primary mx-auto mb-3" />
                  ) : (
                    <Globe className="w-8 h-8 text-brand-text-secondary mx-auto mb-3" />
                  )}
                  <p className="text-brand-text-secondary text-sm font-semibold">
                    {activeTab === "ALL" 
                      ? `No matches scheduled for ${selectedDate === getTodayDateString() ? "today" : formatDate(selectedDate)}.`
                      : activeTab === "FINISHED"
                      ? "No completed matches available."
                      : activeTab === "RESULTS"
                      ? "No results available. Click 'Load Results' to fetch."
                      : activeTab === "ALL_RESULTS"
                      ? (searchQuery || allResultsSelectedDate ? "No matches match your search filters." : "No historical results available.")
                      : activeTab === "LIVE"
                      ? "No live matches in progress right now."
                      : activeTab === "UPCOMING"
                      ? "No upcoming matches scheduled."
                      : "No fixtures match your search filters."}
                  </p>
                  <p className="text-xs text-brand-text-secondary/60 mt-1">
                    {activeTab === "ALL" 
                      ? "Try picking another date using the calendar beside the search bar." 
                      : activeTab === "FINISHED"
                      ? "Please check back later once more games have finished!"
                      : activeTab === "RESULTS"
                      ? "Click the button below to retrieve completed matches from the live results endpoint."
                      : activeTab === "ALL_RESULTS"
                      ? (searchQuery || allResultsSelectedDate ? "Try clearing your search query or changing the selected date." : "Click 'Refresh Results' to try reloading.")
                      : activeTab === "LIVE"
                      ? "Keep an eye out for active games, or explore upcoming and completed fixtures!"
                      : activeTab === "UPCOMING"
                      ? "Check back later to see new scheduled games for the tournament!"
                      : "Try changing your tab or query."}
                  </p>
                  {activeTab === "RESULTS" && (
                    <button
                      onClick={fetchResults}
                      className="mt-5 px-4.5 py-2.5 bg-brand-primary hover:bg-brand-primary/80 text-brand-bg text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 mx-auto shadow-md"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Load Results</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <AnimatePresence mode="popLayout">
                    {activeTab === "ALL" ? (
                      <div className="space-y-8">
                        {/* Live Matches Section */}
                        {(() => {
                          const live = filteredMatches.filter(m => m.status === "LIVE");
                          if (live.length === 0) return null;
                          return (
                            <div className="space-y-3.5">
                              <div className="flex items-center gap-2 px-1 border-b border-brand-border/40 pb-2">
                                <span className="flex h-2.5 w-2.5 rounded-full bg-brand-error animate-ping"></span>
                                <h3 className="font-display font-extrabold text-xs tracking-wider uppercase text-brand-error flex items-center gap-1.5">
                                  Live Matches
                                  <span className="bg-brand-error/20 text-brand-error border border-brand-error/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    {live.length}
                                  </span>
                                </h3>
                              </div>
                              <div className="space-y-3">
                                {live.map(m => renderMatchCard(m))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Upcoming Matches Section */}
                        {(() => {
                          const upcoming = filteredMatches.filter(m => m.status === "UPCOMING");
                          if (upcoming.length === 0) return null;
                          return (
                            <div className="space-y-3.5">
                              <div className="flex items-center gap-2 px-1 border-b border-brand-border/40 pb-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-brand-primary"></div>
                                <h3 className="font-display font-extrabold text-xs tracking-wider uppercase text-brand-text-primary flex items-center gap-1.5">
                                  Upcoming Matches
                                  <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    {upcoming.length}
                                  </span>
                                </h3>
                              </div>
                              <div className="space-y-3">
                                {upcoming.map(m => renderMatchCard(m))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Played Matches Section */}
                        {(() => {
                          const finished = filteredMatches.filter(m => m.status === "FINISHED");
                          if (finished.length === 0) return null;
                          return (
                            <div className="space-y-3.5">
                              <div className="flex items-center gap-2 px-1 border-b border-brand-border/40 pb-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-brand-primary"></div>
                                <h3 className="font-display font-extrabold text-xs tracking-wider uppercase text-brand-text-primary flex items-center gap-1.5">
                                  Played Matches
                                  <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    {finished.length}
                                  </span>
                                </h3>
                              </div>
                              <div className="space-y-3">
                                {finished.map(m => renderMatchCard(m))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : activeTab === "LIVE" ? (
                      <div className="space-y-3.5">
                        <div className="flex items-center gap-2 px-1 border-b border-brand-border/40 pb-2">
                          <span className="flex h-2.5 w-2.5 rounded-full bg-brand-error animate-ping"></span>
                          <h3 className="font-display font-extrabold text-xs tracking-wider uppercase text-brand-error flex items-center gap-1.5">
                            Live Matches
                            <span className="bg-brand-error/20 text-brand-error border border-brand-error/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {displayMatches.length}
                            </span>
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {displayMatches.map(m => renderMatchCard(m))}
                        </div>
                      </div>
                    ) : activeTab === "UPCOMING" ? (
                      <div className="space-y-3.5">
                        <div className="flex items-center gap-2 px-1 border-b border-brand-border/40 pb-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-primary"></div>
                          <h3 className="font-display font-extrabold text-xs tracking-wider uppercase text-brand-text-primary flex items-center gap-1.5">
                            Upcoming Matches
                            <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {displayMatches.length}
                            </span>
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {displayMatches.map(m => renderMatchCard(m))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        <div className="flex items-center gap-2 px-1 border-b border-brand-border/40 pb-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-primary"></div>
                          <h3 className="font-display font-extrabold text-xs tracking-wider uppercase text-brand-text-primary flex items-center gap-1.5">
                            Tournament Results
                            <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {displayMatches.length}
                            </span>
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {displayMatches.map(m => renderMatchCard(m))}
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  )}

      {/* Match Details Slider Drawer */}
      <AnimatePresence>
        {false && selectedMatch && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedMatch(null)} />
            
            <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-screen max-w-md"
              >
                <div className="h-full flex flex-col bg-brand-surface border-l border-brand-border shadow-2xl overflow-y-auto">
                  
                  {/* Slider Header */}
                  <div className="p-6 border-b border-brand-border flex items-center justify-between bg-brand-bg">
                    <div className="flex items-center space-x-2.5">
                      <Trophy className="w-5 h-5 text-brand-primary" />
                      <span className="font-display font-black text-sm tracking-tight text-brand-primary uppercase">Match Center</span>
                    </div>
                    <button 
                      onClick={() => setSelectedMatch(null)}
                      className="p-1.5 rounded-lg bg-brand-border hover:bg-brand-primary/20 text-brand-text-secondary hover:text-brand-primary transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 flex-1 space-y-6 bg-brand-surface">
                    {/* Immersive Score Banner */}
                    <div className="bg-brand-bg border border-brand-border p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-brand-primary bg-brand-primary/15 px-2.5 py-1 rounded-full border border-brand-primary/30 mb-4 uppercase">
                        {selectedMatch.stage} • {selectedMatch.group}
                      </span>

                      <div className="flex items-center justify-between w-full gap-4 px-4">
                        {/* Home Team Details */}
                        <div className="flex-1 flex flex-col items-center">
                          <img 
                            src={getFlagUrl(selectedMatch.homeTeam, selectedMatch.homeTeamCode)} 
                            alt={`${selectedMatch.homeTeam} flag`} 
                            className="w-14 h-9 sm:w-16 sm:h-10 object-cover rounded-md shadow-md border border-brand-border mb-3 shrink-0 filter drop-shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-display font-bold text-sm text-brand-text-primary leading-tight">
                            {selectedMatch.homeTeam}
                          </span>
                          <span className="text-xs font-mono text-brand-text-secondary mt-1 font-semibold">{selectedMatch.homeTeamCode}</span>
                        </div>

                        {/* Score Panel */}
                        <div className="flex flex-col items-center">
                          {selectedMatch.status === "LIVE" ? (
                            <>
                              <div className="text-2xl font-mono font-black tracking-widest text-brand-text-primary flex items-center space-x-1">
                                <span>{selectedMatch.homeScore}</span>
                                <span className="animate-pulse">:</span>
                                <span>{selectedMatch.awayScore}</span>
                              </div>
                              <span className="text-[10px] bg-brand-error/20 border border-brand-error/30 text-brand-error font-mono font-bold px-2.5 py-0.5 rounded mt-2.5 animate-pulse">
                                LIVE • {selectedMatch.minute}'
                              </span>
                            </>
                          ) : selectedMatch.status === "FINISHED" ? (
                            <>
                              <div className="text-2xl font-mono font-black tracking-widest text-brand-text-primary">
                                {selectedMatch.homeScore} - {selectedMatch.awayScore}
                              </div>
                              <span className="text-[10px] bg-brand-primary/15 border border-brand-primary/35 text-brand-primary font-mono font-bold px-2.5 py-0.5 rounded mt-2.5 uppercase tracking-wide">
                                {getDisplayStatusText(selectedMatch.rawStatus)}
                              </span>
                              <span className="text-[10px] text-brand-text-secondary font-semibold mt-2 font-mono text-center">
                                Played on {formatDate(selectedMatch.date)}
                                {selectedMatch.time ? ` • ${selectedMatch.time}` : ""}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="text-xs font-mono text-brand-text-primary bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded-lg font-bold shadow-2xs">
                                {selectedMatch.time}
                              </div>
                              <span className="text-[10px] text-brand-text-secondary font-bold mt-2 uppercase">
                                {formatDateShort(selectedMatch.date)}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Away Team Details */}
                        <div className="flex-1 flex flex-col items-center">
                          <img 
                            src={getFlagUrl(selectedMatch.awayTeam, selectedMatch.awayTeamCode)} 
                            alt={`${selectedMatch.awayTeam} flag`} 
                            className="w-14 h-9 sm:w-16 sm:h-10 object-cover rounded-md shadow-md border border-brand-border mb-3 shrink-0 filter drop-shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-display font-bold text-sm text-brand-text-primary leading-tight">
                            {selectedMatch.awayTeam}
                          </span>
                          <span className="text-xs font-mono text-brand-text-secondary mt-1 font-semibold">{selectedMatch.awayTeamCode}</span>
                        </div>
                      </div>

                      {/* Stadium */}
                      <div className="w-full mt-5 pt-4 border-t border-brand-border flex items-center justify-center gap-1.5 text-xs text-brand-text-secondary font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-brand-text-secondary shrink-0" />
                        <span>{selectedMatch.stadium}</span>
                      </div>
                    </div>

                    {activeTab !== "ALL_RESULTS" && (
                      <>
                        {/* Prediction Widget */}
                        <div className="bg-brand-primary/10 border border-brand-primary/25 p-5 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-display font-black text-brand-primary uppercase tracking-wider">Score Prediction</span>
                            </div>
                            {predictions[selectedMatch.id] && (
                              <button
                                onClick={() => removePrediction(selectedMatch.id)}
                                className="text-[10px] text-brand-error font-bold hover:underline cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </div>

                          {predictions[selectedMatch.id] ? (
                            <div className="bg-brand-bg border border-brand-border rounded-xl p-3 text-center space-y-1">
                              <span className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-wider">Your Prediction</span>
                              <div className="text-lg font-mono font-black text-brand-text-primary">
                                {selectedMatch.homeTeamCode} {predictions[selectedMatch.id].home} - {predictions[selectedMatch.id].away} {selectedMatch.awayTeamCode}
                              </div>
                              <p className="text-[10px] text-brand-primary font-semibold">Prediction registered! Good luck! 🔮</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-[11px] text-brand-text-secondary font-medium">Predict the final score of this matchup:</p>
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const homeVal = parseInt((e.currentTarget.elements.namedItem("homeScore") as HTMLInputElement).value || "0");
                                  const awayVal = parseInt((e.currentTarget.elements.namedItem("awayScore") as HTMLInputElement).value || "0");
                                  savePrediction(selectedMatch.id, homeVal, awayVal);
                                }}
                                className="flex items-center justify-between gap-3 bg-brand-bg border border-brand-border p-3 rounded-xl shadow-2xs"
                              >
                                <div className="flex-1 flex items-center justify-center gap-2">
                                  <span className="text-xs font-bold text-brand-text-secondary truncate max-w-[50px]">{selectedMatch.homeTeamCode}</span>
                                  <input 
                                    type="number" 
                                    name="homeScore" 
                                    min="0" 
                                    defaultValue="0" 
                                    className="w-12 text-center border border-brand-border bg-brand-surface rounded-lg py-1 text-sm font-bold text-brand-text-primary focus:outline-none focus:border-brand-primary"
                                  />
                                </div>
                                <span className="text-brand-text-secondary font-bold">:</span>
                                <div className="flex-1 flex items-center justify-center gap-2">
                                  <input 
                                    type="number" 
                                    name="awayScore" 
                                    min="0" 
                                    defaultValue="0" 
                                    className="w-12 text-center border border-brand-border bg-brand-surface rounded-lg py-1 text-sm font-bold text-brand-text-primary focus:outline-none focus:border-brand-primary"
                                  />
                                  <span className="text-xs font-bold text-brand-text-secondary truncate max-w-[50px]">{selectedMatch.awayTeamCode}</span>
                                </div>
                                <button 
                                  type="submit" 
                                  className="bg-brand-primary hover:bg-[#00C864] text-brand-bg text-[11px] font-bold px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer"
                                >
                                  Save
                                </button>
                              </form>
                            </div>
                          )}
                        </div>

                        {/* AI Prediction Panel */}
                        <div className="space-y-4">
                          <h4 className="font-display font-bold text-sm text-slate-800 flex items-center space-x-2">
                            <span>⚡</span>
                            <span className="text-brand-text-primary">AI Prediction</span>
                            {prediction && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                (prediction.confidence || "medium") === "high"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : (prediction.confidence || "medium") === "medium"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}>
                                {String(prediction.confidence || "medium").toUpperCase()} CONFIDENCE
                              </span>
                            )}
                          </h4>

                          {predictionLoading && (
                            <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 text-center space-y-2">
                              <div className="w-5 h-5 border-2 border-[#002B5B] border-t-transparent rounded-full animate-spin mx-auto"></div>
                              <p className="text-xs text-slate-500 font-medium">Analysing World Cup history...</p>
                            </div>
                          )}

                          {predictionError && (
                            <div className="p-4 border border-rose-200 rounded-xl bg-rose-50 text-xs text-rose-700 font-medium">
                              {predictionError}
                            </div>
                          )}

                          {prediction && !predictionLoading && (
                            <div className="space-y-4">

                              {/* Match Winner */}
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Match Winner</p>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-slate-700 w-28 shrink-0">{selectedMatch?.homeTeam}</span>
                                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#002B5B] rounded-full" style={{ width: `${prediction.match_winner.home_win}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-[#002B5B] w-8 text-right">{prediction.match_winner.home_win}%</span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-slate-700 w-28 shrink-0">Draw</span>
                                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-slate-400 rounded-full" style={{ width: `${prediction.match_winner.draw}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 w-8 text-right">{prediction.match_winner.draw}%</span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-slate-700 w-28 shrink-0">{selectedMatch?.awayTeam}</span>
                                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${prediction.match_winner.away_win}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-rose-600 w-8 text-right">{prediction.match_winner.away_win}%</span>
                                  </div>
                                </div>

                                <p className="text-[11px] text-slate-600 leading-relaxed border-t border-slate-200 pt-3">
                                  {prediction.match_winner.reasoning}
                                </p>
                              </div>

                              {/* First Half + Goals side by side */}
                              <div className="grid grid-cols-2 gap-3">

                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">First Half</p>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-600 font-medium truncate max-w-[70px]">{selectedMatch?.homeTeamCode}</span>
                                      <span className="font-bold text-[#002B5B]">{prediction.first_half.home_win}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-600 font-medium">Draw</span>
                                      <span className="font-bold text-slate-500">{prediction.first_half.draw}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-600 font-medium truncate max-w-[70px]">{selectedMatch?.awayTeamCode}</span>
                                      <span className="font-bold text-rose-600">{prediction.first_half.away_win}%</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Goals</p>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-600 font-medium">Over 2.5</span>
                                      <span className="font-bold text-[#002B5B]">{prediction.goals.over_2_5}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-600 font-medium">BTTS</span>
                                      <span className="font-bold text-[#002B5B]">{prediction.goals.both_teams_score}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-600 font-medium">xGoals</span>
                                      <span className="font-bold text-[#002B5B]">{prediction.goals.expected_goals}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Summary */}
                              <div className="bg-[#002B5B]/5 border border-[#002B5B]/10 rounded-xl p-4">
                                <p className="text-[10px] font-bold text-[#002B5B] uppercase tracking-wider mb-2">AI Summary</p>
                                <p className="text-xs text-slate-700 leading-relaxed">{prediction.summary}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Lineups Section */}
                    {(() => {
                      const isUpcoming = selectedMatch.status === "UPCOMING";
                      const lineupsAvailable = lineups && (lineups.hasLineups === true || lineups.hasLineups === "true" || lineups.lineups_available === true || lineups.lineups_available === "true" || !!lineups.home || !!lineups.away);
                      const isExpanded = isUpcoming || lineupsSectionExpanded;

                      return (
                        <div className="border-t border-brand-border pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span 
                                className="flex items-center gap-1.5"
                                style={{
                                  color: "var(--color-brand-text-primary)",
                                  fontFamily: "var(--font-display)",
                                  fontWeight: 700
                                }}
                              >
                                ⚽ Line-ups
                              </span>
                              {lineupsAvailable && !lineupsLoading && (
                                (() => {
                                  const lineupType = String(lineups.lineup_type || lineups.type || (isUpcoming ? "PREDICTED" : "CONFIRMED")).toUpperCase();
                                  const isConfirmed = lineupType === "CONFIRMED";
                                  return (
                                    <span 
                                      className="tracking-wider text-center font-semibold"
                                      style={{
                                        backgroundColor: "#D1FAE5",
                                        color: "#065F46",
                                        border: "1px solid #6EE7B7",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        borderRadius: "999px",
                                        padding: "3px 10px"
                                      }}
                                    >
                                      {lineupType}
                                    </span>
                                  );
                                })()
                              )}
                            </div>

                            {!isUpcoming && lineupsAvailable && !lineupsLoading && (
                              <button
                                onClick={() => setLineupsSectionExpanded(!lineupsSectionExpanded)}
                                className="transition flex items-center gap-1 cursor-pointer"
                                style={{
                                  color: "var(--color-brand-primary)",
                                  fontSize: "13px",
                                  fontWeight: 600
                                }}
                              >
                                {isExpanded ? "Collapse ▲" : "Expand ▼"}
                              </button>
                            )}
                          </div>

                          {lineupsAvailable && !lineupsLoading && (lineups.source_note || lineups.note) && (
                            <p className="italic -mt-1" style={{ color: "var(--color-brand-text-secondary)", fontSize: "12px" }}>
                              {lineups.source_note || lineups.note}
                            </p>
                          )}

                          {lineupsLoading ? (
                            <div className="p-6 border border-brand-border rounded-xl bg-brand-surface text-center space-y-2">
                              <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                              <p className="text-xs text-brand-text-secondary font-medium font-mono">Searching for lineups...</p>
                            </div>
                          ) : !lineupsAvailable ? (
                            <div className="p-4 border border-brand-border rounded-xl bg-brand-surface text-center text-brand-text-secondary text-xs font-mono">
                              Lineups not yet available
                            </div>
                          ) : (
                            isExpanded && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3.5">
                                  {/* HOME TEAM */}
                                  <div className="p-3 space-y-3 shadow-sm" style={{ backgroundColor: 'var(--color-brand-surface)', border: '1px solid var(--color-brand-border)', borderRadius: '12px' }}>
                                    <div className="flex items-center justify-between border-b pb-2 gap-2 min-w-0" style={{ borderColor: 'var(--color-brand-border)' }}>
                                      <span className="truncate" title={selectedMatch.homeTeam} style={{ color: 'var(--color-brand-text-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px' }}>
                                        {selectedMatch.homeTeamCode || selectedMatch.homeTeam}
                                      </span>
                                      {lineups.home?.formation && (
                                        <span className="font-mono uppercase shrink-0" style={{ backgroundColor: 'var(--color-brand-secondary)', color: 'var(--color-brand-text-secondary)', fontSize: '11px', fontWeight: 600, borderRadius: '6px', padding: '3px 8px', border: '1px solid var(--color-brand-border)' }}>
                                          {lineups.home.formation}
                                        </span>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      {getPlayersList(lineups.home).slice(0, 11).map((player, pIdx) => {
                                        const posInfo = (() => {
                                          const p = (player.position || "").toUpperCase();
                                          const origAbbr = player.position ? (player.position.length <= 3 ? player.position.toUpperCase() : player.position.slice(0, 3).toUpperCase()) : "";
                                          if (p.includes("GK") || p.includes("GOA")) {
                                            return { abbr: "GK", bg: "#FEF3C7", text: "#92400E" };
                                          }
                                          if (p.includes("DEF") || p.includes("BACK") || p.includes("LWB") || p.includes("RWB") || p.includes("CB") || p.includes("RB") || p.includes("LB")) {
                                            return { abbr: origAbbr || "DEF", bg: "#DBEAFE", text: "#1E40AF" };
                                          }
                                          if (p.includes("MID") || p.includes("CEN") || p.includes("HALF") || p.includes("DM") || p.includes("AM") || p.includes("CM")) {
                                            return { abbr: origAbbr || "MID", bg: "#D1FAE5", text: "#065F46" };
                                          }
                                          if (p.includes("FWD") || p.includes("ATT") || p.includes("STR") || p.includes("FOR") || p.includes("WNG") || p.includes("ST") || p.includes("RW") || p.includes("LW") || p.includes("CF")) {
                                            return { abbr: origAbbr || "FWD", bg: "rgba(220, 38, 38, 0.15)", text: "var(--color-brand-error)" };
                                          }
                                          return { abbr: origAbbr, bg: "var(--color-brand-secondary)", text: "var(--color-brand-text-secondary)" };
                                        })();
                                        return (
                                          <div key={pIdx} className="flex items-center justify-between text-xs py-1 last:border-0 leading-tight border-b" style={{ borderBottom: pIdx === 10 ? 'none' : '1px solid var(--color-brand-border)' }}>
                                            <div className="flex items-center space-x-1.5 min-w-0">
                                              <span className="shrink-0 text-left animate-none" style={{ color: 'var(--color-brand-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px', minWidth: '20px' }}>
                                                {player.number}
                                              </span>
                                              <span className="truncate" title={player.name} style={{ color: 'var(--color-brand-text-primary)', fontWeight: 500, fontSize: '14px' }}>
                                                {player.name}
                                              </span>
                                            </div>
                                            {player.position && (
                                              <span 
                                                className="font-mono shrink-0 uppercase tracking-wider text-center"
                                                style={{
                                                  backgroundColor: posInfo.bg,
                                                  color: posInfo.text,
                                                  fontSize: '10px',
                                                  fontWeight: 700,
                                                  borderRadius: '4px',
                                                  padding: '2px 5px'
                                                }}
                                              >
                                                {posInfo.abbr}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* AWAY TEAM */}
                                  <div className="p-3 space-y-3 shadow-sm" style={{ backgroundColor: 'var(--color-brand-surface)', border: '1px solid var(--color-brand-border)', borderRadius: '12px' }}>
                                    <div className="flex items-center justify-between border-b pb-2 gap-2 min-w-0" style={{ borderColor: 'var(--color-brand-border)' }}>
                                      <span className="truncate" title={selectedMatch.awayTeam} style={{ color: 'var(--color-brand-text-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px' }}>
                                        {selectedMatch.awayTeamCode || selectedMatch.awayTeam}
                                      </span>
                                      {lineups.away?.formation && (
                                        <span className="font-mono uppercase shrink-0" style={{ backgroundColor: 'var(--color-brand-secondary)', color: 'var(--color-brand-text-secondary)', fontSize: '11px', fontWeight: 600, borderRadius: '6px', padding: '3px 8px', border: '1px solid var(--color-brand-border)' }}>
                                          {lineups.away.formation}
                                        </span>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      {getPlayersList(lineups.away).slice(0, 11).map((player, pIdx) => {
                                        const posInfo = (() => {
                                          const p = (player.position || "").toUpperCase();
                                          const origAbbr = player.position ? (player.position.length <= 3 ? player.position.toUpperCase() : player.position.slice(0, 3).toUpperCase()) : "";
                                          if (p.includes("GK") || p.includes("GOA")) {
                                            return { abbr: "GK", bg: "#FEF3C7", text: "#92400E" };
                                          }
                                          if (p.includes("DEF") || p.includes("BACK") || p.includes("LWB") || p.includes("RWB") || p.includes("CB") || p.includes("RB") || p.includes("LB")) {
                                            return { abbr: origAbbr || "DEF", bg: "#DBEAFE", text: "#1E40AF" };
                                          }
                                          if (p.includes("MID") || p.includes("CEN") || p.includes("HALF") || p.includes("DM") || p.includes("AM") || p.includes("CM")) {
                                            return { abbr: origAbbr || "MID", bg: "#D1FAE5", text: "#065F46" };
                                          }
                                          if (p.includes("FWD") || p.includes("ATT") || p.includes("STR") || p.includes("FOR") || p.includes("WNG") || p.includes("ST") || p.includes("RW") || p.includes("LW") || p.includes("CF")) {
                                            return { abbr: origAbbr || "FWD", bg: "rgba(220, 38, 38, 0.15)", text: "var(--color-brand-error)" };
                                          }
                                          return { abbr: origAbbr, bg: "var(--color-brand-secondary)", text: "var(--color-brand-text-secondary)" };
                                        })();
                                        return (
                                          <div key={pIdx} className="flex items-center justify-between text-xs py-1 last:border-0 leading-tight border-b" style={{ borderBottom: pIdx === 10 ? 'none' : '1px solid var(--color-brand-border)' }}>
                                            <div className="flex items-center space-x-1.5 min-w-0">
                                              <span className="shrink-0 text-left animate-none" style={{ color: 'var(--color-brand-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px', minWidth: '20px' }}>
                                                {player.number}
                                              </span>
                                              <span className="truncate" title={player.name} style={{ color: 'var(--color-brand-text-primary)', fontWeight: 500, fontSize: '14px' }}>
                                                {player.name}
                                              </span>
                                            </div>
                                            {player.position && (
                                              <span 
                                                className="font-mono shrink-0 uppercase tracking-wider text-center"
                                                style={{
                                                  backgroundColor: posInfo.bg,
                                                  color: posInfo.text,
                                                  fontSize: '10px',
                                                  fontWeight: 700,
                                                  borderRadius: '4px',
                                                  padding: '2px 5px'
                                                }}
                                              >
                                                {posInfo.abbr}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>

                                {/* Bench Section */}
                                <div className="space-y-3">
                                  <div className="flex justify-center">
                                    <button
                                      onClick={() => setBenchExpanded(!benchExpanded)}
                                      onMouseEnter={() => setSubstitutesHover(true)}
                                      onMouseLeave={() => setSubstitutesHover(false)}
                                      className="flex items-center justify-center gap-1.5 transition cursor-pointer"
                                      style={{
                                        border: "1px solid var(--color-brand-primary)",
                                        color: substitutesHover ? "#FFFFFF" : "var(--color-brand-primary)",
                                        backgroundColor: substitutesHover ? "var(--color-brand-primary)" : "transparent",
                                        borderRadius: "999px",
                                        fontWeight: 600,
                                        fontSize: "13px",
                                        padding: "8px 20px"
                                      }}
                                    >
                                      <span>{benchExpanded ? "Hide Substitutes ▲" : "Show Substitutes ▼"}</span>
                                    </button>
                                  </div>

                                  {benchExpanded && (
                                    <div className="grid grid-cols-2 gap-3.5 animate-fadeIn">
                                      {/* Home Bench */}
                                      <div className="p-3 space-y-3 shadow-sm" style={{ backgroundColor: 'var(--color-brand-surface)', border: '1px solid var(--color-brand-border)', borderRadius: '12px' }}>
                                        <h5 
                                          className="border-b pb-2" 
                                          style={{ 
                                            color: "var(--color-brand-text-secondary)", 
                                            fontSize: "11px", 
                                            fontWeight: 700, 
                                            letterSpacing: "0.05em", 
                                            textTransform: "uppercase",
                                            borderColor: "var(--color-brand-border)"
                                          }}
                                        >
                                          {selectedMatch.homeTeamCode || selectedMatch.homeTeam} Subs
                                        </h5>
                                        <div className="space-y-2">
                                          {lineups.home?.bench && lineups.home.bench.length > 0 ? (
                                            (() => {
                                              const listLength = lineups.home.bench.length;
                                              return lineups.home.bench.map((player: any, pIdx: number) => {
                                                const num = player.jersey ?? player.number ?? "";
                                                const name = player.name ?? "";
                                                const pos = player.position ?? "";
                                                const posInfo = (() => {
                                                  const p = (pos || "").toUpperCase();
                                                  const origAbbr = pos ? (pos.length <= 3 ? pos.toUpperCase() : pos.slice(0, 3).toUpperCase()) : "";
                                                  if (p.includes("GK") || p.includes("GOA")) {
                                                    return { abbr: "GK", bg: "#FEF3C7", text: "#92400E" };
                                                  }
                                                  if (p.includes("DEF") || p.includes("BACK") || p.includes("LWB") || p.includes("RWB") || p.includes("CB") || p.includes("RB") || p.includes("LB")) {
                                                    return { abbr: origAbbr || "DEF", bg: "#DBEAFE", text: "#1E40AF" };
                                                  }
                                                  if (p.includes("MID") || p.includes("CEN") || p.includes("HALF") || p.includes("DM") || p.includes("AM") || p.includes("CM")) {
                                                    return { abbr: origAbbr || "MID", bg: "#D1FAE5", text: "#065F46" };
                                                  }
                                                  if (p.includes("FWD") || p.includes("ATT") || p.includes("STR") || p.includes("FOR") || p.includes("WNG") || p.includes("ST") || p.includes("RW") || p.includes("LW") || p.includes("CF")) {
                                                    return { abbr: origAbbr || "FWD", bg: "rgba(220, 38, 38, 0.15)", text: "var(--color-brand-error)" };
                                                  }
                                                  return { abbr: origAbbr, bg: "var(--color-brand-secondary)", text: "var(--color-brand-text-secondary)" };
                                                })();
                                                return (
                                                  <div key={pIdx} className="flex items-center justify-between text-xs py-1 last:border-0 leading-tight border-b" style={{ borderBottom: pIdx === (listLength - 1) ? 'none' : '1px solid var(--color-brand-border)' }}>
                                                    <div className="flex items-center space-x-1.5 min-w-0">
                                                      <span className="shrink-0 text-left animate-none" style={{ color: 'var(--color-brand-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px', minWidth: '20px' }}>
                                                        {num}
                                                      </span>
                                                      <span className="truncate" title={name} style={{ color: 'var(--color-brand-text-primary)', fontWeight: 500, fontSize: '14px' }}>
                                                        {name}
                                                      </span>
                                                    </div>
                                                    {pos && (
                                                      <span 
                                                        className="font-mono shrink-0 uppercase tracking-wider text-center"
                                                        style={{
                                                          backgroundColor: posInfo.bg,
                                                          color: posInfo.text,
                                                          fontSize: '10px',
                                                          fontWeight: 700,
                                                          borderRadius: '4px',
                                                          padding: '2px 5px'
                                                        }}
                                                      >
                                                        {posInfo.abbr}
                                                      </span>
                                                    )}
                                                  </div>
                                                );
                                              });
                                            })()
                                          ) : (
                                            <p style={{ color: "var(--color-brand-text-secondary)", fontSize: "13px", fontStyle: "italic" }}>
                                              No substitutions announced
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Away Bench */}
                                      <div className="p-3 space-y-3 shadow-sm" style={{ backgroundColor: 'var(--color-brand-surface)', border: '1px solid var(--color-brand-border)', borderRadius: '12px' }}>
                                        <h5 
                                          className="border-b pb-2" 
                                          style={{ 
                                            color: "var(--color-brand-text-secondary)", 
                                            fontSize: "11px", 
                                            fontWeight: 700, 
                                            letterSpacing: "0.05em", 
                                            textTransform: "uppercase",
                                            borderColor: "var(--color-brand-border)"
                                          }}
                                        >
                                          {selectedMatch.awayTeamCode || selectedMatch.awayTeam} Subs
                                        </h5>
                                        <div className="space-y-2">
                                          {lineups.away?.bench && lineups.away.bench.length > 0 ? (
                                            (() => {
                                              const listLength = lineups.away.bench.length;
                                              return lineups.away.bench.map((player: any, pIdx: number) => {
                                                const num = player.jersey ?? player.number ?? "";
                                                const name = player.name ?? "";
                                                const pos = player.position ?? "";
                                                const posInfo = (() => {
                                                  const p = (pos || "").toUpperCase();
                                                  const origAbbr = pos ? (pos.length <= 3 ? pos.toUpperCase() : pos.slice(0, 3).toUpperCase()) : "";
                                                  if (p.includes("GK") || p.includes("GOA")) {
                                                    return { abbr: "GK", bg: "#FEF3C7", text: "#92400E" };
                                                  }
                                                  if (p.includes("DEF") || p.includes("BACK") || p.includes("LWB") || p.includes("RWB") || p.includes("CB") || p.includes("RB") || p.includes("LB")) {
                                                    return { abbr: "DEF", bg: "#DBEAFE", text: "#1E40AF" };
                                                  }
                                                  if (p.includes("MID") || p.includes("CEN") || p.includes("HALF") || p.includes("DM") || p.includes("AM") || p.includes("CM")) {
                                                    return { abbr: "MID", bg: "#D1FAE5", text: "#065F46" };
                                                  }
                                                  if (p.includes("FWD") || p.includes("ATT") || p.includes("STR") || p.includes("FOR") || p.includes("WNG") || p.includes("ST") || p.includes("RW") || p.includes("LW") || p.includes("CF")) {
                                                    return { abbr: origAbbr || "FWD", bg: "rgba(220, 38, 38, 0.15)", text: "var(--color-brand-error)" };
                                                  }
                                                  return { abbr: origAbbr, bg: "var(--color-brand-secondary)", text: "var(--color-brand-text-secondary)" };
                                                })();
                                                return (
                                                  <div key={pIdx} className="flex items-center justify-between text-xs py-1 last:border-0 leading-tight border-b" style={{ borderBottom: pIdx === (listLength - 1) ? 'none' : '1px solid var(--color-brand-border)' }}>
                                                    <div className="flex items-center space-x-1.5 min-w-0">
                                                      <span className="shrink-0 text-left animate-none" style={{ color: 'var(--color-brand-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px', minWidth: '20px' }}>
                                                        {num}
                                                      </span>
                                                      <span className="truncate" title={name} style={{ color: 'var(--color-brand-text-primary)', fontWeight: 500, fontSize: '14px' }}>
                                                        {name}
                                                      </span>
                                                    </div>
                                                    {pos && (
                                                      <span 
                                                        className="font-mono shrink-0 uppercase tracking-wider text-center"
                                                        style={{
                                                          backgroundColor: posInfo.bg,
                                                          color: posInfo.text,
                                                          fontSize: '10px',
                                                          fontWeight: 700,
                                                          borderRadius: '4px',
                                                          padding: '2px 5px'
                                                        }}
                                                      >
                                                        {posInfo.abbr}
                                                      </span>
                                                    )}
                                                  </div>
                                                );
                                              });
                                            })()
                                          ) : (
                                            <p style={{ color: "var(--color-brand-text-secondary)", fontSize: "13px", fontStyle: "italic" }}>
                                              No substitutions announced
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Combined Prediction Section for Upcoming matches only */}
                                {selectedMatch?.status === "UPCOMING" && (
                                  <div className="border-t border-brand-border/40 pt-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-display font-bold text-sm text-brand-text-primary flex items-center space-x-2">
                                        <span>⚡</span>
                                        <span>Combined AI Analysis</span>
                                      </h4>
                                    </div>

                                    {combinedLoading && (
                                      <div className="p-6 border border-brand-border rounded-xl bg-brand-bg text-center space-y-2">
                                        <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        <p className="text-xs text-brand-text-secondary font-medium font-mono animate-pulse">Generating Combined AI Insights...</p>
                                      </div>
                                    )}

                                    {combinedError && (
                                      <div className="p-4 border border-brand-error/20 rounded-xl bg-brand-error/5 text-xs text-brand-error font-medium">
                                        {combinedError}
                                      </div>
                                    )}

                                    {combinedPrediction && !combinedLoading && (
                                      <div className="space-y-4">
                                        {/* Side by side prediction bars */}
                                        <div className="grid grid-cols-2 gap-4">
                                          {renderPredictionBar("Historical Form", combinedPrediction.historical_prediction)}
                                          {renderPredictionBar("Player Form", combinedPrediction.player_prediction)}
                                        </div>

                                        {/* Combined Prediction */}
                                        {(() => {
                                          const combinedPred = combinedPrediction.combined_prediction || combinedPrediction.prediction || combinedPrediction;
                                          const finalHome = Number(combinedPred?.home_win ?? combinedPred?.homeWin ?? combinedPred?.home ?? 0);
                                          const finalDraw = Number(combinedPred?.draw ?? 0);
                                          const finalAway = Number(combinedPred?.away_win ?? combinedPred?.awayWin ?? combinedPred?.away ?? 0);
                                          const finalTotal = (finalHome + finalDraw + finalAway) || 100;
                                          const finalHomePct = Math.round((finalHome / finalTotal) * 100);
                                          const finalDrawPct = Math.round((finalDraw / finalTotal) * 100);
                                          const finalAwayPct = 100 - finalHomePct - finalDrawPct;

                                          const confidence = String(combinedPred?.confidence || "medium").toLowerCase();
                                          const summaryText = String(combinedPred?.summary || combinedPred?.reasoning || "");

                                          return (
                                            <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4 space-y-3">
                                              <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Combined Prediction</span>
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                                                  confidence === "high"
                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                    : confidence === "medium"
                                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                    : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                                                }`}>
                                                  {confidence.toUpperCase()} CONFIDENCE
                                                </span>
                                              </div>

                                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-brand-primary" style={{ width: `${finalHomePct}%` }}></div>
                                                <div className="h-full bg-slate-400" style={{ width: `${finalDrawPct}%` }}></div>
                                                <div className="h-full bg-rose-500" style={{ width: `${finalAwayPct}%` }}></div>
                                              </div>

                                              <div className="flex items-center justify-between text-xs font-bold text-brand-text-primary">
                                                <span className="text-brand-primary">Home: {finalHomePct}%</span>
                                                <span className="text-slate-500">Draw: {finalDrawPct}%</span>
                                                <span className="text-rose-500">Away: {finalAwayPct}%</span>
                                              </div>

                                              <p className="text-xs text-brand-text-secondary leading-relaxed border-t border-brand-border/40 pt-2.5 mt-1">
                                                {summaryText}
                                              </p>
                                            </div>
                                          );
                                        })()}

                                        {/* Key Threats */}
                                        <div className="grid grid-cols-2 gap-4 border-t border-brand-border/40 pt-4">
                                          <div>
                                            <h6 className="text-[10px] font-display font-black text-brand-text-secondary uppercase tracking-wider mb-2">Home Key Threats</h6>
                                            <div className="space-y-1.5">
                                              {Array.isArray(combinedPrediction.home_key_threats) || Array.isArray(combinedPrediction.homeKeyThreats) ? (
                                                ((combinedPrediction.home_key_threats || combinedPrediction.homeKeyThreats || []) as string[]).map((name: string, i: number) => (
                                                  <div key={i} className="flex items-center text-xs font-semibold text-brand-text-primary gap-1.5">
                                                    <span className="text-brand-warning animate-pulse">⚡</span>
                                                    <span>{name}</span>
                                                  </div>
                                                ))
                                              ) : (
                                                <span className="text-xs text-brand-text-secondary font-mono italic">None identified</span>
                                              )}
                                            </div>
                                          </div>
                                          <div>
                                            <h6 className="text-[10px] font-display font-black text-brand-text-secondary uppercase tracking-wider mb-2">Away Key Threats</h6>
                                            <div className="space-y-1.5">
                                              {Array.isArray(combinedPrediction.away_key_threats) || Array.isArray(combinedPrediction.awayKeyThreats) ? (
                                                ((combinedPrediction.away_key_threats || combinedPrediction.awayKeyThreats || []) as string[]).map((name: string, i: number) => (
                                                  <div key={i} className="flex items-center text-xs font-semibold text-brand-text-primary gap-1.5">
                                                    <span className="text-brand-warning animate-pulse">⚡</span>
                                                    <span>{name}</span>
                                                  </div>
                                                ))
                                              ) : (
                                                <span className="text-xs text-brand-text-secondary font-mono italic">None identified</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      );
                    })()}

                    {/* Match Center Sections (Events, Tournament Leaders) */}
                    <div className="space-y-4 pt-4 border-t border-brand-border">
                      {/* Tab Bar */}
                      <div className="flex border-b border-brand-border/40 gap-4 mb-4">
                        <button
                          onClick={() => setDrawerTab("events")}
                          className={`pb-2 text-xs font-bold tracking-wider uppercase transition border-b-2 cursor-pointer ${
                            drawerTab === "events"
                              ? "border-brand-primary text-brand-primary"
                              : "border-transparent text-brand-text-secondary hover:text-brand-text-primary"
                          }`}
                        >
                          Events
                        </button>
                        <button
                          onClick={() => setDrawerTab("leaders")}
                          className={`pb-2 text-xs font-bold tracking-wider uppercase transition border-b-2 cursor-pointer ${
                            drawerTab === "leaders"
                              ? "border-brand-primary text-brand-primary"
                              : "border-transparent text-brand-text-secondary hover:text-brand-text-primary"
                          }`}
                        >
                          Tournament Leaders
                        </button>
                      </div>

                      {drawerTab === "events" ? (
                        (() => {
                          const useFallback = (matchEvents === null);
                          const rawEvents = useFallback ? (selectedMatch.events || []) : (matchEvents.events || []);
                          const displayEvents = rawEvents.map((evt: any) => {
                            const isHome = evt.team === "home" || 
                                           evt.team === selectedMatch.homeTeam || 
                                           evt.team === selectedMatch.homeTeamCode || 
                                           evt.is_home || 
                                           evt.isHome ||
                                           String(evt.team).toUpperCase() === String(selectedMatch.homeTeamCode || "").toUpperCase() ||
                                           evt.team_side === "home";
                            
                            const team_side = evt.team_side || (isHome ? "home" : "away");
                            const player_name = evt.player_name || evt.player || "Unknown Player";
                            const minute = evt.minute !== undefined ? evt.minute : (evt.time !== undefined ? evt.time : "");

                            let icon = evt.icon || "";
                            if (!icon) {
                              const t = (evt.type || "").toLowerCase();
                              const isOG = t.includes("og") || t.includes("own") || !!evt.is_og || !!evt.is_own_goal || (evt.detail || "").toLowerCase().includes("own goal") || (evt.detail || "").toLowerCase().includes("(og)");
                              const isPenalty = t.includes("penalty") || t.includes("pen") || !!evt.is_penalty || (evt.detail || "").toLowerCase().includes("penalty");
                              const isRed = t.includes("red") || (evt.detail || "").toLowerCase().includes("red card") || evt.card === "red";
                              const isYellow = t.includes("yellow") || (evt.detail || "").toLowerCase().includes("yellow card") || evt.card === "yellow" || (t === "card" && !isRed);
                              
                              if (isOG) icon = "⚽🔴";
                              else if (isPenalty) icon = "⚽🎯";
                              else if (isRed) icon = "🟥";
                              else if (isYellow) icon = "🟨";
                              else icon = "⚽";
                            }

                            const is_scoring_play = evt.is_scoring_play !== undefined 
                              ? evt.is_scoring_play 
                              : ((evt.type || "").toLowerCase().includes("goal") || !!evt.is_own_goal || !!evt.is_penalty || !!evt.is_scoring_play);

                            return {
                              ...evt,
                              player_name,
                              team_side,
                              icon,
                              minute,
                              assist_player: evt.assist_player || null,
                              is_own_goal: evt.is_own_goal || (evt.type || "").toLowerCase().includes("og") || (evt.type || "").toLowerCase().includes("own"),
                              is_penalty: evt.is_penalty || (evt.type || "").toLowerCase().includes("penalty") || (evt.type || "").toLowerCase().includes("pen"),
                              is_scoring_play,
                              score_at_moment: evt.score_at_moment || null
                            };
                          });
                          const hasEventsToDisplay = useFallback ? (selectedMatch.events && selectedMatch.events.length > 0) : !!matchEvents.hasEvents;

                          const computedStats = (() => {
                            let goals = 0;
                            let yellows = 0;
                            let reds = 0;
                            displayEvents.forEach((e: any) => {
                              const t = (e.type || "").toLowerCase();
                              const isOG = t.includes("og") || t.includes("own") || !!e.is_og || !!e.is_own_goal || (e.detail || "").toLowerCase().includes("own goal") || (e.detail || "").toLowerCase().includes("(og)");
                              const isPenalty = t.includes("penalty") || t.includes("pen") || !!e.is_penalty || (e.detail || "").toLowerCase().includes("penalty");
                              const isRed = t.includes("red") || (e.detail || "").toLowerCase().includes("red card") || e.card === "red";
                              const isYellow = t.includes("yellow") || (e.detail || "").toLowerCase().includes("yellow card") || e.card === "yellow" || (t === "card" && !isRed);
                              const isGoal = t.includes("goal") || isOG || isPenalty;

                              if (isGoal) goals++;
                              else if (isRed) reds++;
                              else if (isYellow) yellows++;
                            });
                            return { goals, yellows, reds };
                          })();

                          if (eventsLoading) {
                            return (
                              <div className="p-8 border border-brand-border rounded-xl bg-brand-bg text-center space-y-2">
                                <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto animate-duration-500"></div>
                                <p className="text-xs text-brand-text-secondary font-medium font-mono">Loading match events...</p>
                              </div>
                            );
                          }

                          if (eventsError) {
                            return (
                              <div className="p-8 border border-brand-error/20 rounded-xl bg-brand-error/5 text-center text-brand-error text-xs font-mono">
                                <span>⚠️ {eventsError}</span>
                              </div>
                            );
                          }

                          if (hasEventsToDisplay) {
                            return (
                              <div className="space-y-4">
                                {/* Score Banner */}
                                {!useFallback && matchEvents && (
                                  <div 
                                    className="flex items-center justify-between border px-4 py-3 rounded-xl shadow-xs"
                                    style={{
                                      backgroundColor: "var(--color-brand-surface)",
                                      borderColor: "var(--color-brand-border)"
                                    }}
                                  >
                                    <span 
                                      className="text-xs truncate max-w-[120px]"
                                      style={{
                                        color: "var(--color-brand-text-primary)",
                                        fontWeight: 700,
                                        fontFamily: "var(--font-display)"
                                      }}
                                    >
                                      {selectedMatch.homeTeamCode || selectedMatch.homeTeam}
                                    </span>
                                    <div className="flex items-center space-x-3">
                                      <span 
                                        className="text-base font-black font-mono"
                                        style={{ color: "var(--color-brand-text-primary)" }}
                                      >
                                        {matchEvents.home_score !== undefined ? matchEvents.home_score : (matchEvents.homeScore !== undefined ? matchEvents.homeScore : selectedMatch.homeScore)}
                                      </span>
                                      <span className="text-xs font-bold" style={{ color: "var(--color-brand-border)" }}>-</span>
                                      <span 
                                        className="text-base font-black font-mono"
                                        style={{ color: "var(--color-brand-text-primary)" }}
                                      >
                                        {matchEvents.away_score !== undefined ? matchEvents.away_score : (matchEvents.awayScore !== undefined ? matchEvents.awayScore : selectedMatch.awayScore)}
                                      </span>
                                      <span 
                                        className="font-mono"
                                        style={{
                                          backgroundColor: "var(--color-brand-secondary)",
                                          color: "var(--color-brand-text-secondary)",
                                          fontSize: "11px",
                                          fontWeight: 600,
                                          borderRadius: "4px",
                                          padding: "2px 6px"
                                        }}
                                      >
                                        {selectedMatch.status === "LIVE" ? "LIVE" : "FT"}
                                      </span>
                                    </div>
                                    <span 
                                      className="text-xs truncate max-w-[120px] text-right"
                                      style={{
                                        color: "var(--color-brand-text-primary)",
                                        fontWeight: 700,
                                        fontFamily: "var(--font-display)"
                                      }}
                                    >
                                      {selectedMatch.awayTeamCode || selectedMatch.awayTeam}
                                    </span>
                                  </div>
                                )}

                                {/* Timeline list */}
                                <div className="space-y-3 relative py-2">
                                  {displayEvents.map((evt: any, idx: number) => {
                                    const t = (evt.type || "").toLowerCase();
                                    const isOG = t.includes("og") || t.includes("own") || !!evt.is_og || !!evt.is_own_goal || (evt.detail || "").toLowerCase().includes("own goal") || (evt.detail || "").toLowerCase().includes("(og)");
                                    const isPenalty = t.includes("penalty") || t.includes("pen") || !!evt.is_penalty || (evt.detail || "").toLowerCase().includes("penalty");
                                    const isRed = t.includes("red") || (evt.detail || "").toLowerCase().includes("red card") || evt.card === "red";
                                    const isYellow = t.includes("yellow") || (evt.detail || "").toLowerCase().includes("yellow card") || evt.card === "yellow" || (t === "card" && !isRed);
                                    const isGoal = t.includes("goal") || isOG || isPenalty;

                                    let icon = "⚽";
                                    let bgStyle: React.CSSProperties = {};
                                    if (isGoal) {
                                      icon = isOG ? "⚽🔴" : isPenalty ? "⚽🎯" : "⚽";
                                      bgStyle = {
                                        backgroundColor: "rgba(0, 184, 92, 0.05)",
                                        borderLeft: "2px solid rgba(0, 184, 92, 0.4)"
                                      };
                                    } else if (isRed) {
                                      icon = "🟥";
                                      bgStyle = {
                                        backgroundColor: "rgba(220, 38, 38, 0.05)",
                                        borderLeft: "2px solid rgba(220, 38, 38, 0.4)"
                                      };
                                    } else if (isYellow) {
                                      icon = "🟨";
                                      bgStyle = {
                                        backgroundColor: "rgba(245, 158, 11, 0.05)",
                                        borderLeft: "2px solid rgba(245, 158, 11, 0.4)"
                                      };
                                    }

                                    const isHome = evt.team === "home" || 
                                                   evt.team === selectedMatch.homeTeam || 
                                                   evt.team === selectedMatch.homeTeamCode || 
                                                   evt.is_home || 
                                                   evt.isHome ||
                                                   String(evt.team).toUpperCase() === String(selectedMatch.homeTeamCode || "").toUpperCase();

                                    return (
                                      <div key={idx} className="grid grid-cols-12 gap-2 items-center py-2.5 px-3 rounded-xl transition" style={bgStyle}>
                                        {/* Left Side: Home Team Side (team_side === 'home') */}
                                        <div className="col-span-5 flex justify-start">
                                          {evt.team_side === 'home' ? (
                                            <div className="text-left">
                                              <span className="text-sm font-semibold text-brand-text-primary">
                                                {evt.player_name}
                                              </span>
                                              {evt.assist_player && (
                                                <div className="text-xs text-brand-text-secondary">
                                                  Assist: {evt.assist_player}
                                                </div>
                                              )}
                                              {evt.is_own_goal && (
                                                <div className="text-xs text-brand-error">(OG)</div>
                                              )}
                                              {evt.is_penalty && evt.is_scoring_play && (
                                                <div className="text-xs text-brand-text-secondary">(Pen)</div>
                                              )}
                                              {evt.is_scoring_play && (
                                                <div className="text-xs font-mono font-bold text-brand-primary mt-0.5">
                                                  {evt.score_at_moment}
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div />
                                          )}
                                        </div>

                                        {/* Center: Timeline details */}
                                        <div className="col-span-2 flex flex-col items-center justify-center relative h-full min-h-[50px]">
                                          <div 
                                            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2"
                                            style={{
                                              backgroundColor: "var(--color-brand-border)",
                                              width: "2px",
                                              zIndex: 0
                                            }}
                                          />
                                          {/* Minute */}
                                          <span 
                                            className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md z-10 select-none shadow-xs text-center"
                                            style={{
                                              backgroundColor: "var(--color-brand-surface)",
                                              border: "1px solid var(--color-brand-border)",
                                              color: "var(--color-brand-text-secondary)"
                                            }}
                                          >
                                            {evt.minute}'
                                          </span>
                                          {/* Icon */}
                                          {evt.icon && (
                                            <span 
                                              className="text-sm z-10 mt-1 select-none flex items-center justify-center w-6 h-6 rounded-full shadow-xs"
                                              style={{
                                                backgroundColor: "var(--color-brand-surface)",
                                                border: "1px solid var(--color-brand-border)",
                                              }}
                                            >
                                              {evt.icon}
                                            </span>
                                          )}
                                        </div>

                                        {/* Right Side: Away Team Side (team_side === 'away') */}
                                        <div className="col-span-5 flex justify-end">
                                          {evt.team_side === 'away' ? (
                                            <div className="text-right">
                                              <span className="text-sm font-semibold text-brand-text-primary">
                                                {evt.player_name}
                                              </span>
                                              {evt.assist_player && (
                                                <div className="text-xs text-brand-text-secondary">
                                                  Assist: {evt.assist_player}
                                                </div>
                                              )}
                                              {evt.is_own_goal && (
                                                <div className="text-xs text-brand-error">(OG)</div>
                                              )}
                                              {evt.is_penalty && evt.is_scoring_play && (
                                                <div className="text-xs text-brand-text-secondary">(Pen)</div>
                                              )}
                                              {evt.is_scoring_play && (
                                                <div className="text-xs font-mono font-bold text-brand-primary mt-0.5">
                                                  {evt.score_at_moment}
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div />
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Event Stats pills */}
                                <div className="flex items-center justify-center space-x-3.5 pt-4 border-t border-[#1E2A3A]">
                                  <span className="text-[11px] font-mono font-bold bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded-full" style={{ color: "var(--color-brand-primary)" }}>
                                    ⚽ {computedStats.goals} {computedStats.goals === 1 ? 'Goal' : 'Goals'}
                                  </span>
                                  <span className="text-[11px] font-mono font-bold bg-brand-warning/10 border border-brand-warning/20 px-3 py-1 rounded-full" style={{ color: "var(--color-brand-warning)" }}>
                                    🟨 {computedStats.yellows} {computedStats.yellows === 1 ? 'Yellow' : 'Yellows'}
                                  </span>
                                  <span className="text-[11px] font-mono font-bold bg-brand-error/10 border border-brand-error/20 px-3 py-1 rounded-full" style={{ color: "var(--color-brand-error)" }}>
                                    🟥 {computedStats.reds} {computedStats.reds === 1 ? 'Red' : 'Reds'}
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="p-8 border border-brand-border rounded-xl bg-brand-bg text-center text-brand-text-secondary text-xs font-mono">
                              {selectedMatch.status === "UPCOMING" ? (
                                <span>Match events will appear here once the match kicks off</span>
                              ) : (
                                <span>No detailed events recorded for this match</span>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        (() => {
                          const rawLeaders = matchEvents?.leaders;
                          let homeLeaders: any[] = [];
                          let awayLeaders: any[] = [];

                          if (rawLeaders) {
                            if (Array.isArray(rawLeaders)) {
                              homeLeaders = rawLeaders.filter((l: any) => 
                                l.team === "home" || 
                                String(l.team).toUpperCase() === String(selectedMatch.homeTeamCode || "").toUpperCase() ||
                                l.team === selectedMatch.homeTeam
                              );
                              awayLeaders = rawLeaders.filter((l: any) => 
                                l.team === "away" || 
                                String(l.team).toUpperCase() === String(selectedMatch.awayTeamCode || "").toUpperCase() ||
                                l.team === selectedMatch.awayTeam
                              );
                            } else if (typeof rawLeaders === "object") {
                              homeLeaders = Array.isArray(rawLeaders.home) ? rawLeaders.home : [];
                              awayLeaders = Array.isArray(rawLeaders.away) ? rawLeaders.away : [];
                            }
                          }

                          const hasLeaders = homeLeaders.length > 0 || awayLeaders.length > 0;
                          const homeForm = matchEvents?.home_form ?? matchEvents?.home?.form ?? homeLeaders[0]?.form ?? homeLeaders[0]?.team_form;
                          const awayForm = matchEvents?.away_form ?? matchEvents?.away?.form ?? awayLeaders[0]?.form ?? awayLeaders[0]?.team_form;

                          const getFormBadges = (formInput: any) => {
                            let formArray: string[] = [];
                            if (typeof formInput === "string") {
                              formArray = formInput.split("");
                            } else if (Array.isArray(formInput)) {
                              formArray = formInput.map(String);
                            }
                            return formArray.map((f, i) => {
                              const char = f.trim().toUpperCase();
                              if (char === "W") {
                                return (
                                  <span key={i} className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black border border-emerald-500/30">
                                    W
                                  </span>
                                );
                              }
                              if (char === "D") {
                                return (
                                  <span key={i} className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black border border-amber-500/30">
                                    D
                                  </span>
                                );
                              }
                              if (char === "L") {
                                return (
                                  <span key={i} className="w-5 h-5 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 text-[9px] font-black border border-red-500/30">
                                    L
                                  </span>
                                );
                              }
                              return null;
                            }).filter(Boolean);
                          };

                          if (!hasLeaders) {
                            return (
                              <div className="p-8 border border-brand-border rounded-xl bg-brand-bg text-center text-brand-text-secondary text-xs font-mono">
                                <span>No scorer data available</span>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-2 gap-3.5">
                              {/* HOME TEAM COLUMN */}
                              <div className="bg-[#141B2D] border border-[#1E2A3A] p-4 rounded-2xl space-y-4 shadow-sm">
                                <div className="border-b border-[#1E2A3A] pb-2.5">
                                  <h5 className="text-xs font-black text-white truncate mb-1">
                                    {selectedMatch.homeTeam}
                                  </h5>
                                  {homeForm && (
                                    <div className="flex items-center space-x-1 mt-1.5">
                                      <span className="text-[9px] font-mono text-brand-text-secondary uppercase font-bold mr-1">Form:</span>
                                      <div className="flex items-center space-x-1">
                                        {getFormBadges(homeForm)}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  {homeLeaders.map((leader, idx) => {
                                    const playerNum = leader.number ?? leader.jersey ?? leader.jersey_number ?? leader.shirt ?? "";
                                    const goalsCount = typeof leader.goals === "number" ? leader.goals : parseInt(leader.goals || "0") || 0;
                                    return (
                                      <div key={idx} className="bg-brand-bg/50 border border-[#1E2A3A]/60 p-2.5 rounded-xl space-y-2">
                                        <div className="flex items-start justify-between gap-1.5">
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate">
                                              {playerNum ? `#${playerNum} ` : ""}{leader.name}
                                            </p>
                                            {leader.position && (
                                              <span className={`inline-block text-[8px] font-mono font-black px-1.5 py-0.5 rounded-md mt-1 uppercase tracking-wider ${getPositionBadge(leader.position)}`}>
                                                {leader.position}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-1 text-[10px] text-brand-text-secondary font-mono">
                                          <span>⚽ {goalsCount} {goalsCount === 1 ? 'goal' : 'goals'}</span>
                                          <span className="text-brand-border">|</span>
                                          <span className="flex items-center space-x-0.5">
                                            {Array.from({ length: Math.min(goalsCount, 5) }).map((_, i) => (
                                              <span key={i} className="text-[10px]">⚽</span>
                                            ))}
                                            {goalsCount > 5 && <span className="text-[9px] font-bold">+</span>}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* AWAY TEAM COLUMN */}
                              <div className="bg-[#141B2D] border border-[#1E2A3A] p-4 rounded-2xl space-y-4 shadow-sm">
                                <div className="border-b border-[#1E2A3A] pb-2.5">
                                  <h5 className="text-xs font-black text-white truncate mb-1">
                                    {selectedMatch.awayTeam}
                                  </h5>
                                  {awayForm && (
                                    <div className="flex items-center space-x-1 mt-1.5">
                                      <span className="text-[9px] font-mono text-brand-text-secondary uppercase font-bold mr-1">Form:</span>
                                      <div className="flex items-center space-x-1">
                                        {getFormBadges(awayForm)}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  {awayLeaders.map((leader, idx) => {
                                    const playerNum = leader.number ?? leader.jersey ?? leader.jersey_number ?? leader.shirt ?? "";
                                    const goalsCount = typeof leader.goals === "number" ? leader.goals : parseInt(leader.goals || "0") || 0;
                                    return (
                                      <div key={idx} className="bg-brand-bg/50 border border-[#1E2A3A]/60 p-2.5 rounded-xl space-y-2">
                                        <div className="flex items-start justify-between gap-1.5">
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate">
                                              {playerNum ? `#${playerNum} ` : ""}{leader.name}
                                            </p>
                                            {leader.position && (
                                              <span className={`inline-block text-[8px] font-mono font-black px-1.5 py-0.5 rounded-md mt-1 uppercase tracking-wider ${getPositionBadge(leader.position)}`}>
                                                {leader.position}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-1 text-[10px] text-brand-text-secondary font-mono">
                                          <span>⚽ {goalsCount} {goalsCount === 1 ? 'goal' : 'goals'}</span>
                                          <span className="text-brand-border">|</span>
                                          <span className="flex items-center space-x-0.5">
                                            {Array.from({ length: Math.min(goalsCount, 5) }).map((_, i) => (
                                              <span key={i} className="text-[10px]">⚽</span>
                                            ))}
                                            {goalsCount > 5 && <span className="text-[9px] font-bold">+</span>}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-8 bg-brand-primary text-center text-xs text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2026 FIFA World Cup™</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {authModalOpen && (
        <div id="auth-modal-overlay">
          <div id="auth-modal" className="relative bg-brand-surface border border-brand-border rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-fade-in">
            <button
              id="modal-close-btn"
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 bg-none border-none text-xl text-brand-text-secondary hover:text-brand-text-primary cursor-pointer transition-colors font-bold"
            >
              ×
            </button>

            <div id="auth-tabs" className="flex gap-4 border-b border-brand-border pb-3">
              <button
                id="login-tab-btn"
                onClick={() => { setAuthTab('login'); setAuthError(null); }}
                className={`auth-tab text-sm font-bold pb-1 cursor-pointer border-b-2 transition ${authTab === 'login' ? 'active text-brand-primary border-brand-primary' : 'text-brand-text-secondary border-transparent'}`}
              >
                Sign In
              </button>
              <button
                id="signup-tab-btn"
                onClick={() => { setAuthTab('signup'); setAuthError(null); }}
                className={`auth-tab text-sm font-bold pb-1 cursor-pointer border-b-2 transition ${authTab === 'signup' ? 'active text-brand-primary border-brand-primary' : 'text-brand-text-secondary border-transparent'}`}
              >
                Sign Up
              </button>
            </div>

            {authError && (
              <div className="auth-error text-brand-error text-xs font-semibold bg-brand-error/5 border border-brand-error/10 rounded-lg p-2.5">
                {authError}
              </div>
            )}

            {/* Login Form Container */}
            <div id="login-form-container" className={authTab === 'login' ? 'flex flex-col gap-4' : 'hidden'}>
              <form id="login-form" onSubmit={(e) => handleAuthSubmit(e, 'login')} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-email" className="text-xs font-bold text-brand-text-secondary">Email Address</label>
                  <input
                    type="email"
                    id="login-email"
                    name="email"
                    required
                    placeholder="Email address"
                    className="px-4 py-2.5 border border-brand-border rounded-xl bg-brand-bg text-brand-text-primary text-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-password" className="text-xs font-bold text-brand-text-secondary">Password</label>
                  <input
                    type="password"
                    id="login-password"
                    name="password"
                    required
                    placeholder="Password"
                    className="px-4 py-2.5 border border-brand-border rounded-xl bg-brand-bg text-brand-text-primary text-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authFormLoading}
                  id="login-submit-btn"
                  className="bg-brand-primary hover:bg-[#009e4f] text-white py-3 rounded-full text-sm font-bold shadow-md cursor-pointer transition disabled:opacity-50 text-center"
                >
                  {authFormLoading ? "Signing In..." : "Log In"}
                </button>
              </form>
            </div>

            {/* Signup Form Container */}
            <div id="signup-form-container" className={authTab === 'signup' ? 'flex flex-col gap-4' : 'hidden'}>
              <form id="signup-form" onSubmit={(e) => handleAuthSubmit(e, 'signup')} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-name" className="text-xs font-bold text-brand-text-secondary">Full Name</label>
                  <input
                    type="text"
                    id="signup-name"
                    name="name"
                    required
                    placeholder="Full Name"
                    className="px-4 py-2.5 border border-brand-border rounded-xl bg-brand-bg text-brand-text-primary text-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-email" className="text-xs font-bold text-brand-text-secondary">Email Address</label>
                  <input
                    type="email"
                    id="signup-email"
                    name="email"
                    required
                    placeholder="Email address"
                    className="px-4 py-2.5 border border-brand-border rounded-xl bg-brand-bg text-brand-text-primary text-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-password" className="text-xs font-bold text-brand-text-secondary">Password</label>
                  <input
                    type="password"
                    id="signup-password"
                    name="password"
                    required
                    placeholder="Password (min 6 characters)"
                    className="px-4 py-2.5 border border-brand-border rounded-xl bg-brand-bg text-brand-text-primary text-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-confirm" className="text-xs font-bold text-brand-text-secondary">Confirm Password</label>
                  <input
                    type="password"
                    id="signup-confirm"
                    name="confirmPassword"
                    required
                    placeholder="Confirm Password"
                    className="px-4 py-2.5 border border-brand-border rounded-xl bg-brand-bg text-brand-text-primary text-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authFormLoading}
                  id="signup-submit-btn"
                  className="bg-brand-primary hover:bg-[#009e4f] text-white py-3 rounded-full text-sm font-bold shadow-md cursor-pointer transition disabled:opacity-50 text-center"
                >
                  {authFormLoading ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
