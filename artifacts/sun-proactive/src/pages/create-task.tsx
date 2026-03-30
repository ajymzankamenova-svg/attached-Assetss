import { useState } from "react";
import { Layout } from "@/components/layout";
import { useCreateTask, usePublishTask, useAiTaskDialogue, useAnalyzeTaskQuality } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function CreateTask() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{role: "user"|"assistant", content: string}[]>([]);
  const [isDialogueLoading, setIsDialogueLoading] = useState(false);
  
  const [taskDraft, setTaskDraft] = useState<any>({
    title: "",
    description: "",
    location: "",
    date: new Date().toISOString().split('T')[0],
    duration: 2,
    requiredPeople: 5,
    skillsRequired: [],
    category: "Community"
  });

  const [qualityAnalysis, setQualityAnalysis] = useState<any>(null);

  // Mocks until true endpoint shapes are clear
  const handleAiDialogueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const newMsgs = [...messages, { role: "user" as const, content: prompt }];
    setMessages(newMsgs);
    setPrompt("");
    setIsDialogueLoading(true);

    // Mock response simulating useAiTaskDialogue
    setTimeout(() => {
      setMessages([...newMsgs, { 
        role: "assistant", 
        content: "I've extracted the details. It looks like you want to organize a tree planting event. Could you specify the exact location and how many volunteers you need?" 
      }]);
      setTaskDraft({
        ...taskDraft,
        title: "Tree Planting Initiative",
        description: "A community effort to plant trees and improve local green spaces.",
        category: "Environment",
        skillsRequired: ["Physical Labor", "Gardening"]
      });
      setIsDialogueLoading(false);
    }, 1500);
  };

  const handleRunQualityCheck = () => {
    // Mock useAnalyzeTaskQuality
    setQualityAnalysis({
      score: 85,
      grade: "good",
      missingFields: ["Specific meeting point"],
      suggestions: ["Add what volunteers should wear", "Specify if tools are provided"],
      strengths: ["Clear objective", "Good timeline"]
    });
  };

  const createMutation = useCreateTask({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Task created successfully!" });
        setLocation(`/admin/tasks/${data.id}`);
      },
      onError: () => {
        toast({ title: "Failed to create task", variant: "destructive" });
      }
    }
  });

  const handlePublish = () => {
    createMutation.mutate({ data: taskDraft });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-500" />
            AI Task Creator
          </h1>
          <p className="text-slate-600 mt-2">Describe what needs to be done, and AI will structure the perfect task brief.</p>
        </div>

        <div className="flex items-center justify-between mb-8 px-4">
          {[
            { num: 1, label: "Describe" },
            { num: 2, label: "Review Draft" },
            { num: 3, label: "Quality Check" }
          ].map((s, i) => (
            <div key={s.num} className="flex flex-col items-center gap-2 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                step >= s.num ? "bg-amber-500 text-slate-900 shadow-md" : "bg-slate-100 text-slate-400"
              }`}>
                {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-sm font-medium ${step >= s.num ? "text-slate-900" : "text-slate-400"}`}>{s.label}</span>
            </div>
          ))}
          <div className="absolute left-1/2 -translate-x-1/2 w-3/4 h-1 bg-slate-100 top-12 -z-0">
             <div className="h-full bg-amber-500 transition-all" style={{ width: `${(step - 1) * 50}%` }}></div>
          </div>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-indigo-100 shadow-md flex flex-col h-[500px]">
              <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-50">
                <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                  <Sparkles className="w-5 h-5 text-indigo-500" /> AI Co-Pilot
                </CardTitle>
                <CardDescription>Chat to build the task requirements</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-900 border border-indigo-100 w-[85%]">
                  Hi! I'm your task creation assistant. What kind of impact project do you want to organize today? Just describe it naturally!
                </div>
                {messages.map((m, i) => (
                  <div key={i} className={`p-3 rounded-lg text-sm border ${
                    m.role === 'user' 
                      ? "bg-slate-900 text-white ml-auto w-[85%]" 
                      : "bg-indigo-50 text-indigo-900 border-indigo-100 w-[85%]"
                  }`}>
                    {m.content}
                  </div>
                ))}
                {isDialogueLoading && (
                  <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-900 border border-indigo-100 w-[50%] flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Thinking...
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t border-slate-100 bg-white">
                <form onSubmit={handleAiDialogueSubmit} className="flex gap-2">
                  <Input 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                    placeholder="e.g. We need 10 people to clean the riverbank..." 
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>

            <Card className="border-slate-200 shadow-sm flex flex-col h-[500px]">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-lg">Live Extraction</CardTitle>
                <CardDescription>See the JSON draft update in real-time</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden bg-slate-950">
                <pre className="p-4 text-xs text-green-400 font-mono overflow-auto h-full">
                  {JSON.stringify(taskDraft, null, 2)}
                </pre>
              </CardContent>
              <CardFooter className="p-4 bg-slate-50 border-t border-slate-100">
                <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" onClick={() => setStep(2)}>
                  Accept & Review Form →
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {step === 2 && (
          <Card className="border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle>Review Structured Data</CardTitle>
              <CardDescription>Make any manual adjustments before checking quality.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={taskDraft.title} onChange={e => setTaskDraft({...taskDraft, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea className="h-32" value={taskDraft.description} onChange={e => setTaskDraft({...taskDraft, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={taskDraft.location} onChange={e => setTaskDraft({...taskDraft, location: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={taskDraft.category} onChange={e => setTaskDraft({...taskDraft, category: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Required People</Label>
                  <Input type="number" value={taskDraft.requiredPeople} onChange={e => setTaskDraft({...taskDraft, requiredPeople: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (hours)</Label>
                  <Input type="number" value={taskDraft.duration} onChange={e => setTaskDraft({...taskDraft, duration: parseInt(e.target.value)})} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-slate-50 border-t border-slate-100 p-4 mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>Back to Chat</Button>
              <Button onClick={() => { setStep(3); handleRunQualityCheck(); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                Run Quality Check →
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-md">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-blue-600" />
                  AI Quality Report
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {qualityAnalysis ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="col-span-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-5xl font-bold text-blue-600 mb-2">{qualityAnalysis.score}</div>
                      <div className="text-sm text-slate-500 uppercase tracking-widest font-semibold">Score / 100</div>
                      <Badge className="mt-4 bg-blue-100 text-blue-800 border-none hover:bg-blue-100 text-base py-1 px-4 capitalize">
                        {qualityAnalysis.grade}
                      </Badge>
                    </div>
                    <div className="col-span-2 space-y-6">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" /> Strengths
                        </h4>
                        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                          {qualityAnalysis.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500" /> Suggestions for Improvement
                        </h4>
                        <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
                          {qualityAnalysis.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 flex flex-col items-center">
                    <RefreshCw className="w-8 h-8 animate-spin mb-4 text-slate-300" />
                    Analyzing task details...
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back to Edit</Button>
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 shadow-md" onClick={handlePublish} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Publishing..." : "Publish Task"}
              </Button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
