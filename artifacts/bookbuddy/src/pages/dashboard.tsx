import { useLocation, Link, Redirect } from "wouter";
import { 
  useGetCurrentUser, 
  useGetDashboardSummary, 
  useGetWeeklySummary, 
  useGetRecentSessions 
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Play, Flame, BookOpen, Clock } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { session } = useAuth();
  const { data: user, isLoading: isLoadingUser, isError: userError } = useGetCurrentUser();
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: weekly, isLoading: isLoadingWeekly } = useGetWeeklySummary();
  const { data: recentSessions, isLoading: isLoadingRecent } = useGetRecentSessions({ query: { limit: 3 } });

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userError || !user) {
    return session ? <Redirect to="/onboarding" /> : <Redirect to="/" />;
  }

  if (isLoadingSummary || isLoadingWeekly || isLoadingRecent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 animate-in fade-in duration-500">
      <header className="space-y-1">
        <h1 className="text-3xl font-serif tracking-tight">Good evening, {user.displayName}.</h1>
        <p className="text-muted-foreground text-lg">{summary?.encouragementMessage || "Ready to unwind?"}</p>
      </header>

      {summary?.isRecovering && (
        <Card className="bg-secondary/50 border-none shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-medium">It's okay to miss a day.</h3>
              <p className="text-sm text-muted-foreground">Pick up right where you left off.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {summary?.currentBook ? (
        <Card className="overflow-hidden border-border/50 shadow-sm bg-card hover-elevate">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">CURRENTLY READING</p>
              <div>
                <h2 className="text-2xl font-serif leading-tight">{summary.currentBook.title}</h2>
                {summary.currentBook.author && (
                  <p className="text-muted-foreground">{summary.currentBook.author}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Page {summary.currentBook.currentPage} of {summary.currentBook.totalPages}</span>
                <span className="font-medium">{summary.currentBook.percentComplete}%</span>
              </div>
              <Progress value={summary.currentBook.percentComplete} className="h-2" />
            </div>

            <Button 
              className="w-full text-lg py-6 shadow-lg shadow-primary/20"
              onClick={() => setLocation("/session")}
            >
              <Play className="mr-2 h-5 w-5" fill="currentColor" />
              Start Reading
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => setLocation("/session?lowEnergy=true")}
            >
              Low energy? Just read 2 pages
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 border-dashed bg-transparent">
          <CardContent className="p-8 text-center space-y-4">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <div className="space-y-1">
              <h3 className="font-medium text-lg">No current book</h3>
              <p className="text-sm text-muted-foreground">Add a book to start tracking your reading.</p>
            </div>
            <Button onClick={() => setLocation("/books")}>Browse Library</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card shadow-sm border-border/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center text-muted-foreground">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium uppercase tracking-wider">Today</span>
            </div>
            <div>
              <p className="text-2xl font-medium">{summary?.todayMinutesRead} <span className="text-sm text-muted-foreground font-normal">min</span></p>
              <p className="text-sm text-muted-foreground">Goal: {user.dailyGoalMinutes} min</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-sm border-border/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center text-primary">
              <Flame className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium uppercase tracking-wider">Streak</span>
            </div>
            <div>
              <p className="text-2xl font-medium">{summary?.currentStreak} <span className="text-sm text-muted-foreground font-normal">days</span></p>
              <p className="text-sm text-muted-foreground">Best: {summary?.longestStreak}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card shadow-sm border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{summary?.momentumLabel || "This Week"}</h3>
            <span className="text-sm text-muted-foreground">{weekly?.activeDays} of 7 days</span>
          </div>
          
          <div className="flex justify-between">
            {weekly?.week.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors
                  ${day.isActive ? 'bg-primary text-primary-foreground' : 
                    day.isToday ? 'border-2 border-primary text-foreground' : 
                    day.isFuture ? 'bg-transparent text-muted-foreground/30' : 
                    'bg-secondary text-muted-foreground'}`
                }>
                  {day.dayLabel[0]}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {recentSessions && recentSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-xl">Recent Sessions</h3>
            <Button variant="link" size="sm" asChild className="text-muted-foreground">
              <Link href="/history">View all</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <Card key={session.id} className="bg-card/50 border-none shadow-none">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-medium line-clamp-1">{session.bookTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(session.sessionDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{session.pagesRead} pgs</p>
                    <p className="text-sm text-muted-foreground">{session.minutesRead} min</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
