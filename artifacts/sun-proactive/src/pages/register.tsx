import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["volunteer", "admin"]),
  language: z.enum(["en", "ru", "kz"]),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { login: setAuthContext } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "volunteer", language: "ru" },
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
        setErrorMsg(error.data?.message || error.data?.error || t("common.error"));
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
          <h2 className="text-3xl font-medium mb-6 font-serif">
            {t("register.title")}.
          </h2>
          <p className="text-slate-300 text-lg mb-8">{t("register.subtitle")}</p>
          <div className="grid grid-cols-2 gap-6 border-t border-slate-800 pt-8">
            <div>
              <div className="text-3xl font-bold text-amber-500 mb-2">10k+</div>
              <div className="text-sm text-slate-400">
                {t("register.role_volunteer")}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-500 mb-2">50k+</div>
              <div className="text-sm text-slate-400">{t("common.hours")}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-slate-50 order-1 lg:order-2">
        <Card className="w-full max-w-md shadow-xl border-slate-200">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-2 lg:hidden mb-4">
              <Sun className="h-6 w-6 text-amber-500" />
              <span className="font-bold text-xl text-slate-900">Sun Proactive AI</span>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">{t("register.title")}</CardTitle>
            <CardDescription className="text-slate-500">{t("register.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">{t("register.name")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Нурлан Сейткали" {...field} className="bg-white" />
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
                      <FormLabel className="text-slate-700">{t("register.email")}</FormLabel>
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
                      <FormLabel className="text-slate-700">{t("register.password")}</FormLabel>
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
                        <FormLabel className="text-slate-700">{t("register.role")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="volunteer">{t("register.role_volunteer")}</SelectItem>
                            <SelectItem value="admin">{t("register.role_admin")}</SelectItem>
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
                        <FormLabel className="text-slate-700">{t("register.language")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kz">Қазақша</SelectItem>
                            <SelectItem value="ru">Русский</SelectItem>
                            <SelectItem value="en">English</SelectItem>
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

                <Button
                  type="submit"
                  className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? t("common.loading") : t("register.submit")}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center text-sm text-slate-600">
              {t("register.have_account")}{" "}
              <Link href="/login" className="font-medium text-amber-600 hover:text-amber-500 transition-colors">
                {t("register.login_link")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
