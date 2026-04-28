import { useState } from "react";
import { Link } from "wouter";
import { useListBooks, useCreateBook, getListBooksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Books() {
  const queryClient = useQueryClient();
  const { data: books, isLoading } = useListBooks();
  const createBook = useCreateBook();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newTotalPages, setNewTotalPages] = useState("");
  const [newCurrentPage, setNewCurrentPage] = useState("");
  const [makeCurrentBook, setMakeCurrentBook] = useState(true);

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTotalPages) {
      toast.error("Please fill in the required fields");
      return;
    }

    createBook.mutate(
      {
        data: {
          title: newTitle,
          author: newAuthor || undefined,
          totalPages: parseInt(newTotalPages),
          currentPage: parseInt(newCurrentPage) || 0,
          setAsCurrent: makeCurrentBook
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          setIsDialogOpen(false);
          setNewTitle("");
          setNewAuthor("");
          setNewTotalPages("");
          setNewCurrentPage("");
          setMakeCurrentBook(true);
          toast.success("Book added successfully");
        },
        onError: () => {
          toast.error("Failed to add book");
        }
      }
    );
  };

  const currentBook = books?.find(b => b.isCurrent);
  const otherBooks = books?.filter(b => !b.isCurrent) || [];

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-serif tracking-tight">Library</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full shadow-lg h-10 w-10">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Add a book</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddBook} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input 
                  id="title" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  placeholder="e.g. Dune"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input 
                  id="author" 
                  value={newAuthor} 
                  onChange={e => setNewAuthor(e.target.value)} 
                  placeholder="e.g. Frank Herbert"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalPages">Total Pages *</Label>
                  <Input 
                    id="totalPages" 
                    type="number" 
                    value={newTotalPages} 
                    onChange={e => setNewTotalPages(e.target.value)} 
                    placeholder="e.g. 412"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentPage">Current Page</Label>
                  <Input 
                    id="currentPage" 
                    type="number" 
                    value={newCurrentPage} 
                    onChange={e => setNewCurrentPage(e.target.value)} 
                    placeholder="e.g. 0"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="setAsCurrent" 
                  checked={makeCurrentBook} 
                  onCheckedChange={(c) => setMakeCurrentBook(c === true)} 
                />
                <Label htmlFor="setAsCurrent" className="font-normal text-muted-foreground">
                  Set as my current read
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={createBook.isPending}>
                {createBook.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Book
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {currentBook && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Currently Reading</h2>
              <Link href={`/books/${currentBook.id}`}>
                <Card className="border-primary/20 bg-card hover-elevate transition-all cursor-pointer">
                  <CardContent className="p-5 flex gap-4">
                    <div className="w-16 h-24 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-3 justify-center flex flex-col">
                      <div>
                        <h3 className="font-medium text-lg leading-tight line-clamp-2">{currentBook.title}</h3>
                        {currentBook.author && <p className="text-sm text-muted-foreground">{currentBook.author}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>p. {currentBook.currentPage}</span>
                          <span className="font-medium text-foreground">{currentBook.percentComplete}%</span>
                        </div>
                        <Progress value={currentBook.percentComplete} className="h-1.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}

          {otherBooks.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Your Library</h2>
              <div className="grid gap-3">
                {otherBooks.map(book => (
                  <Link key={book.id} href={`/books/${book.id}`}>
                    <Card className="border-border/50 bg-card/50 hover:bg-card hover-elevate transition-all cursor-pointer">
                      <CardContent className="p-4 flex gap-4 items-center">
                        <div className="w-12 h-16 bg-secondary/50 rounded flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{book.title}</h3>
                          {book.author && <p className="text-sm text-muted-foreground truncate">{book.author}</p>}
                        </div>
                        {book.isCompleted ? (
                          <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">
                            Finished
                          </div>
                        ) : (
                          <div className="text-right flex-shrink-0">
                            <span className="text-sm font-medium">{book.percentComplete}%</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ) : !currentBook ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border/50 rounded-xl space-y-4">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <p>Your library is empty.<br/>Add a book to start tracking.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
