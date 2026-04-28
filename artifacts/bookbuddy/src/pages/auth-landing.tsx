import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function AuthLanding() {
  const [, setLocation] = useLocation();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      setLocation("/dashboard");
    }
  }, [session, loading, setLocation]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden relative">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[480px] h-[480px] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute bottom-0 right-[-10%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-[80px]" />
      </div>

      <div className="relative flex flex-col flex-1 px-6 max-w-sm mx-auto w-full">
        {/* Brand area */}
        <div className="pt-20 pb-2 flex flex-col items-center text-center space-y-5">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20">
            <BookOpen className="w-8 h-8 text-primary" strokeWidth={1.5} />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-serif tracking-tight text-foreground">
              BookBuddy
            </h1>
            <p className="text-xs font-medium uppercase tracking-widest text-primary/70">
              Reading Companion
            </p>
          </div>
        </div>

        {/* Headline block */}
        <div className="mt-14 mb-12 text-center space-y-4">
          <h2 className="text-[2rem] leading-tight font-serif tracking-tight text-foreground">
            Build the habit of<br />
            reaching for your book.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">
            A calm space to track your reading — no streaks to fear, no pressure. Just you and your book.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-auto pb-14 space-y-3">
          <Button
            asChild
            className="w-full h-14 text-base font-medium rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform shadow-lg shadow-primary/20"
          >
            <Link href="/auth/signup">Create a free account</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full h-14 text-base font-medium rounded-2xl border-border/60 bg-card/60 hover:bg-card active:scale-[0.98] transition-transform"
          >
            <Link href="/auth/signin">I already have an account</Link>
          </Button>

          <p className="text-center text-xs text-muted-foreground/60 pt-2 leading-relaxed">
            No spam. No notifications you didn't ask for.
            <br />Just your reading, quietly tracked.
          </p>
        </div>
      </div>
    </div>
  );
}
