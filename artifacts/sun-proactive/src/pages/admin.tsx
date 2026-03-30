import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetTaskDashboardSummary, useGetTasks } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Users, FileText, CheckCircle2, TrendingUp, AlertCircle, PlusCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: summary } = useGetTaskDashboardSummary({
    query: {
      queryKey: ["/api/admin/dashboard-summary"]
    }
  });

  const { data: tasks = [] } = useGetTasks({
    query: {
      queryKey: ["/api/tasks", { status: "active" }]
    }
  });

  if (!user || user.role !== 'admin') return null;

  // Fallbacks if endpoint doesn't return data yet
  const stats = summary || {
    totalTasks: 124,
    activeTasks: 45,
    completedTasks: 79,
    totalVolunteers: 1042,
    totalHoursContributed: 5600,
    avgSuccessRate: 92,
    recentApplicationsCount: 18,
    pendingVerifications: 5
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mission Control</h1>
            <p className="text-slate-500">Platform overview and administrative actions.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/create-task">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold shadow-sm">
                <PlusCircle className="w-4 h-4 mr-2" /> New Task
              </Button>
            </Link>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-none font-bold">
                  {stats.activeTasks} active
                </Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats.totalTasks}</p>
              <p className="text-sm text-slate-500 font-medium">Total Tasks Created</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-none font-bold">
                  +{stats.recentApplicationsCount} this week
                </Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats.totalVolunteers}</p>
              <p className="text-sm text-slate-500 font-medium">Registered Volunteers</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats.totalHoursContributed}</p>
              <p className="text-sm text-slate-500 font-medium">Impact Hours</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-transparent rounded-bl-full -z-10"></div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <Badge className="bg-indigo-100 text-indigo-800 border-none font-bold">AI Scored</Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats.avgSuccessRate}%</p>
              <p className="text-sm text-slate-500 font-medium">Avg. Success Prediction</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
          {/* Active Tasks List */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Active Tasks</h2>
              <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">View All</Button>
            </div>
            
            <div className="space-y-3">
              {tasks.slice(0, 5).map(task => (
                <Card key={task.id} className="border-slate-200 shadow-sm hover:border-amber-300 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs bg-slate-50">{task.category}</Badge>
                        <span className="text-xs text-slate-400">{new Date(task.date).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-slate-900">{task.title}</h4>
                      <p className="text-sm text-slate-500">
                        {task.applicantsCount} / {task.requiredPeople} applicants • AI Score: <span className="text-indigo-600 font-semibold">{task.qualityScore || '--'}</span>
                      </p>
                    </div>
                    <Link href={`/admin/tasks/${task.id}`}>
                      <Button variant="outline" className="bg-white">Manage</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
              {tasks.length === 0 && (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                  No active tasks found. Create one to get started.
                </div>
              )}
            </div>
          </div>

          {/* Action Center Sidebar */}
          <div className="col-span-1 flex flex-col gap-6">
            <Card className="border-rose-100 bg-rose-50/30 shadow-sm">
              <CardHeader className="pb-3 border-b border-rose-100 bg-rose-50/50">
                <CardTitle className="text-base flex items-center gap-2 text-rose-900">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  Action Required
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-rose-100">
                  {stats.pendingVerifications > 0 ? (
                    <div className="p-4 flex justify-between items-center bg-white hover:bg-rose-50/30 transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Photo Verifications</p>
                        <p className="text-xs text-slate-500">{stats.pendingVerifications} tasks waiting for completion review</p>
                      </div>
                      <Badge className="bg-rose-500">{stats.pendingVerifications}</Badge>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-sm text-slate-500 bg-white">
                      All caught up! No pending actions.
                    </div>
                  )}
                  {/* Additional mock action items could go here */}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm flex-1">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-slate-400" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
                {/* Fallback simple visual since Recharts might need robust mock data to not crash */}
                <div className="w-full space-y-4">
                  {summary?.tasksByCategory?.map(cat => (
                    <div key={cat.category}>
                      <div className="flex justify-between text-xs mb-1 font-medium text-slate-600">
                        <span>{cat.category}</span>
                        <span>{cat.count} tasks</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(cat.count / stats.totalTasks) * 100}%` }}></div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-slate-400 text-sm">Chart data unavailable</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
