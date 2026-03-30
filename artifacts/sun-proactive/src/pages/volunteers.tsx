import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetVolunteers, useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Trophy, Medal, Star, Shield } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Volunteers() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: volunteers = [], isLoading: isLoadingVolunteers } = useGetVolunteers();
  const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useGetLeaderboard();

  const filteredVols = volunteers.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout>
      <div className="flex flex-col gap-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Community</h1>
          <p className="text-slate-600">The people driving change across the region.</p>
        </div>

        <Tabs defaultValue="directory" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-slate-100 p-1">
            <TabsTrigger value="directory" className="text-sm font-medium">Directory</TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-sm font-medium flex gap-2 items-center">
              <Trophy className="w-4 h-4 text-amber-500" /> Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="directory" className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input 
                placeholder="Search by name or skills..." 
                className="pl-10 h-12 bg-white border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {isLoadingVolunteers ? (
                Array.from({length: 8}).map((_, i) => (
                  <Card key={i} className="h-48 animate-pulse bg-slate-50 border-none"></Card>
                ))
              ) : filteredVols.map((vol) => (
                <Link key={vol.id} href={`/volunteers/${vol.id}`}>
                  <Card className="border-slate-200 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer h-full group">
                    <CardContent className="p-6 flex flex-col items-center text-center h-full">
                      <div className="relative mb-4">
                        <Avatar className="w-20 h-20 border-4 border-white shadow-sm group-hover:scale-105 transition-transform">
                          <AvatarFallback className="bg-slate-100 text-slate-600 text-xl font-bold">
                            {vol.name.substring(0,2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-900 text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-white">
                          {vol.level}
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{vol.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-1 mb-3">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{vol.rating.toFixed(1)} Rating • {vol.tasksCompleted} Tasks</span>
                      </div>
                      <div className="flex flex-wrap justify-center gap-1 mt-auto">
                        {vol.skills.slice(0, 3).map(skill => (
                          <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0">
                            {skill}
                          </Badge>
                        ))}
                        {vol.skills.length > 3 && (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0">
                            +{vol.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card className="border-slate-200 overflow-hidden shadow-md">
              <div className="bg-gradient-to-r from-amber-500 to-amber-400 p-6 text-slate-900">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Medal className="w-6 h-6" /> Top Contributors
                </h2>
                <p className="text-amber-900 font-medium">Ranked by overall impact and reputation.</p>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {isLoadingLeaderboard ? (
                    <div className="p-8 text-center text-slate-500">Loading rankings...</div>
                  ) : leaderboard.map((entry, index) => (
                    <div key={entry.volunteerId} className={`flex items-center p-4 transition-colors hover:bg-slate-50 ${index < 3 ? 'bg-amber-50/30' : ''}`}>
                      <div className="w-12 text-center font-bold text-lg text-slate-400">
                        {index === 0 ? <Trophy className="w-6 h-6 text-yellow-500 mx-auto" /> : 
                         index === 1 ? <Trophy className="w-6 h-6 text-slate-400 mx-auto" /> : 
                         index === 2 ? <Trophy className="w-6 h-6 text-amber-700 mx-auto" /> : 
                         `#${entry.rank}`}
                      </div>
                      
                      <Avatar className="w-10 h-10 ml-4 mr-4 border border-slate-200">
                        <AvatarFallback className="bg-slate-100 text-slate-700 font-bold">
                          {entry.name.substring(0,2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <Link href={`/volunteers/${entry.volunteerId}`}>
                          <h4 className="font-bold text-slate-900 hover:text-amber-600 hover:underline cursor-pointer">{entry.name}</h4>
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-700">Lvl {entry.level}</span>
                          <span className="flex items-center"><Shield className="w-3 h-3 mr-1" /> {entry.tasksCompleted} tasks</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{entry.totalHours} hrs</div>
                        <div className="text-xs text-amber-600 font-medium flex items-center justify-end gap-1">
                          <Star className="w-3 h-3 fill-current" /> {entry.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
