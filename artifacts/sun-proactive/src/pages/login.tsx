import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: setAuthContext } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: async (data) => {
        setAuthContext(data.token, data.user);
        queryClient.setQueryData(["/api/auth/me", data.token], data.user);
        if (!data.user.onboardingCompleted && data.user.role === "volunteer") {
          setLocation("/onboarding");
        } else if (data.user.role === "admin") {
          setLocation("/admin");
        } else {
          setLocation("/dashboard");
        }
      },
      onError: (error) => {
        setErrorMsg(error.data?.message || error.data?.error || t("common.error"));
      }
    }
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setErrorMsg("");
    loginMutation.mutate({ data: values });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center items-center bg-slate-950 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-slate-900/90 mix-blend-overlay"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/20 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[100px] rounded-full"></div>
        </div>
        <div className="z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <Sun className="h-10 w-10 text-amber-500" />
            <h1 className="text-4xl font-bold tracking-tight">Sun Proactive AI</h1>
          </div>
          <h2 className="text-3xl font-medium mb-6 font-serif">{t("login.mission")}</h2>
          <p className="text-slate-300 text-lg">{t("login.mission_desc")}</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-slate-50">
        <Card className="w-full max-w-md shadow-xl border-slate-200">
          <CardHeader className="space-y-1 pb-8">
            <div className="flex items-center gap-2 lg:hidden mb-4">
              <Sun className="h-6 w-6 text-amber-500" />
              <span className="font-bold text-xl text-slate-900">Sun Proactive AI</span>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">{t("login.welcome")}</CardTitle>
            <CardDescription className="text-slate-500">{t("login.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">{t("login.email")}</FormLabel>
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
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-slate-700">{t("login.password")}</FormLabel>
                        <a href="#" className="text-sm font-medium text-amber-600 hover:text-amber-500">
                          {t("login.forgot")}
                        </a>
                      </div>
                      <FormControl>
                        <Input type="password" {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                    {errorMsg}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? t("common.loading") : t("login.signin")}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center text-sm text-slate-600">
              {t("login.no_account")}{" "}
              <Link href="/register" className="font-medium text-amber-600 hover:text-amber-500 transition-colors">
                {t("login.register_link")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
