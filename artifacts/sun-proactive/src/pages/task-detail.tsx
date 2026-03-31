import { useParams } from "wouter";
import { Layout } from "@/components/layout";
import { useGetTask, useApplyToTask } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Users, ArrowLeft, ShieldAlert, Sparkles, Brain } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MatchingExplanation } from "@/components/matching-explanation";
import { PhotoVerification } from "@/components/photo-verification";
import { TeamBuilder } from "@/components/team-builder";

export default function TaskDetail() {
  const params = useParams();
  const taskId = parseInt(params.id || "0", 10);
  const { toast } = useToast();
  const { user, token } = useAuth();
  const { t, language } = useI18n();
  const [chatQuery, setChatQuery] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [aiMatch, setAiMatch] = useState<{ matchScore: number; reasons: string[]; personalMessage: string } | null>(null);
  const [applicationId, setApplicationId] = useState<number | null>(null);

  const { data: task, isLoading } = useGetTask(taskId, {
    query: {
      enabled: !!taskId,
      queryKey: ["/api/tasks", taskId]
    }
  });

  const applyMutation = useApplyToTask({
    mutation: {
      onSuccess: (data: any) => {
        toast({ title: t("task.applied") });
        if (data?.id) setApplicationId(data.id);
      },
      onError: (err: any) => {
        toast({
          title: t("common.error"),
          description: err.data?.message || t("common.error"),
          variant: "destructive"
        });
      }
    }
  });

  useEffect(() => {
    if (!token || !user || !taskId || user.role !== "volunteer") return;
    const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    fetch(`${baseUrl}/api/ai/personal-recommendation`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const match = data.find((r: any) => r.task?.id === taskId);
          if (match) setAiMatch({ matchScore: match.matchScore, reasons: match.reasons, personalMessage: match.personalMessage });
        }
      })
      .catch(() => {});
  }, [token, user, taskId]);

  const handleApply = () => {
    applyMutation.mutate({ data: { taskId } });
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || !token) return;
    setIsChatLoading(true);
    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      const res = await fetch(`${baseUrl}/api/ai/chatbot/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: chatQuery, language }),
      });
      const data = await res.json();
      setChatResponse(data.answer || t("common.error"));
    } catch {
      setChatResponse(t("common.error"));
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isLoading) return <Layout><div className="p-12 text-center text-slate-500">{t("common.loading")}</div></Layout>;
  if (!task) return <Layout><div className="p-12 text-center text-red-500">{t("common.no_results")}</div></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/tasks">
            <Button variant="ghost" size="sm" className="p-0 h-8 w-8 rounded-full text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">{task.category}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-slate-900 leading-tight">{task.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600 font-medium pb-6 border-b border-slate-200">
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-md">
                  <MapPin className="w-4 h-4 text-amber-500" /> {task.location}
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-md">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  {new Date(task.date).toLocaleDateString(language === "kz" ? "kk-KZ" : language === "ru" ? "ru-RU" : "en-US")}
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-md">
                  <Clock className="w-4 h-4 text-amber-500" /> {task.duration} {t("common.hours")}
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-md">
                  <Users className="w-4 h-4 text-amber-500" /> {task.applicantsCount} / {task.requiredPeople} {t("common.spots")}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2 mb-3">
                {t("task.about")}
              </h3>
              <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">{task.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">{t("task.skills")}</h3>
              <div className="flex flex-wrap gap-2">
                {task.skillsRequired.map(skill => (
                  <Badge key={skill} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm py-1 px-3">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {aiMatch && (
              <MatchingExplanation
                taskId={taskId}
                taskSkills={task.skillsRequired}
                matchScore={aiMatch.matchScore}
                reasons={aiMatch.reasons}
                personalMessage={aiMatch.personalMessage}
              />
            )}

            {applicationId && (
              <PhotoVerification applicationId={applicationId} />
            )}

            {user?.role === "admin" && (
              <TeamBuilder taskId={taskId} adminOnly />
            )}

            <Card className="border-indigo-100 bg-indigo-50/50 shadow-sm mt-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  {t("task.ask_ai")}
                </CardTitle>
                <CardDescription className="text-indigo-700/70">
                  {t("task.ask_ai_desc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAskAI} className="flex gap-2 mb-4">
                  <Input
                    placeholder={t("task.ask_placeholder")}
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    className="bg-white border-indigo-200 focus-visible:ring-indigo-500"
                  />
                  <Button type="submit" disabled={isChatLoading || !chatQuery.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {isChatLoading ? "..." : t("task.ask_btn")}
                  </Button>
                </form>
                {chatResponse && (
                  <div className="p-4 bg-white rounded-md border border-indigo-100 text-slate-700 text-sm leading-relaxed shadow-sm">
                    <div className="flex gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <p>{chatResponse}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="col-span-1 flex flex-col gap-6">
            <Card className="border-slate-200 shadow-xl shadow-slate-200/50 sticky top-24">
              <CardContent className="p-6">
                <Button
                  className="w-full h-14 text-lg font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 mb-4 transition-all hover:scale-[1.02]"
                  onClick={handleApply}
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? t("task.applying") : t("common.apply")}
                </Button>
                <p className="text-center text-sm text-slate-500 mb-6 font-medium">
                  {task.requiredPeople - task.applicantsCount} {t("task.spots_remaining")}
                </p>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-slate-900 font-semibold">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      {t("task.ai_analysis")}
                    </div>
                    <div className="space-y-3 mt-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-medium">
                          <span className="text-slate-600">{t("task.success_pred")}</span>
                          <span className="text-green-600">{task.successPrediction || 85}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${task.successPrediction || 85}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-medium">
                          <span className="text-slate-600">{t("task.quality_score")}</span>
                          <span className="text-blue-600">{task.qualityScore || 92}/100</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.qualityScore || 92}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-rose-50 rounded-lg p-4 border border-rose-100">
                    <div className="flex items-center gap-2 mb-2 text-rose-900 font-semibold">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      {t("task.risk")}
                    </div>
                    <p className="text-xs text-rose-700/80">
                      {language === "kz"
                        ? "Төмен тәуекел. Негізгі алаңдаушылық: Ауа-райы жағдайлары (сыртқы белсенділік)."
                        : language === "ru"
                        ? "Низкий риск. Основная проблема: Погодные условия (активность на открытом воздухе)."
                        : "Low Risk. Main concern: Weather conditions (outdoor activity)."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {user?.role === "admin" && (
              <Card className="border-indigo-200 bg-indigo-50">
                <CardContent className="p-4">
                  <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> {t("task.admin_controls")}
                  </h4>
                  <Link href={`/admin/tasks/${task.id}`}>
                    <Button variant="outline" className="w-full bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-100">
                      {t("task.manage_apps")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
