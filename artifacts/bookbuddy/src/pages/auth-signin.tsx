import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BookOpen, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/lib/supabase";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function AuthSignIn() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignInValues) => {
    setIsSubmitting(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        form.setError("password", { message: error.message });
        return;
      }

      const res = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${authData.session.access_token}` },
      });
      setLocation(res.ok ? "/dashboard" : "/onboarding");
    } catch {
      form.setError("password", {
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-primary/8 blur-[100px]" />
      </div>

      <div className="relative flex flex-col flex-1 px-6 max-w-sm mx-auto w-full">
        {/* Back nav */}
        <div className="pt-14 pb-2">
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>
          </Link>
        </div>

        {/* Brand mark */}
        <div className="mt-8 mb-10 space-y-1">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 border border-primary/20">
              <BookOpen className="w-4.5 h-4.5 text-primary" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-muted-foreground">BookBuddy</span>
          </div>
          <h1 className="text-[1.8rem] font-serif tracking-tight leading-tight">
            Welcome back.
          </h1>
          <p className="text-sm text-muted-foreground pt-1">
            Your books have been waiting.
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground/80">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="h-13 rounded-xl bg-card border-border/60 text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/40"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium text-foreground/80">Password</FormLabel>
                    <span className="text-xs text-primary/70 hover:text-primary cursor-pointer transition-colors">
                      Forgot password?
                    </span>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        autoComplete="current-password"
                        className="h-13 rounded-xl bg-card border-border/60 text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/40 pr-12"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4.5 h-4.5" />
                        ) : (
                          <Eye className="w-4.5 h-4.5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 text-base font-medium rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform shadow-lg shadow-primary/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Sign in"
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Sign up link */}
        <div className="mt-8 mb-10 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/auth/signup">
              <span className="text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer">
                Sign up free
              </span>
            </Link>
          </p>
        </div>

        {/* Encouragement */}
        <div className="mt-auto pb-14 text-center">
          <p className="text-xs text-muted-foreground/50 leading-relaxed">
            Every page you read is progress.<br />
            We're just here to keep track.
          </p>
        </div>
      </div>
    </div>
  );
}
