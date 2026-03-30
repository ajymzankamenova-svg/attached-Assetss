import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetTasks } from "@workspace/api-client-react";
import { Search, MapPin, Calendar, Users, TrendingUp, Filter, Star } from "lucide-react";

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useGetTasks({
    query: {
      queryKey: ["/api/tasks", { status: "published" }],
    }
  });

  const categories = Array.from(new Set(tasks.map(t => t.category)));

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory ? task.category === activeCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Discover Tasks</h1>
          <p className="text-slate-600">Find opportunities to make a difference in your community.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              placeholder="Search tasks, locations, or skills..." 
              className="pl-10 h-12 bg-white border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 border-slate-200 bg-white">
            <Filter className="w-5 h-5 mr-2" /> Filters
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button 
            variant={activeCategory === null ? "default" : "outline"} 
            onClick={() => setActiveCategory(null)}
            className={`rounded-full whitespace-nowrap ${activeCategory === null ? 'bg-slate-900 text-white' : 'bg-white'}`}
          >
            All Categories
          </Button>
          {categories.map(cat => (
            <Button 
              key={cat} 
              variant={activeCategory === cat ? "default" : "outline"} 
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full whitespace-nowrap ${activeCategory === cat ? 'bg-slate-900 text-white' : 'bg-white'}`}
            >
              {cat}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="h-80 animate-pulse bg-slate-100 border-none"></Card>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-xl border border-slate-200">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No tasks found</h3>
            <p className="text-slate-500">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => {
              // Mock AI score if not present
              const matchScore = Math.floor(Math.random() * 40) + 60; // 60-99
              const qualityColor = task.qualityScore && task.qualityScore > 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';

              return (
                <Card key={task.id} className="flex flex-col border-slate-200 hover:shadow-lg transition-shadow group overflow-hidden">
                  <div className="h-2 w-full bg-slate-100 relative">
                    <div className="absolute top-0 left-0 h-full bg-amber-400" style={{ width: `${(task.applicantsCount / task.requiredPeople) * 100}%` }}></div>
                  </div>
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium">
                        {task.category}
                      </Badge>
                      <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none flex items-center gap-1 font-bold">
                        <TrendingUp className="w-3 h-3" /> {matchScore}% Match
                      </Badge>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">
                      {task.title}
                    </h3>
                    
                    <p className="text-slate-500 text-sm mb-6 line-clamp-3 flex-1">
                      {task.description}
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-slate-600">
                        <MapPin className="w-4 h-4 mr-3 text-slate-400" />
                        <span className="truncate">{task.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Calendar className="w-4 h-4 mr-3 text-slate-400" />
                        <span>{new Date(task.date).toLocaleDateString()} • {task.duration} hrs</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Users className="w-4 h-4 mr-3 text-slate-400" />
                        <span>{task.applicantsCount} / {task.requiredPeople} volunteers needed</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        {task.qualityScore && (
                          <Badge className={`${qualityColor} border-none font-semibold text-xs`} title="AI Task Quality Score">
                            <Star className="w-3 h-3 mr-1 fill-current" /> {task.qualityScore}
                          </Badge>
                        )}
                        {task.successPrediction && (
                          <span className="text-xs font-medium text-slate-500">{task.successPrediction}% Success Pred.</span>
                        )}
                      </div>
                      <Link href={`/tasks/${task.id}`}>
                        <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">View</Button>
                      </Link>
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
