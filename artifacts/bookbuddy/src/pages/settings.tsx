import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Loader2, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

const settingsSchema = z.object({
  dailyGoalMinutes: z.coerce.number().min(1).max(120),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().optional(),
  burnoutWindowStart: z.string().optional(),
  burnoutWindowEnd: z.string().optional(),
  darkMode: z.boolean(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      dailyGoalMinutes: 15,
      reminderEnabled: false,
      reminderTime: "20:00",
      burnoutWindowStart: "22:00",
      burnoutWindowEnd: "23:59",
      darkMode: true,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        dailyGoalMinutes: settings.dailyGoalMinutes,
        reminderEnabled: settings.reminderEnabled,
        reminderTime: settings.reminderTime || "20:00",
        burnoutWindowStart: settings.burnoutWindowStart || "22:00",
        burnoutWindowEnd: settings.burnoutWindowEnd || "23:59",
        darkMode: settings.darkMode,
      });
      
      // Update HTML class for dark mode immediately
      if (settings.darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [settings, form]);

  const onSubmit = (data: SettingsValues) => {
    updateSettings.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          
          if (data.darkMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
          
          toast.success("Settings saved successfully");
        },
        onError: () => {
          toast.error("Failed to save settings");
        }
      }
    );
  };

  const handleResetData = () => {
    // Implement via api if there was an endpoint, but since there isn't we just mock it
    toast.error("Reset functionality not implemented in MVP");
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    toast("Signed out successfully", { icon: <LogOut className="w-4 h-4" /> });
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-8 pb-24 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-serif tracking-tight">Settings</h1>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Reading Habits</CardTitle>
              <CardDescription>Adjust your daily targets and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="dailyGoalMinutes"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <div className="flex justify-between items-center">
                      <FormLabel>Daily reading goal</FormLabel>
                      <span className="font-medium">{field.value} min</span>
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
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-4 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="reminderEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-background">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Gentle reminders</FormLabel>
                        <p className="text-sm text-muted-foreground">A soft notification to read.</p>
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
                      <FormItem className="animate-in slide-in-from-top-2">
                        <FormLabel>Reminder time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground italic mt-2">
                          Note: Reminders are saved but push notifications aren't active in this version.
                        </p>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Burnout window</p>
                  <p className="text-sm text-muted-foreground">When are you most likely to doomscroll? We'll encourage reading instead.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="burnoutWindowStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase text-muted-foreground">From</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="burnoutWindowEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase text-muted-foreground">To</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="darkMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Dark mode</FormLabel>
                      <p className="text-sm text-muted-foreground">Easier on the eyes for night reading.</p>
                    </div>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={(val) => {
                          field.onChange(val);
                          // We submit automatically for instant theme switch if they want
                          // but since there's a save button we'll let it wait
                        }} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full py-6 text-lg shadow-lg" disabled={updateSettings.isPending || !form.formState.isDirty}>
            {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </Form>

      <Card className="border-destructive/30 bg-destructive/5 mt-8">
        <CardHeader>
          <CardTitle className="text-lg text-destructive font-serif">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start text-foreground" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
                <Trash2 className="w-4 h-4 mr-2" />
                Reset all data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove all your reading history, books, and settings from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleResetData}>
                  Yes, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
