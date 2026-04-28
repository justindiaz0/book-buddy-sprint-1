import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useGetCurrentBook, useCreateSession, getGetDashboardSummaryQueryKey, getGetCurrentBookQueryKey, getListBooksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Play, Pause, Square, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function Session() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isLowEnergyParams = new URLSearchParams(window.location.search).get('lowEnergy') === 'true';
  
  const { data: book, isLoading } = useGetCurrentBook();
  const createSession = useCreateSession();

  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  
  const [pagesRead, setPagesRead] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [lowEnergyMode, setLowEnergyMode] = useState(isLowEnergyParams);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (book && currentPage === 0) {
      setCurrentPage(book.currentPage);
      if (isLowEnergyParams) {
        setPagesRead(2);
        setCurrentPage(book.currentPage + 2);
      }
    }
  }, [book, isLowEnergyParams, currentPage]);

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book) {
    toast.error("No active book found. Please select a book first.");
    setLocation("/books");
    return null;
  }

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(false);
    setShowEndDialog(true);
  };

  const handlePagesReadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setPagesRead(val);
    setCurrentPage(book.currentPage + val);
  };

  const handleCurrentPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setCurrentPage(val);
    setPagesRead(Math.max(0, val - book.currentPage));
  };

  const toggleLowEnergy = (checked: boolean) => {
    setLowEnergyMode(checked);
    if (checked) {
      setPagesRead(2);
      setCurrentPage(book.currentPage + 2);
    } else {
      setPagesRead(0);
      setCurrentPage(book.currentPage);
    }
  };

  const submitSession = () => {
    const minutesRead = Math.max(1, Math.floor(seconds / 60));
    
    createSession.mutate(
      {
        data: {
          bookId: book.id,
          minutesRead,
          pagesRead,
          startPage: book.currentPage,
          endPage: currentPage,
        }
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCurrentBookQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          
          sessionStorage.setItem('lastSession', JSON.stringify({
            pagesRead,
            minutesRead,
            newPercent: Math.round((currentPage / book.totalPages) * 100)
          }));
          
          setLocation("/session/success");
        },
        onError: () => {
          toast.error("Failed to save session");
        }
      }
    );
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const projectedPercent = Math.min(100, Math.round((currentPage / book.totalPages) * 100));

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background p-6 pt-12 animate-in fade-in duration-500">
      <Button variant="ghost" size="icon" className="absolute top-6 left-6" onClick={() => setLocation("/dashboard")}>
        <ArrowLeft className="w-6 h-6" />
      </Button>

      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full space-y-12">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium">Currently Reading</p>
          <h2 className="text-2xl font-serif leading-tight">{book.title}</h2>
        </div>

        <div className="tabular-nums font-mono text-7xl font-light tracking-tighter text-primary">
          {formatTime(seconds)}
        </div>

        {!showEndDialog ? (
          <div className="flex items-center justify-center gap-6">
            {!isActive ? (
              <Button 
                size="lg" 
                className="w-24 h-24 rounded-full shadow-lg shadow-primary/20"
                onClick={handleStart}
              >
                <Play className="w-10 h-10 ml-2" fill="currentColor" />
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-20 h-20 rounded-full border-border/50 text-foreground"
                  onClick={handlePauseResume}
                >
                  {isPaused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
                </Button>
                <Button 
                  size="lg" 
                  variant="destructive"
                  className="w-20 h-20 rounded-full"
                  onClick={handleStop}
                >
                  <Square className="w-6 h-6" fill="currentColor" />
                </Button>
              </>
            )}
          </div>
        ) : (
          <Card className="w-full animate-in slide-in-from-bottom-8 duration-300 border-border/50">
            <CardContent className="p-6 space-y-6">
              <h3 className="font-serif text-xl">Log your session</h3>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="space-y-0.5">
                  <Label>Low energy mode</Label>
                  <p className="text-xs text-muted-foreground">Just read 2 pages</p>
                </div>
                <Switch checked={lowEnergyMode} onCheckedChange={toggleLowEnergy} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pages read</Label>
                  <Input 
                    type="number" 
                    value={pagesRead} 
                    onChange={handlePagesReadChange}
                    className="text-xl text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ending page</Label>
                  <Input 
                    type="number" 
                    value={currentPage} 
                    onChange={handleCurrentPageChange}
                    className="text-xl text-center"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-primary">{projectedPercent}%</span>
                </div>
                <Progress value={projectedPercent} className="h-2" />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowEndDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={submitSession}
                  disabled={createSession.isPending}
                >
                  {createSession.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Session
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
