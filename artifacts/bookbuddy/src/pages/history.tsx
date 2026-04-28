import { useState } from "react";
import { useGetReadingHistory } from "@workspace/api-client-react";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen, Clock, Calendar as CalendarIcon, Flame } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function History() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(format(new Date(), "yyyy-MM-dd"));
  
  const monthStr = format(currentDate, "yyyy-MM");
  
  const { data: history, isLoading } = useGetReadingHistory({ month: monthStr });

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for calendar grid
  const startDay = monthStart.getDay(); // 0 = Sunday
  const paddingDays = Array(startDay).fill(null);

  const selectedSessions = selectedDate && history?.sessionsByDate[selectedDate] 
    ? history.sessionsByDate[selectedDate] 
    : [];

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-serif tracking-tight">History</h1>
      </header>

      <Card className="border-border/50 bg-card shadow-sm">
        <CardContent className="p-5 space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-medium text-lg">{format(currentDate, "MMMM yyyy")}</h2>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}
            
            {daysInMonth.map(date => {
              const dateStr = format(date, "yyyy-MM-dd");
              const hasActivity = history?.activeDates.includes(dateStr);
              const isSelected = selectedDate === dateStr;
              const isCurrentDay = isToday(date);
              
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`
                    aspect-square rounded-full flex items-center justify-center text-sm transition-all
                    ${isSelected ? 'bg-foreground text-background font-medium' : 
                      isCurrentDay ? 'border-2 border-primary text-primary font-medium' : 
                      hasActivity ? 'bg-primary/20 text-foreground font-medium' : 
                      'text-muted-foreground hover:bg-secondary'}
                  `}
                >
                  {format(date, "d")}
                </button>
              );
            })}
          </div>

          {history?.monthlyStats && (
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
              <div className="text-center space-y-1">
                <div className="text-2xl font-medium text-foreground">{history.monthlyStats.activeDays}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Days</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-medium text-foreground">{history.monthlyStats.totalMinutes}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Minutes</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-medium text-primary">{history.monthlyStats.totalPages}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pages</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDate && (
        <div className="space-y-4">
          <h3 className="font-medium text-lg flex items-center">
            {format(new Date(selectedDate), "MMMM d, yyyy")}
          </h3>
          
          {selectedSessions.length > 0 ? (
            <div className="space-y-3">
              {selectedSessions.map(session => (
                <Card key={session.id} className="bg-card/50 border-none shadow-none">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-medium line-clamp-1">{session.bookTitle}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(session.createdAt), "h:mm a")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        {session.minutesRead} min
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                        {session.pagesRead} pages (p.{session.startPage}-{session.endPage})
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border/50 rounded-xl">
              <p>No reading sessions logged.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
