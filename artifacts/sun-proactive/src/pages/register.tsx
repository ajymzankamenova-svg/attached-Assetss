import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["volunteer", "admin"]),
  language: z.enum(["en", "ru", "kz"]),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { login: setAuthContext } = useAuth();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "volunteer",
      language: "en",
    },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: async (data) => {
        setAuthContext(data.token, data.user);
        queryClient.setQueryData(["/api/auth/me", data.token], data.user);
        
        if (data.user.role === "volunteer") {
          setLocation("/onboarding");
        } else {
          setLocation("/admin");
        }
      },
      onError: (error) => {
        setErrorMsg(error.data?.message || error.data?.error || "Failed to register");
      }
    }
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    setErrorMsg("");
    registerMutation.mutate({ data: values });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center items-center bg-slate-950 text-white p-12 relative overflow-hidden order-2 lg:order-1">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-slate-900/90 mix-blend-overlay"></div>
          <div className="absolute top-[10%] right-[-10%] w-[60%] h-[60%] bg-amber-500/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[20%] left-[-20%] w-[50%] h-[50%] bg-blue-500/20 blur-[100px] rounded-full"></div>
        </div>
        <div className="z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <Sun className="h-10 w-10 text-amber-500" />
            <h1 className="text-4xl font-bold tracking-tight">Sun Proactive AI</h1>
          </div>
          <h2 className="text-3xl font-medium mb-6 font-serif">Join the movement.</h2>
          <p className="text-slate-300 text-lg mb-8">
            Create an account to start contributing to social impact projects. Our AI will help match you with tasks that fit your skills and availability.
          </p>
          <div className="grid grid-cols-2 gap-6 border-t border-slate-800 pt-8">
            <div>
              <div className="text-3xl font-bold text-amber-500 mb-2">10k+</div>
              <div className="text-sm text-slate-400">Active Volunteers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-500 mb-2">50k+</div>
              <div className="text-sm text-slate-400">Hours Contributed</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-slate-50 order-1 lg:order-2">
        <Card className="w-full max-w-md shadow-xl border-slate-200">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-2 lg:hidden mb-4">
              <Sun className="h-6 w-6 text-amber-500" />
              <span className="font-bold text-xl text-slate-900">Sun Proactive</span>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Create an account</CardTitle>
            <CardDescription className="text-slate-500">
              Enter your details to register
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="volunteer">Volunteer</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ru">Русский</SelectItem>
                            <SelectItem value="kz">Қазақша</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                    {errorMsg}
                  </div>
                )}

                <Button type="submit" className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Registering..." : "Create Account"}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-amber-600 hover:text-amber-500 transition-colors">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
