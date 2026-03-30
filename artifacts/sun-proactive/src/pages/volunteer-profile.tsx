import { useParams } from "wouter";
import { Layout } from "@/components/layout";
import { useGetVolunteer, useGetReputationAnalysis } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, Star, Award, TrendingUp, TrendingDown, Minus, Clock, CheckCircle2, Activity } from "lucide-react";

export default function VolunteerProfile() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);

  const { data: profile, isLoading } = useGetVolunteer(id, {
    query: {
      enabled: !!id,
      queryKey: ["/api/volunteers", id]
    }
  });

  const { data: rep } = useGetReputationAnalysis(id, {
    query: {
      enabled: !!id,
      queryKey: ["/api/volunteers/reputation", id]
    }
  });

  if (isLoading) return <Layout><div className="p-12 text-center text-slate-500">Loading profile...</div></Layout>;
  if (!profile) return <Layout><div className="p-12 text-center text-red-500">Profile not found</div></Layout>;

  const TrendIcon = rep?.trend === 'improving' ? TrendingUp : 
                    rep?.trend === 'declining' ? TrendingDown : Minus;
  
  const trendColor = rep?.trend === 'improving' ? 'text-green-500' : 
                     rep?.trend === 'declining' ? 'text-red-500' : 'text-slate-400';

  return (
    <Layout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Header Profile Card */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[50px] -z-0"></div>
          <CardContent className="p-8 relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-slate-700 shadow-xl">
                <AvatarFallback className="bg-slate-100 text-slate-900 text-4xl font-bold">
                  {profile.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-4 -right-2 bg-amber-500 text-slate-900 text-sm font-bold w-12 h-12 rounded-full flex items-center justify-center border-4 border-slate-800 shadow-lg">
                {profile.level}
              </div>
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">{profile.name}</h1>
                <p className="text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  Verified Volunteer • Joined {profile.location ? `from ${profile.location}` : 'recently'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-700/50">
                <div>
                  <div className="text-2xl font-bold text-white">{profile.tasksCompleted}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tasks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{profile.totalHours}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Hours</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-400 flex items-center justify-center md:justify-start gap-1">
                    {profile.rating.toFixed(1)} <Star className="w-4 h-4 fill-current" />
                  </div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Rating</div>
                </div>
              </div>

              {profile.bio && (
                <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                  "{profile.bio}"
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-lg">Completed Tasks</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {profile.completedTasks?.length ? profile.completedTasks.map((task: any) => (
                    <div key={task.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                      <div className="mt-1">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{task.title}</h4>
                        <div className="flex gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.duration}h</span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded">{task.category}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-slate-500">No completed tasks to show yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" /> Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {profile.achievements?.map((ach: any) => (
                    <div key={ach.id} className={`flex flex-col items-center text-center p-4 rounded-xl border ${ach.earned ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200 opacity-60 grayscale'}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 ${ach.earned ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'}`}>
                        {/* Assuming ach.icon is an emoji or short string in DB, fallback to badge icon */}
                        <Award className="w-6 h-6" />
                      </div>
                      <h5 className="font-bold text-sm text-slate-900 leading-tight mb-1">{ach.name}</h5>
                      <p className="text-[10px] text-slate-500 leading-tight">{ach.description}</p>
                    </div>
                  ))}
                  {(!profile.achievements || profile.achievements.length === 0) && (
                    <div className="col-span-full text-center text-slate-500 py-4">Achievements data unavailable.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-1 flex flex-col gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-lg">Skills & Interests</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Verified Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill: string) => (
                      <Badge key={skill} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-indigo-500" /> {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {profile.interests && profile.interests.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Causes</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((int: string) => (
                        <Badge key={int} variant="outline" className="bg-white">
                          {int}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-indigo-100 bg-indigo-50/30 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-indigo-100 opacity-50 pointer-events-none">
                <Activity className="w-32 h-32" />
              </div>
              <CardHeader className="pb-0 relative z-10">
                <CardTitle className="text-base flex items-center justify-between text-indigo-900">
                  <span>AI Reputation</span>
                  {rep && (
                    <Badge variant="outline" className={`border-none ${trendColor} bg-white flex items-center gap-1`}>
                      <TrendIcon className="w-3 h-3" /> {rep.trend}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 relative z-10 space-y-5">
                {rep ? (
                  <>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-indigo-700 leading-none">{rep.overallScore}</span>
                      <span className="text-sm font-medium text-indigo-400 mb-1">/ 100</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1 text-slate-600 font-medium">
                          <span>Reliability</span>
                          <span>{rep.reliability}%</span>
                        </div>
                        <Progress value={rep.reliability} className="h-1.5 [&>div]:bg-indigo-500 bg-indigo-100" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1 text-slate-600 font-medium">
                          <span>Activity Level</span>
                          <span>{rep.activity}%</span>
                        </div>
                        <Progress value={rep.activity} className="h-1.5 [&>div]:bg-indigo-400 bg-indigo-100" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1 text-slate-600 font-medium">
                          <span>Behavior</span>
                          <span>{rep.behavior}%</span>
                        </div>
                        <Progress value={rep.behavior} className="h-1.5 [&>div]:bg-indigo-400 bg-indigo-100" />
                      </div>
                    </div>

                    <div className="bg-white rounded p-3 border border-indigo-100 text-sm text-indigo-800 italic shadow-sm">
                      {rep.predictedFutureBehavior}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Reputation analysis not available.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
