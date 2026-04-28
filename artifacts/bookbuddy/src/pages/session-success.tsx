import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, History } from "lucide-react";
import ReactConfetti from 'react-confetti';

export default function SessionSuccess() {
  const [, setLocation] = useLocation();
  const [sessionData, setSessionData] = useState<{pagesRead: number, minutesRead: number, newPercent: number} | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const data = sessionStorage.getItem('lastSession');
    if (data) {
      setSessionData(JSON.parse(data));
      // Optional: clear it if you don't want it persisting forever
      // sessionStorage.removeItem('lastSession');
    } else {
      setLocation("/dashboard");
    }

    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [setLocation]);

  if (!sessionData) return null;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {showConfetti && <ReactConfetti recycle={false} numberOfPieces={200} colors={['#F59E0B', '#10B981', '#059669', '#3B82F6']} />}
      
      <div className="max-w-sm w-full space-y-8 animate-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-serif tracking-tight">You showed up.</h1>
          <p className="text-muted-foreground text-lg">Every page counts towards the habit.</p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 divide-x divide-border/50 text-center">
              <div className="space-y-1">
                <p className="text-3xl font-medium text-foreground">{sessionData.minutesRead}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Minutes</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-medium text-foreground">{sessionData.pagesRead}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pages</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-medium text-primary">{sessionData.newPercent}%</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Done</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 pt-4">
          <Button 
            className="w-full py-6 text-lg" 
            onClick={() => setLocation("/dashboard")}
          >
            Back to sanctuary
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground"
            onClick={() => setLocation("/history")}
          >
            <History className="w-4 h-4 mr-2" />
            View history
          </Button>
        </div>
      </div>
    </div>
  );
}
