import { useState } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetCurrentUser, useOnboardUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const onboardingSchema = z.object({
  displayName: z.string().min(1, "What should we call you?"),
  bookTitle: z.string().min(1, "What are you reading right now?"),
  bookAuthor: z.string().optional(),
  bookTotalPages: z.coerce.number().min(1, "How many pages are in the book?"),
  dailyGoalMinutes: z.coerce.number().min(1).max(120),
  darkMode: z.boolean(),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().optional(),
  burnoutWindowStart: z.string().optional(),
  burnoutWindowEnd: z.string().optional(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const { session } = useAuth();
  const totalSteps = 4;

  const { data: user, isLoading: isLoadingUser } = useGetCurrentUser({
    query: {
      retry: false,
    }
  });

  const onboardMutation = useOnboardUser();

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: "",
      bookTitle: "",
      bookAuthor: "",
      bookTotalPages: 0,
      dailyGoalMinutes: 15,
      darkMode: true,
      reminderEnabled: false,
      reminderTime: "20:00",
      burnoutWindowStart: "22:00",
      burnoutWindowEnd: "23:59",
    },
  });

  if (!session) return <Redirect to="/" />;
  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (user) return <Redirect to="/dashboard" />;

  const handleNext = async () => {
    let isValid = false;
    
    if (step === 1) {
      isValid = await form.trigger(["displayName"]);
    } else if (step === 2) {
      isValid = await form.trigger(["bookTitle", "bookAuthor", "bookTotalPages"]);
    } else if (step === 3) {
      isValid = await form.trigger(["dailyGoalMinutes", "darkMode"]);
    }

    if (isValid) {
      setStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = (data: OnboardingValues) => {
    onboardMutation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          setLocation("/dashboard");
        },
        onError: () => {
          toast.error("Failed to save your settings. Please try again.");
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center p-6 bg-background text-foreground animate-in fade-in duration-500">
      <div className="max-w-sm mx-auto w-full space-y-8">
        <div className="space-y-2">
          <div className="flex gap-2 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i < step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h1 className="text-3xl font-serif tracking-tight">Welcome to your reading sanctuary.</h1>
                  <p className="text-muted-foreground text-lg">Let's set up a quiet space for your habits.</p>
                </div>
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">What should we call you?</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" className="text-lg py-6" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h1 className="text-3xl font-serif tracking-tight">What's on your nightstand?</h1>
                  <p className="text-muted-foreground text-lg">We'll track your progress together.</p>
                </div>
                <FormField
                  control={form.control}
                  name="bookTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Book title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Dune" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bookAuthor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Frank Herbert" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bookTotalPages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total pages</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 412" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h1 className="text-3xl font-serif tracking-tight">How do you want to read?</h1>
                  <p className="text-muted-foreground text-lg">Small, consistent steps over big leaps.</p>
                </div>
                <FormField
                  control={form.control}
                  name="dailyGoalMinutes"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <div className="flex justify-between items-center">
                        <FormLabel>Daily goal: {field.value} minutes</FormLabel>
                      </div>
                      <FormControl>
                        <Slider
                          min={5}
                          max={120}
                          step={5}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">Even 10 minutes a day builds a habit.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h1 className="text-3xl font-serif tracking-tight">Gentle nudges.</h1>
                  <p className="text-muted-foreground text-lg">We can remind you, but we won't nag.</p>
                </div>
                <FormField
                  control={form.control}
                  name="reminderEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-card">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Reading reminder</FormLabel>
                        <p className="text-sm text-muted-foreground">A soft notification to open your book.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("reminderEnabled") && (
                  <FormField
                    control={form.control}
                    name="reminderTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What time?</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} value={field.value || "20:00"} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={handlePrev}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              
              {step < totalSteps ? (
                <Button type="button" onClick={handleNext} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={onboardMutation.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {onboardMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Enter sanctuary
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
