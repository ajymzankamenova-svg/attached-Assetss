import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Trophy, Medal, Star, Zap, Clock, Target } from "lucide-react";
import { Link } from "wouter";

interface LeaderboardEntry {
  id: number;
  name: string;
  level: number;
  xp: number;
  tasksCompleted: number;
  totalHours: number;
  badges: string[];
  rank: number;
  impactScore: number;
  levelInfo: { name: string; nameRu: string; nameEn: string; icon: string };
}

const RANK_STYLES = [
  { bg: "bg-amber-50 border-amber-200", num: "text-amber-600", icon: <Trophy className="w-5 h-5 text-amber-500" /> },
  { bg: "bg-slate-50 border-slate-200", num: "text-slate-600", icon: <Medal className="w-5 h-5 text-slate-400" /> },
  { bg: "bg-orange-50 border-orange-200", num: "text-orange-600", icon: <Medal className="w-5 h-5 text-orange-400" /> },
];

export default function Leaderboard() {
  const { token, user } = useAuth();
  const { t, language } = useI18n();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    fetch(`${baseUrl}/api/gamification/leaderboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEntries(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const getLevelName = (li: LeaderboardEntry["levelInfo"]) =>
    language === "kz" ? li.name : language === "en" ? li.nameEn : li.nameRu;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2 justify-center">
            <Trophy className="w-8 h-8 text-amber-500" />
            {t("leaderboard.title")}
          </h1>
          <p className="text-slate-500 mt-1">{t("leaderboard.subtitle")}</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, idx) => {
              const rankStyle = RANK_STYLES[idx] || { bg: "bg-white border-slate-200", num: "text-slate-500", icon: null };
              const isMe = entry.id === user?.id;

              return (
                <Card key={entry.id} className={`border ${rankStyle.bg} ${isMe ? "ring-2 ring-amber-400 ring-offset-2" : ""} transition-all hover:shadow-md`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${rankStyle.num} bg-white border border-current/20`}>
                        {entry.rank <= 3 ? rankStyle.icon : `#${entry.rank}`}
                      </div>

                      <Avatar className="w-12 h-12 shrink-0">
                        <AvatarFallback className="bg-slate-100 text-slate-700 font-bold text-base">
                          {entry.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-slate-900 truncate">{entry.name}</p>
                          {isMe && <Badge className="bg-amber-100 text-amber-800 border-none text-xs">You</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{entry.levelInfo.icon}</span>
                          <span className="text-xs text-slate-500">{getLevelName(entry.levelInfo)}</span>
                          <span className="text-xs text-slate-400">• Lv.{entry.level}</span>
                        </div>
                        <div className="flex gap-3 mt-1.5">
                          {entry.badges?.slice(0, 3).map(b => (
                            <span key={b} className="text-sm">{b.split(" ").pop()}</span>
                          ))}
                        </div>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-bold text-slate-900 text-sm">{entry.xp} XP</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <Target className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-slate-500">{entry.tasksCompleted} {t("gamification.tasks_done")}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-slate-500">{entry.totalHours}h</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-center min-w-[60px]">
                        <div className="text-lg font-bold text-indigo-600">{entry.impactScore}</div>
                        <div className="text-xs text-slate-400">{t("gamification.impact")}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
