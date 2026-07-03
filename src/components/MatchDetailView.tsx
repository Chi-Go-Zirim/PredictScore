import React, { useState } from "react";
import { Match } from "../App";
import { Share2, MapPin } from "lucide-react";

interface MatchDetailViewProps {
  match: Match;
  onBack: () => void;
  predictions: any;
  savePrediction: (matchId: string, home: number, away: number) => void;
  removePrediction: (matchId: string) => void;
  getFlagUrl: (team: string, code?: string) => string;
  matchEvents: any;
  eventsLoading: boolean;
  eventsError: string | null;
  lineups: any;
  lineupsLoading: boolean;
  getPlayersList: (teamObj: any) => any[];
  benchExpanded: boolean;
  setBenchExpanded: (val: boolean) => void;
  prediction: any;
  predictionLoading: boolean;
  predictionError: string | null;
  combinedPrediction: any;
  combinedLoading: boolean;
  combinedError: string | null;
  hideAIPrediction?: boolean;
  isLoggedIn: boolean;
  myResult?: any;
}

export default function MatchDetailView({
  match,
  onBack,
  predictions,
  savePrediction,
  removePrediction,
  getFlagUrl,
  matchEvents,
  eventsLoading,
  eventsError,
  lineups,
  lineupsLoading,
  getPlayersList,
  benchExpanded,
  setBenchExpanded,
  prediction,
  predictionLoading,
  predictionError,
  combinedPrediction,
  combinedLoading,
  combinedError,
  hideAIPrediction = false,
  isLoggedIn,
  myResult
}: MatchDetailViewProps) {
  const [detailTab, setDetailTab] = useState<'events' | 'leaders' | 'lineups'>('events');

  const getFormBadges = (formInput: any) => {
    const chars = typeof formInput === "string" ? formInput.split("") : Array.isArray(formInput) ? formInput.map(String) : [];
    return chars.slice(0, 5).map((char, i) => {
      const c = char.toUpperCase();
      const style = c === "W" ? "bg-[#00B85C]/15 text-[#00B85C] border-[#00B85C]/30" : c === "L" ? "bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/30" : "bg-slate-100 text-slate-600 border-slate-300/30";
      return <span key={i} className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold border shadow-2xs ${style}`} title={c}>{c}</span>;
    });
  };

  const getLightPositionBadge = (pos: string) => {
    const p = (pos || "").toUpperCase();
    if (p.includes("GK") || p.includes("GOA")) return "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/20";
    if (p.includes("DEF") || p.includes("BACK")) return "bg-[#DBEAFE] text-[#1E40AF] border-[#3B82F6]/20";
    if (p.includes("MID") || p.includes("CEN") || p.includes("HALF")) return "bg-[#D1FAE5] text-[#065F46] border-[#10B981]/20";
    if (p.includes("FWD") || p.includes("ATT") || p.includes("STR") || p.includes("FOR")) return "bg-rose-500/10 text-rose-700 border-rose-500/20";
    return "bg-slate-100 text-slate-700 border-slate-300/30";
  };

  const getPlayerPosInfo = (pos: string) => {
    const p = (pos || "").toUpperCase();
    const abbr = pos ? (pos.length <= 3 ? pos.toUpperCase() : pos.slice(0, 3).toUpperCase()) : "";
    if (p.includes("GK") || p.includes("GOA")) return { abbr: "GK", bg: "#FEF3C7", text: "#92400E" };
    if (p.includes("DEF") || p.includes("BACK") || p.includes("LWB") || p.includes("RWB") || p.includes("CB") || p.includes("RB") || p.includes("LB")) return { abbr: abbr || "DEF", bg: "#DBEAFE", text: "#1E40AF" };
    if (p.includes("MID") || p.includes("CEN") || p.includes("HALF") || p.includes("DM") || p.includes("AM") || p.includes("CM")) return { abbr: abbr || "MID", bg: "#D1FAE5", text: "#065F46" };
    if (p.includes("FWD") || p.includes("ATT") || p.includes("STR") || p.includes("FOR") || p.includes("WNG") || p.includes("ST") || p.includes("RW") || p.includes("LW") || p.includes("CF")) return { abbr: abbr || "FWD", bg: "rgba(220, 38, 38, 0.15)", text: "var(--color-brand-error)" };
    return { abbr, bg: "var(--color-brand-secondary)", text: "var(--color-brand-text-secondary)" };
  };

  const renderPredictionBar = (title: string, pred: any) => {
    const h = Number(pred?.home_win ?? pred?.homeWin ?? pred?.home ?? 0);
    const d = Number(pred?.draw ?? 0);
    const a = Number(pred?.away_win ?? pred?.awayWin ?? pred?.away ?? 0);
    const total = (h + d + a) || 100;
    const hp = Math.round((h / total) * 100);
    const dp = Math.round((d / total) * 100);
    const ap = 100 - hp - dp;
    return (
      <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
        <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">{title}</span>
        <div className="h-5 rounded-lg overflow-hidden flex text-[10px] font-mono font-bold text-white shadow-2xs">
          {hp > 0 && <div className="h-full bg-brand-primary flex items-center justify-center" style={{ width: `${hp}%` }} title={`Home: ${hp}%`}>{hp >= 15 ? `${hp}%` : ""}</div>}
          {dp > 0 && <div className="h-full bg-slate-400 flex items-center justify-center" style={{ width: `${dp}%` }} title={`Draw: ${dp}%`}>{dp >= 15 ? `${dp}%` : ""}</div>}
          {ap > 0 && <div className="h-full bg-rose-500 flex items-center justify-center" style={{ width: `${ap}%` }} title={`Away: ${ap}%`}>{ap >= 15 ? `${ap}%` : ""}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-brand-border">
        <button onClick={onBack} className="text-brand-text-secondary hover:text-brand-text-primary font-medium text-sm cursor-pointer flex items-center gap-1.5 transition-colors">← Back to Matches</button>
        <div className="text-brand-text-secondary text-xs uppercase tracking-wider font-bold font-display">{match.stage} {match.group ? `• ${match.group}` : ""}</div>
        <button onClick={() => {
          if (navigator.share) {
            navigator.share({ title: `${match.homeTeam} vs ${match.awayTeam}`, text: `predictions and match events!`, url: window.location.href }).catch(() => {});
          } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
          }
        }} className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text-primary transition-colors hover:bg-brand-secondary/50 cursor-pointer"><Share2 className="w-4 h-4" /></button>
      </div>

      {/* Score Hero Card */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between w-full pb-2 border-b border-brand-border/40 text-xs text-brand-text-secondary">
          <span className="px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-bold uppercase tracking-wider text-[10px]">{match.stage}</span>
          <span className="font-semibold truncate max-w-[200px]">{match.stadium}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-center flex-1 text-center min-w-0">
            <img src={getFlagUrl(match.homeTeam, match.homeTeamCode)} alt="flag" className="w-14 h-9 sm:w-20 sm:h-12 object-cover rounded-xl border border-brand-border mb-3 shadow-xs shrink-0" />
            <span className="font-display font-extrabold text-sm sm:text-base text-brand-text-primary truncate w-full">{match.homeTeam}</span>
            <span className="text-xs font-mono text-brand-text-secondary mt-1 font-semibold">{match.homeTeamCode}</span>
          </div>
          <div className="flex flex-col items-center justify-center shrink-0 px-2 min-w-[120px]">
            {match.status === "LIVE" ? (
              <>
                <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-brand-live"><span>{match.homeScore}</span><span className="animate-pulse mx-1">:</span><span>{match.awayScore}</span></div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full mt-3 animate-pulse bg-brand-live-bg text-brand-live inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-live"></span>LIVE • {match.minute}'</span>
              </>
            ) : match.status === "FINISHED" ? (
              <>
                <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-brand-text-primary">{match.homeScore} - {match.awayScore}</div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full mt-3 uppercase tracking-wide inline-block bg-brand-primary/10 text-brand-primary border border-brand-primary/20">FT</span>
              </>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-mono font-black px-3.5 py-1.5 rounded-xl border border-brand-border bg-brand-bg text-brand-primary">{match.time}</div>
                <span className="text-[11px] text-brand-text-secondary font-bold mt-2 uppercase">{new Date(match.date).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", month: "short", day: "numeric" })}</span>
              </>
            )}
          </div>
          <div className="flex flex-col items-center flex-1 text-center min-w-0">
            <img src={getFlagUrl(match.awayTeam, match.awayTeamCode)} alt="flag" className="w-14 h-9 sm:w-20 sm:h-12 object-cover rounded-xl border border-brand-border mb-3 shadow-xs shrink-0" />
            <span className="font-display font-extrabold text-sm sm:text-base text-brand-text-primary truncate w-full">{match.awayTeam}</span>
            <span className="text-xs font-mono text-brand-text-secondary mt-1 font-semibold">{match.awayTeamCode}</span>
          </div>
        </div>
        <div className="pt-3 border-t border-brand-border/40 flex items-center justify-center gap-1.5 text-xs text-brand-text-secondary font-semibold">
          <MapPin className="w-3.5 h-3.5" /><span>{match.stadium}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="bg-brand-secondary rounded-xl p-1 flex">
          {(['events', 'leaders', 'lineups'] as const).map((tab) => {
            const isActive = detailTab === tab;
            const label = tab === 'events' ? 'Events' : tab === 'leaders' ? 'Leaders' : 'Line-ups';
            return <button key={tab} onClick={() => setDetailTab(tab)} className={`flex-1 py-2 text-xs font-bold tracking-wide rounded-lg cursor-pointer text-center ${isActive ? "bg-brand-surface shadow-xs text-brand-text-primary" : "text-brand-text-secondary hover:text-brand-text-primary"}`}>{label}</button>;
          })}
        </div>

        {/* Tab content */}
        {detailTab === "events" && (
          <div className="space-y-4">
            {(() => {
              const useFallback = (matchEvents === null);
              const rawEvents = useFallback ? (match.events || []) : (matchEvents.events || []);
              const displayEvents = rawEvents.map((evt: any) => {
                const isHome = evt.team === "home" || evt.team === match.homeTeam || evt.team === match.homeTeamCode || evt.is_home || evt.isHome || String(evt.team).toUpperCase() === String(match.homeTeamCode || "").toUpperCase() || evt.team_side === "home";
                const team_side = evt.team_side || (isHome ? "home" : "away");
                const player_name = evt.player_name || evt.player || "Unknown Player";
                const minute = evt.minute !== undefined ? evt.minute : (evt.time !== undefined ? evt.time : "");
                let icon = evt.icon || "";
                if (!icon) {
                  const t = (evt.type || "").toLowerCase();
                  if (t.includes("og") || t.includes("own") || !!evt.is_og || !!evt.is_own_goal) icon = "⚽🔴";
                  else if (t.includes("penalty") || t.includes("pen") || !!evt.is_penalty) icon = "⚽🎯";
                  else if (t.includes("red") || evt.card === "red") icon = "🟥";
                  else if (t.includes("yellow") || evt.card === "yellow" || t === "card") icon = "🟨";
                  else icon = "⚽";
                }
                const is_scoring_play = evt.is_scoring_play !== undefined ? evt.is_scoring_play : ((evt.type || "").toLowerCase().includes("goal") || !!evt.is_own_goal || !!evt.is_penalty);
                return { ...evt, player_name, team_side, icon, minute, assist_player: evt.assist_player || null, is_own_goal: evt.is_own_goal || (evt.type || "").toLowerCase().includes("og") || (evt.type || "").toLowerCase().includes("own"), is_penalty: evt.is_penalty || (evt.type || "").toLowerCase().includes("penalty") || (evt.type || "").toLowerCase().includes("pen"), is_scoring_play, score_at_moment: evt.score_at_moment || null };
              });

              if (eventsLoading) return <div className="p-8 border border-brand-border rounded-xl bg-brand-surface text-center space-y-2"><div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div><p className="text-xs text-brand-text-secondary font-medium font-mono">Loading match events...</p></div>;
              if (eventsError) return <div className="p-8 border border-brand-error/20 rounded-xl bg-brand-error/5 text-center text-brand-error text-xs font-mono">⚠️ {eventsError}</div>;

              if (displayEvents.length > 0) {
                return (
                  <div className="space-y-4">
                    <div className="space-y-3 relative py-2">
                      {displayEvents.map((evt: any, idx: number) => {
                        const style = evt.is_scoring_play ? { backgroundColor: "rgba(0, 184, 92, 0.05)", borderLeft: "2px solid rgba(0, 184, 92, 0.4)" } : {};
                        return (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-center py-2.5 px-3 rounded-xl border border-transparent" style={style}>
                            <div className="col-span-5 flex justify-start">
                              {evt.team_side === 'away' && (
                                <div className="text-left">
                                  <span className="text-sm font-semibold text-brand-text-primary">{evt.player_name}</span>
                                  {evt.assist_player && <div className="text-xs text-brand-text-secondary">Assist: {evt.assist_player}</div>}
                                  {evt.is_own_goal && <div className="text-xs text-brand-error">(OG)</div>}
                                  {evt.is_penalty && <div className="text-xs text-brand-text-secondary">(Pen)</div>}
                                  {evt.is_scoring_play && evt.score_at_moment && <div className="text-xs font-mono font-bold text-brand-primary mt-0.5">{evt.score_at_moment}</div>}
                                </div>
                              )}
                            </div>
                            <div className="col-span-2 flex flex-col items-center justify-center relative min-h-[50px]">
                              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 bg-brand-border" style={{ width: "2px" }} />
                              <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md z-10 bg-brand-surface border border-brand-border text-brand-text-secondary">{evt.minute}'</span>
                              {evt.icon && <span className="text-xs z-10 mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-brand-surface border border-brand-border">{evt.icon}</span>}
                            </div>
                            <div className="col-span-5 flex justify-end">
                              {evt.team_side === 'home' && (
                                <div className="text-right">
                                  <span className="text-sm font-semibold text-brand-text-primary">{evt.player_name}</span>
                                  {evt.assist_player && <div className="text-xs text-brand-text-secondary">Assist: {evt.assist_player}</div>}
                                  {evt.is_own_goal && <div className="text-xs text-brand-error">(OG)</div>}
                                  {evt.is_penalty && <div className="text-xs text-brand-text-secondary">(Pen)</div>}
                                  {evt.is_scoring_play && evt.score_at_moment && <div className="text-xs font-mono font-bold text-brand-primary mt-0.5">{evt.score_at_moment}</div>}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return <div className="p-8 border border-brand-border rounded-xl bg-brand-surface text-center text-brand-text-secondary text-xs font-semibold">No detailed events recorded for this match</div>;
            })()}
          </div>
        )}

        {detailTab === "leaders" && (
          <div className="space-y-4">
            {(() => {
              const rawLeaders = matchEvents?.leaders;
              let homeLeaders: any[] = [];
              let awayLeaders: any[] = [];
              if (Array.isArray(rawLeaders)) {
                homeLeaders = rawLeaders.filter((l: any) => l.team === "home" || String(l.team).toUpperCase() === String(match.homeTeamCode || "").toUpperCase() || l.team === match.homeTeam);
                awayLeaders = rawLeaders.filter((l: any) => l.team === "away" || String(l.team).toUpperCase() === String(match.awayTeamCode || "").toUpperCase() || l.team === match.awayTeam);
              } else if (rawLeaders && typeof rawLeaders === "object") {
                homeLeaders = Array.isArray(rawLeaders.home) ? rawLeaders.home : [];
                awayLeaders = Array.isArray(rawLeaders.away) ? rawLeaders.away : [];
              }
              const homeForm = matchEvents?.home_form ?? matchEvents?.home?.form ?? homeLeaders[0]?.form;
              const awayForm = matchEvents?.away_form ?? matchEvents?.away?.form ?? awayLeaders[0]?.form;

              if (homeLeaders.length === 0 && awayLeaders.length === 0) return <div className="p-8 border border-brand-border rounded-xl bg-brand-surface text-center text-brand-text-secondary text-xs font-semibold">No leader data available</div>;

              return (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { title: match.homeTeam, form: homeForm, leaders: homeLeaders },
                    { title: match.awayTeam, form: awayForm, leaders: awayLeaders }
                  ].map((col, idx) => (
                    <div key={idx} className="bg-brand-surface border border-brand-border p-4 rounded-2xl space-y-4 shadow-sm">
                      <div className="border-b border-brand-border pb-2.5">
                        <h5 className="text-xs font-black text-brand-text-primary truncate mb-1">{col.title}</h5>
                        {col.form && (
                          <div className="flex items-center space-x-1 mt-1.5">
                            <span className="text-[9px] font-mono text-brand-text-secondary uppercase font-bold mr-1">Form:</span>
                            <div className="flex items-center space-x-1">{getFormBadges(col.form)}</div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {col.leaders.map((leader, lIdx) => {
                          const playerNum = leader.number ?? leader.jersey ?? "";
                          const goalsCount = typeof leader.goals === "number" ? leader.goals : parseInt(leader.goals || "0") || 0;
                          return (
                            <div key={lIdx} className="bg-brand-bg border border-brand-border p-2.5 rounded-xl space-y-2">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-brand-text-primary truncate">{playerNum ? `#${playerNum} ` : ""}{leader.name}</p>
                                {leader.position && <span className={`inline-block text-[8px] font-mono font-black px-1.5 py-0.5 rounded-md mt-1 uppercase tracking-wider ${getLightPositionBadge(leader.position)}`}>{leader.position}</span>}
                              </div>
                              <div className="flex items-center space-x-1 text-[10px] text-brand-text-secondary font-mono">
                                <span>⚽ {goalsCount} goal{goalsCount !== 1 && 's'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {detailTab === "lineups" && (
          <div className="space-y-4">
            {(() => {
              const lineupsAvailable = lineups && (lineups.hasLineups === true || lineups.hasLineups === "true" || !!lineups.home || !!lineups.away);
              if (lineupsLoading) return <div className="p-8 border border-brand-border rounded-xl bg-brand-surface text-center space-y-2"><div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div><p className="text-xs text-brand-text-secondary font-medium font-mono">Searching lineups...</p></div>;
              if (!lineupsAvailable) return <div className="p-8 border border-brand-border rounded-xl bg-brand-surface text-center text-brand-text-secondary text-xs font-semibold">Lineups not yet available</div>;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { title: match.homeTeamCode || match.homeTeam, team: lineups.home },
                      { title: match.awayTeamCode || match.awayTeam, team: lineups.away }
                    ].map((col, idx) => (
                      <div key={idx} className="p-4 space-y-3 bg-brand-surface border border-brand-border rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between border-b border-brand-border pb-2 gap-2 min-w-0">
                          <span className="truncate font-display font-bold text-base text-brand-text-primary">{col.title}</span>
                          {col.team?.formation && <span className="font-mono uppercase shrink-0 bg-brand-secondary text-brand-text-secondary text-[11px] font-semibold rounded-md px-2 py-0.5 border border-brand-border">{col.team.formation}</span>}
                        </div>
                        <div className="space-y-2">
                          {getPlayersList(col.team).slice(0, 11).map((player, pIdx) => {
                            const pos = getPlayerPosInfo(player.position);
                            return (
                              <div key={pIdx} className="flex items-center justify-between text-xs py-1.5 border-b border-brand-border last:border-0">
                                <div className="flex items-center space-x-1.5 min-w-0">
                                  <span className="shrink-0 text-brand-text-secondary font-mono text-[13px] min-w-[20px]">{player.number}</span>
                                  <span className="truncate font-medium text-[14px] text-brand-text-primary" title={player.name}>{player.name}</span>
                                </div>
                                {player.position && <span className="font-mono shrink-0 uppercase tracking-wider text-[10px] font-bold rounded px-1.5 py-0.5" style={{ backgroundColor: pos.bg, color: pos.text }}>{pos.abbr}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-center">
                      <button onClick={() => setBenchExpanded(!benchExpanded)} className="flex items-center justify-center gap-1.5 font-bold text-xs px-5 py-2.5 rounded-full border border-brand-primary text-brand-primary cursor-pointer hover:bg-brand-primary hover:text-white transition">
                        <span>{benchExpanded ? "Hide Substitutes ▲" : "Show Substitutes ▼"}</span>
                      </button>
                    </div>

                    {benchExpanded && (
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { title: match.homeTeamCode || match.homeTeam, bench: lineups.home?.bench },
                          { title: match.awayTeamCode || match.awayTeam, bench: lineups.away?.bench }
                        ].map((col, idx) => (
                          <div key={idx} className="p-4 space-y-3 bg-brand-surface border border-brand-border rounded-2xl shadow-xs">
                            <h5 className="border-b border-brand-border pb-2 text-[11px] font-bold uppercase text-brand-text-secondary">{col.title} Subs</h5>
                            <div className="space-y-2">
                              {col.bench && col.bench.length > 0 ? (
                                col.bench.map((player: any, pIdx: number) => {
                                  const pos = getPlayerPosInfo(player.position);
                                  return (
                                    <div key={pIdx} className="flex items-center justify-between text-xs py-1.5 border-b border-brand-border last:border-0">
                                      <div className="flex items-center space-x-1.5 min-w-0">
                                        <span className="shrink-0 text-brand-text-secondary font-mono text-[13px] min-w-[20px]">{player.jersey ?? player.number}</span>
                                        <span className="truncate font-medium text-[14px] text-brand-text-primary">{player.name}</span>
                                      </div>
                                      {player.position && <span className="font-mono shrink-0 uppercase tracking-wider text-[10px] font-bold rounded px-1.5 py-0.5" style={{ backgroundColor: pos.bg, color: pos.text }}>{pos.abbr}</span>}
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-brand-text-secondary text-xs italic">No substitutions announced</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* SECTION 3: AI Predictions & Insights */}
      {!hideAIPrediction && (
        <div className="space-y-4 pt-4 border-t border-brand-border/40">
          <h4 className="font-display font-bold text-sm text-brand-text-primary flex items-center space-x-2"><span>⚡</span><span>AI Predictions & Insights</span></h4>

          {!isLoggedIn ? (
            <div className="locked-section-card">
              <div className="locked-icon">🔒</div>
              <h3 className="locked-title">Sign in to unlock AI Features</h3>
              <p className="locked-subtitle">Get AI-powered predictions, match insights, and the chance to predict and win</p>
              <button className="unlock-btn" onClick={() => (window as any).openAuthModal?.()}>Sign In / Sign Up</button>
            </div>
          ) : (
            <>
              {predictionLoading && <div className="p-6 border border-brand-border rounded-xl bg-brand-surface text-center space-y-2 shadow-xs"><div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div><p className="text-xs text-brand-text-secondary font-medium">Analysing historical data...</p></div>}
              {predictionError && <div className="p-4 border border-brand-error/20 rounded-xl bg-brand-error/5 text-xs text-brand-error font-medium">{predictionError}</div>}

              {prediction && !predictionLoading && (
                <div className="space-y-4">
                  <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">Match Winner Probability</p>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${prediction.confidence === "high" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : prediction.confidence === "medium" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-slate-500/10 text-slate-600 border-slate-500/20"}`}>{String(prediction.confidence).toUpperCase()} CONFIDENCE</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: match.homeTeam, color: "bg-brand-primary", val: prediction.match_winner.home_win },
                        { name: "Draw", color: "bg-slate-400", val: prediction.match_winner.draw },
                        { name: match.awayTeam, color: "bg-rose-500", val: prediction.match_winner.away_win }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-brand-text-primary w-24 shrink-0 truncate">{item.name}</span>
                          <div className="flex-1 h-2 bg-brand-secondary rounded-full overflow-hidden"><div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }}></div></div>
                          <span className="text-xs font-bold text-brand-text-primary w-8 text-right">{item.val}%</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[12px] text-brand-text-secondary leading-relaxed border-t border-brand-border/40 pt-3 mt-1">{prediction.match_winner.reasoning}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-brand-surface border border-brand-border rounded-xl p-3.5 space-y-2 shadow-xs">
                      <p className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">First Half</p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between"><span>{match.homeTeamCode}</span><span className="font-bold text-brand-primary">{prediction.first_half.home_win}%</span></div>
                        <div className="flex justify-between"><span>Draw</span><span className="font-bold text-slate-500">{prediction.first_half.draw}%</span></div>
                        <div className="flex justify-between"><span>{match.awayTeamCode}</span><span className="font-bold text-rose-600">{prediction.first_half.away_win}%</span></div>
                      </div>
                    </div>
                    <div className="bg-brand-surface border border-brand-border rounded-xl p-3.5 space-y-2 shadow-xs">
                      <p className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">Goals Analysis</p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between"><span>Over 2.5</span><span className="font-bold text-brand-primary">{prediction.goals.over_2_5}%</span></div>
                        <div className="flex justify-between"><span>BTTS</span><span className="font-bold text-brand-primary">{prediction.goals.both_teams_score}%</span></div>
                        <div className="flex justify-between"><span>xGoals</span><span className="font-bold text-brand-primary">{prediction.goals.expected_goals}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {match.status === "UPCOMING" && (
                <div className="space-y-4 pt-2">
                  {combinedLoading && <div className="p-6 border border-brand-border rounded-xl bg-brand-surface text-center space-y-2 shadow-xs"><div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div><p className="text-xs text-brand-text-secondary font-medium animate-pulse">Generating consensus...</p></div>}
                  {combinedError && <div className="p-4 border border-brand-error/20 rounded-xl bg-brand-error/5 text-xs text-brand-error font-medium">{combinedError}</div>}

                  {combinedPrediction && !combinedLoading && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {renderPredictionBar("Historical Form Analysis", combinedPrediction.historical_prediction)}
                        {renderPredictionBar("Player Performance Form", combinedPrediction.player_prediction)}
                      </div>

                      {(() => {
                        const combinedPred = combinedPrediction.combined_prediction || combinedPrediction;
                        const finalHome = Number(combinedPred?.home_win ?? 0);
                        const finalDraw = Number(combinedPred?.draw ?? 0);
                        const finalAway = Number(combinedPred?.away_win ?? 0);
                        const finalTotal = (finalHome + finalDraw + finalAway) || 100;
                        const finalHomePct = Math.round((finalHome / finalTotal) * 100);
                        const finalDrawPct = Math.round((finalDraw / finalTotal) * 100);
                        const finalAwayPct = 100 - finalHomePct - finalDrawPct;
                        const conf = String(combinedPred?.confidence || "medium").toLowerCase();

                        return (
                          <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-3 shadow-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-brand-text-primary uppercase tracking-wider">Combined Consensus Prediction</span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${conf === "high" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : conf === "medium" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-slate-500/10 text-slate-600 border-slate-500/20"}`}>{conf.toUpperCase()} CONFIDENCE</span>
                            </div>
                            <div className="h-2 bg-brand-secondary rounded-full overflow-hidden flex">
                              <div className="h-full bg-brand-primary" style={{ width: `${finalHomePct}%` }}></div>
                              <div className="h-full bg-slate-400" style={{ width: `${finalDrawPct}%` }}></div>
                              <div className="h-full bg-rose-500" style={{ width: `${finalAwayPct}%` }}></div>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-brand-text-primary">
                              <span className="text-brand-primary">Home: {finalHomePct}%</span>
                              <span className="text-slate-500">Draw: {finalDrawPct}%</span>
                              <span className="text-rose-500">Away: {finalAwayPct}%</span>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-2 gap-4 border-t border-brand-border/40 pt-4">
                        {[
                          { title: "Home Key Threats", list: combinedPrediction.home_key_threats || combinedPrediction.homeKeyThreats },
                          { title: "Away Key Threats", list: combinedPrediction.away_key_threats || combinedPrediction.awayKeyThreats }
                        ].map((threat, idx) => (
                          <div key={idx} className="bg-brand-surface border border-brand-border p-3 rounded-xl shadow-xs">
                            <h6 className="text-[10px] font-display font-black text-brand-text-secondary uppercase tracking-wider mb-2">{threat.title}</h6>
                            <div className="space-y-1.5">
                              {Array.isArray(threat.list) ? (
                                (threat.list as string[]).map((name: string, i: number) => (
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
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SECTION 4: AI Summary */}
      {!hideAIPrediction && (
        <div className="space-y-4 pt-4 border-t border-brand-border/40">
          <h4 className="font-display font-bold text-sm text-brand-text-primary flex items-center space-x-2"><span>📝</span><span>AI Summary</span></h4>

          {!isLoggedIn ? (
            <div className="locked-section-card">
              <div className="locked-icon">🔒</div>
              <h3 className="locked-title">Sign in to unlock AI Features</h3>
              <p className="locked-subtitle">Get AI-powered predictions, match insights, and the chance to predict and win</p>
              <button className="unlock-btn" onClick={() => (window as any).openAuthModal?.()}>Sign In / Sign Up</button>
            </div>
          ) : (
            <>
              {predictionLoading && <div className="p-4 border border-brand-border rounded-xl bg-brand-surface text-center text-xs text-brand-text-secondary">Generating AI summary...</div>}
              {prediction && !predictionLoading && (
                <div className="bg-brand-secondary rounded-xl p-4 border border-brand-border/60">
                  <p className="text-[10px] font-bold text-brand-text-primary uppercase tracking-wider mb-1">AI Summary</p>
                  <p className="text-xs text-brand-text-secondary leading-relaxed">{prediction.summary}</p>
                </div>
              )}

              {match.status === "UPCOMING" && (
                <>
                  {combinedLoading && <div className="p-4 border border-brand-border rounded-xl bg-brand-surface text-center text-xs text-brand-text-secondary animate-pulse">Generating consensus summary...</div>}
                  {combinedPrediction && !combinedLoading && (
                    <div className="bg-brand-secondary rounded-xl p-4 border border-brand-border/60">
                      <p className="text-[10px] font-bold text-brand-text-primary uppercase tracking-wider mb-1">Consensus Summary</p>
                      <p className="text-xs text-brand-text-secondary leading-relaxed">
                        {(combinedPrediction.combined_prediction || combinedPrediction)?.summary || (combinedPrediction.combined_prediction || combinedPrediction)?.reasoning}
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* SECTION 5: Predict and Win */}
      <div className="space-y-4 pt-4 border-t border-brand-border/40">
        <div className="flex items-center justify-between">
          <h4 className="font-display font-bold text-sm text-brand-text-primary flex items-center space-x-2"><span>🔮</span><span>Predict & Win</span></h4>
          {match.status !== "FINISHED" && isLoggedIn && predictions[match.id] && (
            <button onClick={() => removePrediction(match.id)} className="text-[11px] font-bold text-brand-error hover:underline cursor-pointer">Reset</button>
          )}
        </div>

        {!isLoggedIn ? (
          <div className="locked-section-card">
            <div className="locked-icon">🔒</div>
            <h3 className="locked-title">Sign in to unlock AI Features</h3>
            <p className="locked-subtitle">Get AI-powered predictions, match insights, and the chance to predict and win</p>
            <button className="unlock-btn" onClick={() => (window as any).openAuthModal?.()}>Sign In / Sign Up</button>
          </div>
        ) : (
          <>
            {predictions[match.id] ? (
              <div className="bg-brand-bg border border-brand-border rounded-xl p-4 text-center space-y-1.5">
                <span className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-wider">Your Registered Prediction</span>
                <div className="text-xl font-mono font-black text-brand-text-primary">{match.homeTeamCode} {predictions[match.id].home} - {predictions[match.id].away} {match.awayTeamCode}</div>
                {match.status !== "FINISHED" && (
                  <p className="text-[11px] text-brand-primary font-bold">Your prediction has been registered! Good luck! ✨</p>
                )}
              </div>
            ) : match.status === "FINISHED" ? (
              <div className="bg-brand-bg border border-brand-border rounded-xl p-4 text-center">
                <p className="text-xs text-brand-text-secondary">No prediction was registered for this match.</p>
              </div>
            ) : (
              <div className="bg-brand-bg rounded-xl border border-brand-border/60 p-4">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const f = e.currentTarget;
                  const hVal = parseInt((f.elements.namedItem("home") as HTMLInputElement).value) || 0;
                  const aVal = parseInt((f.elements.namedItem("away") as HTMLInputElement).value) || 0;
                  savePrediction(match.id, hVal, aVal);
                }} className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                    <span className="text-xs font-bold text-brand-text-secondary truncate max-w-[50px]">{match.homeTeamCode}</span>
                    <input type="number" name="home" min="0" defaultValue="0" className="w-12 text-center border border-brand-border bg-brand-surface rounded-lg py-1.5 text-sm font-bold text-brand-text-primary focus:outline-none focus:border-brand-primary" />
                    <span className="text-xs font-bold text-brand-text-secondary">-</span>
                    <input type="number" name="away" min="0" defaultValue="0" className="w-12 text-center border border-brand-border bg-brand-surface rounded-lg py-1.5 text-sm font-bold text-brand-text-primary focus:outline-none focus:border-brand-primary" />
                    <span className="text-xs font-bold text-brand-text-secondary truncate max-w-[50px]">{match.awayTeamCode}</span>
                  </div>
                  <button type="submit" className="bg-brand-primary hover:bg-[#009e4f] text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-sm">Save</button>
                </form>
              </div>
            )}

            {/* Show prediction results if match is FINISHED and myResult exists */}
            {match.status === "FINISHED" && myResult && (
              <div className="mt-3">
                {myResult.result_type === 'exact' && (
                  <div className="bg-brand-success/10 border border-brand-success rounded-xl p-3 text-center">
                    <div className="text-brand-success font-bold text-sm">🎯 Perfect Prediction!</div>
                    <div className="text-brand-text-secondary text-xs">+3 points earned</div>
                  </div>
                )}
                {myResult.result_type === 'correct_result' && (
                  <div className="bg-brand-primary/10 border border-brand-primary rounded-xl p-3 text-center">
                    <div className="text-brand-primary font-bold text-sm">✅ Correct Result!</div>
                    <div className="text-brand-text-secondary text-xs">You got the winner right — +1 point</div>
                  </div>
                )}
                {myResult.result_type === 'wrong' && (
                  <div className="bg-brand-secondary border border-brand-border rounded-xl p-3 text-center">
                    <div className="text-brand-text-secondary font-bold text-sm">❌ Not this time</div>
                    <div className="text-brand-text-primary text-sm">Actual score: {myResult.actual_home} - {myResult.actual_away}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
