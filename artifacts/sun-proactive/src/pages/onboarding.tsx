import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitOnboarding } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

const SKILLS = [
  "Leadership", "Communication", "Teaching", "Medical", 
  "Driving", "Physical Labor", "Translation", "Event Planning", 
  "Tech Support", "Photography"
];

const INTERESTS = [
  "Education", "Environment", "Health", "Elderly Care", 
  "Animal Welfare", "Community Building", "Emergency Response", "Arts & Culture"
];

const onboardingSchema = z.object({
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  location: z.string().min(2, "Please enter your city/region"),
  availability: z.enum(["Weekdays", "Weekends", "Evenings", "Flexible"]),
  ageGroup: z.enum(["18-24", "25-34", "35-44", "45-54", "55+"]),
  transportMode: z.enum(["Public Transit", "Personal Car", "Bicycle/Walk", "None"]),
});

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user, token, login } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      interests: [],
      skills: [],
      location: "",
      availability: "Flexible",
      ageGroup: "25-34",
      transportMode: "Public Transit",
    },
  });

  const onboardingMutation = useSubmitOnboarding({
    mutation: {
      onSuccess: (updatedUser) => {
        if (token) {
          login(token, updatedUser);
          queryClient.setQueryData(["/api/auth/me", token], updatedUser);
        }
        setLocation("/dashboard");
      }
    }
  });

  const onSubmit = (values: z.infer<typeof onboardingSchema>) => {
    onboardingMutation.mutate({ data: values });
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(["interests", "skills"]);
    } else if (step === 2) {
      isValid = await form.trigger(["location", "availability", "ageGroup", "transportMode"]);
    }
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Sun Proactive, {user.name}!</h1>
          <p className="text-slate-600">Let's set up your profile so our AI can match you with the perfect tasks.</p>
        </div>

        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0 rounded-full"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-amber-500 z-0 rounded-full transition-all duration-300" 
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          ></div>
          
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
                s === step 
                  ? "bg-amber-500 border-amber-500 text-slate-900" 
                  : s < step 
                    ? "bg-amber-500 border-amber-500 text-slate-900" 
                    : "bg-white border-slate-300 text-slate-400"
              }`}
            >
              {s < step ? "✓" : s}
            </div>
          ))}
        </div>

        <Card className="shadow-lg border-slate-200">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {step === 1 && (
                <>
                  <CardHeader>
                    <CardTitle>Skills & Interests</CardTitle>
                    <CardDescription>What do you care about, and what can you do?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="interests"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base font-semibold">Causes you care about</FormLabel>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {INTERESTS.map((item) => (
                              <FormField
                                key={item}
                                control={form.control}
                                name="interests"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={item}
                                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(item)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, item])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== item
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer text-sm">
                                        {item}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="h-px bg-slate-200 w-full my-6"></div>

                    <FormField
                      control={form.control}
                      name="skills"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base font-semibold">Your Skills</FormLabel>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {SKILLS.map((item) => (
                              <FormField
                                key={item}
                                control={form.control}
                                name="skills"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={item}
                                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(item)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, item])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== item
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer text-sm">
                                        {item}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end pt-6 border-t border-slate-100">
                    <Button type="button" onClick={nextStep} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                      Continue
                    </Button>
                  </CardFooter>
                </>
              )}

              {step === 2 && (
                <>
                  <CardHeader>
                    <CardTitle>Logistics & Details</CardTitle>
                    <CardDescription>Help us find tasks that fit your schedule and location.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City / Region</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Almaty, Astana" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="availability"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Availability</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select availability" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Weekdays">Weekdays</SelectItem>
                                <SelectItem value="Weekends">Weekends</SelectItem>
                                <SelectItem value="Evenings">Evenings</SelectItem>
                                <SelectItem value="Flexible">Flexible</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="transportMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transport Mode</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select transport mode" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Personal Car">Personal Car</SelectItem>
                                <SelectItem value="Public Transit">Public Transit</SelectItem>
                                <SelectItem value="Bicycle/Walk">Bicycle/Walk</SelectItem>
                                <SelectItem value="None">None</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ageGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age Group</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select age group" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="18-24">18-24</SelectItem>
                                <SelectItem value="25-34">25-34</SelectItem>
                                <SelectItem value="35-44">35-44</SelectItem>
                                <SelectItem value="45-54">45-54</SelectItem>
                                <SelectItem value="55+">55+</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-6 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Back
                    </Button>
                    <Button type="button" onClick={nextStep} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                      Continue
                    </Button>
                  </CardFooter>
                </>
              )}

              {step === 3 && (
                <>
                  <CardHeader>
                    <CardTitle>Ready to go!</CardTitle>
                    <CardDescription>Your profile is complete. Submit to start your journey.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <h3 className="text-xl font-medium text-center">Our AI is ready to match you</h3>
                    <p className="text-slate-500 text-center mt-2 max-w-sm">
                      We'll use your skills and interests to find the most impactful tasks where you can make a real difference.
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-6 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Back
                    </Button>
                    <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900" disabled={onboardingMutation.isPending}>
                      {onboardingMutation.isPending ? "Submitting..." : "Complete Setup"}
                    </Button>
                  </CardFooter>
                </>
              )}
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
}
