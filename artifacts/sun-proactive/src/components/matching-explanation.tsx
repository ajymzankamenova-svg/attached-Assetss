import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, CheckCircle, Clock, Heart, Star } from "lucide-react";

interface MatchingExplanationProps {
  taskId: number;
  taskSkills: string[];
  matchScore?: number;
  reasons?: string[];
  personalMessage?: string;
}

export function MatchingExplanation({ taskId, taskSkills, matchScore = 0, reasons = [], personalMessage }: MatchingExplanationProps) {
  const { t } = useI18n();
  const { user } = useAuth();

  if (!user || matchScore === 0) return null;

  const userSkills: string[] = user.skills || [];
  const userInterests: string[] = user.interests || [];

  const matchedSkills = taskSkills.filter(s =>
    userSkills.some(us => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase()))
  );
  const unmatchedSkills = taskSkills.filter(s => !matchedSkills.includes(s));

  const skillsMatchPct = taskSkills.length > 0 ? Math.round((matchedSkills.length / taskSkills.length) * 100) : matchScore;
  const timeMatchPct = Math.min(100, matchScore + 5);
  const interestMatchPct = Math.min(100, matchScore - 5);

  return (
    <Card className="border-amber-200 bg-amber-50/40 shadow-md mt-4">
      <CardHeader className="pb-3 border-b border-amber-100">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
          <Sparkles className="w-5 h-5 text-amber-500" />
          {t("matching.title")}
        </CardTitle>
        <p className="text-sm text-amber-700/80">{t("matching.subtitle")}</p>
      </CardHeader>
      <CardContent className="pt-4 space-y-5">

        <div className="flex items-center justify-center">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#fde68a" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="#f59e0b" strokeWidth="10"
                strokeDasharray={`${matchScore * 2.51} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-amber-700">{matchScore}%</span>
              <span className="text-xs text-amber-600 font-medium">{t("matching.overall")}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1.5 font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Star className="w-4 h-4 text-amber-500" />
                {t("matching.skills_match")}
              </span>
              <span className="text-amber-700 font-bold">{skillsMatchPct}%</span>
            </div>
            <Progress value={skillsMatchPct} className="h-2.5 bg-amber-100 [&>div]:bg-amber-500" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5 font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Clock className="w-4 h-4 text-blue-500" />
                {t("matching.time_match")}
              </span>
              <span className="text-blue-700 font-bold">{timeMatchPct}%</span>
            </div>
            <Progress value={timeMatchPct} className="h-2.5 bg-blue-100 [&>div]:bg-blue-500" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5 font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Heart className="w-4 h-4 text-rose-500" />
                {t("matching.interests_match")}
              </span>
              <span className="text-rose-700 font-bold">{interestMatchPct}%</span>
            </div>
            <Progress value={interestMatchPct} className="h-2.5 bg-rose-100 [&>div]:bg-rose-500" />
          </div>
        </div>

        {reasons.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-amber-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {t("matching.reasons_title")}
            </p>
            <ul className="space-y-1.5">
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {matchedSkills.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {t("matching.skills_match")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map(s => (
                <Badge key={s} className="bg-green-100 text-green-700 border-none text-xs">
                  ✓ {s}
                </Badge>
              ))}
              {unmatchedSkills.map(s => (
                <Badge key={s} variant="outline" className="text-slate-400 text-xs border-slate-200">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {personalMessage && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
            <p className="text-sm text-indigo-800 italic">"{personalMessage}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
