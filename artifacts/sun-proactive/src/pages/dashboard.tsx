import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetTasks } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MapPin, Clock, Users, Zap, CheckCircle2, Award, Calendar, Activity } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect } from "react";

interface Recommendation {
  task: {
    id: number;
    title: string;
    description: string;
    location: string;
    date: string;
    duration: number;
    requiredPeople: number;
    applicantsCount: number;
    category: string;
    skillsRequired: string[];
  };
  matchScore: number;
  reasons: string[];
  personalMessage: string;
}

export default function Dashboard() {
  const { user, token } = useAuth();
  const { t } = useI18n();
  const [aiRec, setAiRec] = useState<Recommendation | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  const { data: tasks = [], isLoading: isLoadingTasks } = useGetTasks({
    query: {
      queryKey: ["/api/tasks", { status: "published" }],
    }
  });

  useEffect(() => {
    if (!token || !user || user.role !== "volunteer") return;
    setRecLoading(true);
    const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    fetch(`${baseUrl}/api/ai/personal-recommendation`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setAiRec(data[0]);
        else if (tasks.length > 0) setAiRec(null);
      })
      .catch(() => {})
      .finally(() => setRecLoading(false));
  }, [token, user]);

  const recommendation = aiRec?.task || (tasks.length > 0 ? tasks[0] : null);
  const recMatchScore = aiRec?.matchScore;
  const recMessage = aiRec?.personalMessage;

  const recentActivity = user?.language === "kz"
    ? [
        { id: 1, title: "Алматы орталық паркіне 50 ағаш отырғызылды", time: "2 сағат бұрын", points: "+50 XP" },
        { id: 2, title: "'Жасыл қорғаушы' белгісі алынды", time: "1 күн бұрын", points: "" },
        { id: 3, title: "Жергілікті ҮЕҰ үшін АТ жабдықталды", time: "3 күн бұрын", points: "+120 XP" },
      ]
    : user?.language === "en"
    ? [
        { id: 1, title: "Planted 50 trees in Almaty Central Park", time: "2 hours ago", points: "+50 XP" },
        { id: 2, title: "Earned 'Green Guardian' Badge", time: "1 day ago", points: "" },
        { id: 3, title: "Completed IT Setup for local NGO", time: "3 days ago", points: "+120 XP" },
      ]
    : [
        { id: 1, title: "Посажено 50 деревьев в парке Горького", time: "2 часа назад", points: "+50 XP" },
        { id: 2, title: "Получен бейдж «Зелёный защитник»", time: "1 день назад", points: "" },
        { id: 3, title: "Завершена IT-настройка для местной НПО", time: "3 дня назад", points: "+120 XP" },
      ];

  if (!user) return null;

  const xpProgress = (user.xp % 1000) / 10;

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {t("dashboard.welcome")}, {user.name}
            </h1>
            <p className="text-slate-500">{t("dashboard.ready")}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/tasks">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                {t("dashboard.find_tasks")}
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
            
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-lg">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-amber-500 flex items-center justify-center text-3xl font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                      {user.level}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-900 text-xs font-bold px-2 py-1 rounded-full">
                      Lvl
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300 font-medium">{t("dashboard.experience")}</span>
                        <span className="text-amber-400 font-bold">{user.xp} / {(user.level + 1) * 1000} XP</span>
                      </div>
                      <Progress value={xpProgress} className="h-3 bg-slate-700 [&>div]:bg-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-sm text-slate-400 mb-2">{t("dashboard.badges")}</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.badges && user.badges.length > 0 ? (
                          user.badges.map(b => (
                            <Badge key={b} variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10">
                              <Award className="w-3 h-3 mr-1" /> {b}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">{t("dashboard.no_badges")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-xl font-bold flex items-center gap-2 mt-4 text-slate-800">
              <Zap className="w-5 h-5 text-amber-500" />
              {t("dashboard.ai_recommended")}
            </h2>

            {recLoading ? (
              <Card><CardContent className="p-8 text-center text-slate-500">{t("dashboard.loading_rec")}</CardContent></Card>
            ) : recommendation ? (
              <Card className="border-amber-200 shadow-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 mb-2 border-none">
                        {recMatchScore ?? 98}% {t("dashboard.match")}
                      </Badge>
                      <h3 className="text-xl font-bold text-slate-900">{recommendation.title}</h3>
                    </div>
                    <Badge variant="outline" className="border-slate-300 text-slate-600">
                      {recommendation.category}
                    </Badge>
                  </div>
                  <p className="text-slate-600 text-sm mb-6 line-clamp-2">{recommendation.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{recommendation.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{new Date(recommendation.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{recommendation.duration} {t("common.hours")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{recommendation.applicantsCount}/{recommendation.requiredPeople}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500 italic">
                      "{recMessage || ""}"
                    </p>
                    <Link href={`/tasks/${recommendation.id}`}>
                      <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                        {t("dashboard.view_details")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-slate-500">
                  {isLoadingTasks ? t("dashboard.loading_rec") : t("dashboard.no_recommendations")}
                </CardContent>
              </Card>
            )}

            <h2 className="text-xl font-bold flex items-center gap-2 mt-4 text-slate-800">
              <MapPin className="w-5 h-5 text-amber-500" />
              {t("dashboard.nearby")}
            </h2>
            <Card className="overflow-hidden border-slate-200">
              <div className="h-64 bg-slate-100 relative w-full flex items-center justify-center">
                <svg width="100%" height="100%" className="absolute inset-0 opacity-20">
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-300" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
                {tasks.slice(0, 3).map((task, i) => (
                  <div key={task.id} className="absolute flex flex-col items-center" style={{ left: `${30 + i * 20}%`, top: `${40 + (i % 2 === 0 ? -10 : 20)}%` }}>
                    <div className="w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-md animate-pulse"></div>
                    <div className="bg-white px-2 py-1 rounded shadow-sm text-xs font-bold mt-1 whitespace-nowrap border border-slate-100">
                      {task.title.substring(0, 15)}...
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{user.tasksCompleted || 0}</div>
                  <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{t("dashboard.tasks_done")}</div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{user.totalHours || 0}</div>
                  <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{t("dashboard.hours")}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200 shadow-sm flex-1">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-slate-400" />
                  {t("dashboard.recent_activity")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-medium text-slate-800">{activity.title}</p>
                        {activity.points && (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            {activity.points}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{activity.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-slate-100">
                  <Button variant="ghost" className="w-full text-sm text-slate-600">
                    {t("dashboard.view_all")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
