import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Crown, Zap, MessageCircle, Loader2, Star } from "lucide-react";

interface TeamMember {
  volunteerId: number;
  name: string;
  role: string;
  matchScore: number;
  reason: string;
}

interface TeamResult {
  leader: TeamMember | null;
  executors: TeamMember[];
  communicators: TeamMember[];
  reasoning: string;
  notificationssSent?: number;
}

interface TeamBuilderProps {
  taskId: number;
  adminOnly?: boolean;
}

const roleConfig = {
  leader: { icon: Crown, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", labelKey: "team.leader" },
  executor: { icon: Zap, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", labelKey: "team.executor" },
  communicator: { icon: MessageCircle, color: "text-green-600", bg: "bg-green-50 border-green-200", labelKey: "team.communicator" },
};

function MemberCard({ member, roleKey }: { member: TeamMember; roleKey: keyof typeof roleConfig }) {
  const { t } = useI18n();
  const cfg = roleConfig[roleKey];
  const Icon = cfg.icon;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.bg}`}>
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className={`text-sm font-bold ${cfg.color} bg-white border`}>
          {member.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-slate-800 text-sm truncate">{member.name}</p>
          <Badge className={`text-xs border-none shrink-0 ${roleKey === "leader" ? "bg-amber-100 text-amber-800" : roleKey === "executor" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
            <Icon className="w-3 h-3 mr-1" />
            {t(cfg.labelKey)}
          </Badge>
        </div>
        <p className="text-xs text-slate-600 mb-1 line-clamp-2">{member.reason}</p>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span className="font-semibold text-slate-700">{member.matchScore}%</span>
          <span>{t("team.match")}</span>
        </div>
      </div>
    </div>
  );
}

export function TeamBuilder({ taskId, adminOnly = false }: TeamBuilderProps) {
  const { t } = useI18n();
  const { token, user } = useAuth();
  const [isBuilding, setIsBuilding] = useState(false);
  const [team, setTeam] = useState<TeamResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (adminOnly && user?.role !== "admin") return null;

  const handleBuildTeam = async () => {
    if (!token) return;
    setIsBuilding(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      const res = await fetch(`${baseUrl}/api/ai/build-team/${taskId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Team building failed");
      const data = await res.json();
      setTeam(data.team ? data : { team: data, reasoning: data.reasoning });
    } catch (err) {
      setError(t("common.error"));
    } finally {
      setIsBuilding(false);
    }
  };

  const teamData = team?.team || team;

  return (
    <Card className="border-slate-200 shadow-md mt-4">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
          <Users className="w-5 h-5 text-indigo-500" />
          {t("team.title")}
        </CardTitle>
        <p className="text-sm text-slate-500">{t("team.subtitle")}</p>
      </CardHeader>
      <CardContent className="pt-4">
        {!team ? (
          <Button
            onClick={handleBuildTeam}
            disabled={isBuilding}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isBuilding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("team.building")}
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                {t("team.build_btn")}
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            {teamData?.leader && (
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
                  👑 {t("team.leader")}
                </p>
                <MemberCard member={teamData.leader} roleKey="leader" />
              </div>
            )}

            {teamData?.executors?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                  ⚡ {t("team.executor")}
                </p>
                <div className="space-y-2">
                  {teamData.executors.map((m: TeamMember) => (
                    <MemberCard key={m.volunteerId} member={m} roleKey="executor" />
                  ))}
                </div>
              </div>
            )}

            {teamData?.communicators?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">
                  💬 {t("team.communicator")}
                </p>
                <div className="space-y-2">
                  {teamData.communicators.map((m: TeamMember) => (
                    <MemberCard key={m.volunteerId} member={m} roleKey="communicator" />
                  ))}
                </div>
              </div>
            )}

            {(team?.reasoning || teamData?.reasoning) && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t("team.reasoning")}
                </p>
                <p className="text-sm text-slate-700">{team?.reasoning || teamData?.reasoning}</p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setTeam(null)}
            >
              {t("team.build_btn")}
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
