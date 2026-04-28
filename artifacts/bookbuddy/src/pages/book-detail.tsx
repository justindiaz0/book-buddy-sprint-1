import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  useGetBook, 
  useUpdateBook, 
  useCompleteBook, 
  useListSessions,
  getGetBookQueryKey,
  getListBooksQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Clock, Calendar as CalendarIcon, CheckCircle2, Loader2, Edit2, BookmarkPlus } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function BookDetail() {
  const [, params] = useRoute("/books/:id");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const bookId = params?.id ? parseInt(params.id) : 0;
  
  const { data: book, isLoading: isLoadingBook } = useGetBook(bookId, { query: { enabled: !!bookId } });
  const { data: sessions, isLoading: isLoadingSessions } = useListSessions({ bookId });
  
  const updateBook = useUpdateBook();
  const completeBook = useCompleteBook();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editTotalPages, setEditTotalPages] = useState("");

  useEffect(() => {
    if (book) {
      setEditTitle(book.title);
      setEditAuthor(book.author || "");
      setEditTotalPages(book.totalPages.toString());
    }
  }, [book]);

  if (isLoadingBook) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-6 text-center">
        <p>Book not found</p>
        <Button variant="link" onClick={() => setLocation("/books")}>Back to library</Button>
      </div>
    );
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBook.mutate(
      {
        id: bookId,
        data: {
          title: editTitle,
          author: editAuthor || undefined,
          totalPages: parseInt(editTotalPages),
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBookQueryKey(bookId) });
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          setIsEditOpen(false);
          toast.success("Book updated");
        },
        onError: () => toast.error("Failed to update book")
      }
    );
  };

  const handleSetCurrent = () => {
    updateBook.mutate(
      {
        id: bookId,
        data: { isCurrent: true }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBookQueryKey(bookId) });
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          toast.success("Set as current read");
        }
      }
    );
  };

  const handleComplete = () => {
    completeBook.mutate(
      { id: bookId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBookQueryKey(bookId) });
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          toast.success("Book marked as completed! 🎉");
        }
      }
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 animate-in fade-in duration-500">
      <header className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/books")} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Edit2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Book</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input value={editAuthor} onChange={e => setEditAuthor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Total Pages</Label>
                <Input type="number" value={editTotalPages} onChange={e => setEditTotalPages(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={updateBook.isPending}>
                {updateBook.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="text-center space-y-4 px-4">
        <div className="w-32 h-48 bg-secondary rounded-lg mx-auto flex items-center justify-center shadow-lg">
          <BookOpen className="w-12 h-12 text-muted-foreground/30" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-serif leading-tight">{book.title}</h1>
          {book.author && <p className="text-muted-foreground">{book.author}</p>}
        </div>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0 space-y-6">
          <div className="space-y-2 bg-card p-6 rounded-2xl border border-border/50">
            <div className="flex justify-between items-end mb-2">
              <div className="space-y-1">
                <p className="text-3xl font-medium text-foreground">{book.percentComplete}%</p>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Complete</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-foreground">{book.currentPage} <span className="text-muted-foreground">/ {book.totalPages}</span></p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pages</p>
              </div>
            </div>
            <Progress value={book.percentComplete} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card p-4 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center space-y-1">
              <Clock className="w-5 h-5 text-muted-foreground mb-1" />
              <p className="font-medium text-lg">{book.totalSessions}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Sessions</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center space-y-1">
              <CalendarIcon className="w-5 h-5 text-muted-foreground mb-1" />
              <p className="font-medium text-sm">
                {book.lastReadAt ? format(new Date(book.lastReadAt), "MMM d") : "Never"}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Read</p>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            {!book.isCurrent && !book.isCompleted && (
              <Button 
                className="w-full text-lg py-6 bg-secondary text-secondary-foreground hover:bg-secondary/80" 
                onClick={handleSetCurrent}
                disabled={updateBook.isPending}
              >
                <BookmarkPlus className="w-5 h-5 mr-2" />
                Set as current read
              </Button>
            )}
            
            {!book.isCompleted && (
              <Button 
                variant={book.percentComplete >= 100 ? "default" : "outline"}
                className={`w-full text-lg py-6 ${book.percentComplete >= 100 ? 'bg-primary text-primary-foreground' : ''}`}
                onClick={handleComplete}
                disabled={completeBook.isPending}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Mark as finished
              </Button>
            )}

            {book.isCompleted && (
              <div className="bg-primary/10 text-primary p-4 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Finished on {book.completedAt ? format(new Date(book.completedAt), "MMMM d, yyyy") : "Unknown date"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {sessions && sessions.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-border/50">
          <h3 className="font-medium text-lg">Session History</h3>
          <div className="space-y-3">
            {sessions.map(session => (
              <Card key={session.id} className="bg-card/50 border-none shadow-none">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-medium">{format(new Date(session.sessionDate), "MMM d, yyyy")}</p>
                    <p className="text-sm text-muted-foreground">Pages {session.startPage} - {session.endPage}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">{session.pagesRead} pages</p>
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
