import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Zap, Star, Target, CheckCircle2, Lock, Gift, TrendingUp } from "lucide-react";

interface Quest {
  id: string;
  icon: string;
  titleKz: string;
  titleRu: string;
  titleEn: string;
  descKz: string;
  descRu: string;
  descEn: string;
  target: number;
  unit: string;
  xpReward: number;
  badge: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

interface Achievement {
  id: string;
  icon: string;
  badge: string;
  descKz: string;
  descRu: string;
  descEn: string;
  earned: boolean;
}

interface LevelInfo {
  name: string;
  nameRu: string;
  nameEn: string;
  icon: string;
}

interface GamificationData {
  user: {
    level: number;
    xp: number;
    xpForNext: number;
    xpProgress: number;
    totalHours: number;
    tasksCompleted: number;
  };
  levelInfo: LevelInfo;
  nextLevel: LevelInfo | null;
  quests: Quest[];
  achievements: Achievement[];
  impactScore: number;
}

export function GamificationPanel() {
  const { token } = useAuth();
  const { t, language } = useI18n();
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"quests" | "achievements">("quests");

  const fetchData = async () => {
    if (!token) return;
    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      const res = await fetch(`${baseUrl}/api/gamification/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(json);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleClaim = async (questId: string) => {
    if (!token || claiming) return;
    setClaiming(questId);
    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      await fetch(`${baseUrl}/api/gamification/claim-quest/${questId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData();
    } catch {}
    setClaiming(null);
  };

  const getLabel = (item: any, field: string) => {
    const lang = language === "kz" ? "Kz" : language === "en" ? "En" : "Ru";
    return item[`${field}${lang}`] || item[`${field}Ru`] || "";
  };

  if (loading) return (
    <Card className="border-slate-200 animate-pulse">
      <CardContent className="p-6 h-48 bg-slate-50/80 rounded-xl" />
    </Card>
  );

  if (!data) return null;

  const { user, levelInfo, quests, achievements, impactScore } = data;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <CardHeader className="pb-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-white">{t("gamification.title")}</span>
          </CardTitle>
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-sm font-bold px-3 py-1">
            {levelInfo.icon} {language === "kz" ? levelInfo.name : language === "en" ? levelInfo.nameEn : levelInfo.nameRu}
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{t("gamification.level")} {user.level}</span>
            <span className="text-amber-400 font-bold">{user.xp} / {user.xpForNext} XP</span>
          </div>
          <Progress value={user.xpProgress} className="h-2.5 bg-slate-700 [&>div]:bg-amber-400" />
          {data.nextLevel && (
            <p className="text-xs text-slate-500">
              {t("gamification.next")}: {language === "kz" ? data.nextLevel.name : language === "en" ? data.nextLevel.nameEn : data.nextLevel.nameRu} {data.nextLevel.icon}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <div className="text-xl font-bold text-amber-400">{user.tasksCompleted}</div>
            <div className="text-xs text-slate-400">{t("gamification.tasks_done")}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <div className="text-xl font-bold text-blue-400">{user.totalHours}</div>
            <div className="text-xs text-slate-400">{t("common.hours")}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <div className="text-xl font-bold text-green-400">{impactScore}</div>
            <div className="text-xs text-slate-400">{t("gamification.impact")}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("quests")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "quests" ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Target className="w-4 h-4 inline mr-1.5" />{t("gamification.quests")}
          </button>
          <button
            onClick={() => setActiveTab("achievements")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "achievements" ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Star className="w-4 h-4 inline mr-1.5" />{t("gamification.achievements")}
          </button>
        </div>

        {activeTab === "quests" && (
          <div className="p-4 space-y-3">
            {quests.map(q => (
              <div key={q.id} className={`rounded-xl p-3.5 border transition-all ${q.claimed ? "bg-white/3 border-white/5 opacity-50" : q.completed ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/10"}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{q.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm text-white truncate">{getLabel(q, "title")}</p>
                      <Badge className={`shrink-0 text-xs border-none font-bold ${q.claimed ? "bg-slate-700 text-slate-400" : "bg-amber-500/20 text-amber-300"}`}>
                        +{q.xpReward} XP
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{getLabel(q, "desc")}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-300">{q.progress}/{q.target}</span>
                    </div>
                  </div>
                </div>
                {q.completed && !q.claimed && (
                  <Button
                    size="sm"
                    onClick={() => handleClaim(q.id)}
                    disabled={claiming === q.id}
                    className="w-full mt-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs h-8"
                  >
                    <Gift className="w-3.5 h-3.5 mr-1.5" />
                    {claiming === q.id ? "..." : t("gamification.claim")}
                  </Button>
                )}
                {q.claimed && (
                  <p className="text-xs text-center text-slate-500 mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-green-500" />
                    {t("gamification.claimed")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {achievements.map(a => (
                <div key={a.id} className={`rounded-xl p-3 border text-center transition-all ${a.earned ? "bg-amber-500/10 border-amber-500/30" : "bg-white/3 border-white/5 opacity-40"}`}>
                  <div className="text-2xl mb-1">{a.icon}</div>
                  <p className="text-xs font-semibold text-white leading-tight">{getLabel(a, "desc")}</p>
                  {a.earned ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto mt-1.5" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-600 mx-auto mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
