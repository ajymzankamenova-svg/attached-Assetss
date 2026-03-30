import { useParams } from "wouter";
import { Layout } from "@/components/layout";
import { useGetTask, useMatchVolunteers, useBuildTeam } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Brain, Users, CheckCircle, Shield, Search } from "lucide-react";
import { useState } from "react";

export default function AdminTaskDetail() {
  const params = useParams();
  const taskId = parseInt(params.id || "0", 10);
  
  const [activeTab, setActiveTab] = useState("applications");

  const { data: task, isLoading } = useGetTask(taskId, {
    query: {
      enabled: !!taskId,
      queryKey: ["/api/tasks", taskId]
    }
  });

  const matchMutation = useMatchVolunteers(taskId, {
    mutation: {
      onSuccess: (data) => {
        // Handle result natively or display in UI
      }
    }
  });

  const teamMutation = useBuildTeam({
    mutation: {
      onSuccess: () => {
        // trigger refetch or state update
      }
    }
  });

  const handleRunAI = () => {
    matchMutation.mutate();
  };

  const handleBuildTeam = () => {
    teamMutation.mutate({ data: { taskId } });
  };

  if (isLoading) return <Layout><div className="p-12 text-center">Loading...</div></Layout>;
  if (!task) return <Layout><div className="p-12 text-center text-red-500">Not found</div></Layout>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <header className="flex justify-between items-start">
          <div>
            <div className="flex gap-2 items-center mb-2">
              <Badge variant="outline" className="bg-slate-100">{task.status.toUpperCase()}</Badge>
              <Badge className="bg-indigo-100 text-indigo-800 border-none font-semibold">
                AI Quality: {task.qualityScore}/100
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{task.title}</h1>
            <p className="text-slate-500 mt-1">{task.applicantsCount} of {task.requiredPeople} applicants currently</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRunAI} disabled={matchMutation.isPending} className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
              <Brain className="w-4 h-4 mr-2" /> {matchMutation.isPending ? "Scoring..." : "Run AI Match Scoring"}
            </Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleBuildTeam} disabled={teamMutation.isPending}>
              <Users className="w-4 h-4 mr-2" /> Auto-Build Team
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1">
            <TabsTrigger value="applications">Applications ({task.applications?.length || 0})</TabsTrigger>
            <TabsTrigger value="team">Team Structure</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4">
            {task.applications && task.applications.length > 0 ? (
              <div className="grid gap-4">
                {task.applications.map(app => (
                  <Card key={app.id} className="border-slate-200">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border border-slate-200">
                          <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">
                            {app.volunteerName.substring(0,2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-slate-900">{app.volunteerName}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className="text-slate-500">{app.volunteerEmail}</span>
                            {app.matchScore && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 border-none px-1.5 py-0">
                                {app.matchScore}% Match
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">Approve</Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">Reject</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-slate-500 flex flex-col items-center">
                  <Search className="w-8 h-8 text-slate-300 mb-3" />
                  <p>No applications yet.</p>
                  <p className="text-sm mt-1">Run AI Match to find and notify suitable candidates.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="team">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  AI Generated Team Structure
                </CardTitle>
                <CardDescription>Based on psychological profiles, skills, and past performance.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!task.teamRoles ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>Team structure hasn't been generated yet.</p>
                    <Button variant="link" onClick={handleBuildTeam} className="text-indigo-600">Generate now</Button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Render team roles here based on API shape */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider">Leader</h3>
                      {task.teamRoles.leader ? (
                        <div className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50 rounded-lg">
                          <Avatar><AvatarFallback>LD</AvatarFallback></Avatar>
                          <div>
                            <p className="font-bold">{task.teamRoles.leader.name}</p>
                            <p className="text-xs text-amber-700">{task.teamRoles.leader.reason}</p>
                          </div>
                        </div>
                      ) : <p className="text-sm text-slate-500 italic">No leader assigned</p>}
                      
                      <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider pt-4">Executors</h3>
                      <div className="grid gap-3">
                        {task.teamRoles.executors.map((ex: any) => (
                           <div key={ex.volunteerId} className="flex items-center gap-3 p-3 border border-slate-200 bg-white rounded-lg">
                             <Avatar><AvatarFallback>EX</AvatarFallback></Avatar>
                             <div>
                               <p className="font-bold">{ex.name}</p>
                               <p className="text-xs text-slate-500">{ex.reason}</p>
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification">
            <Card>
              <CardContent className="p-12 text-center text-slate-500">
                <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p>No completion photos pending review.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
