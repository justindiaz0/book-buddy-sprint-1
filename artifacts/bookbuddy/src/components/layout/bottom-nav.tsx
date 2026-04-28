import { Link, useLocation } from "wouter";
import { Home, Play, CalendarDays, Library, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const authPaths = ["/", "/auth/signup", "/auth/signin", "/onboarding", "/session", "/session/success"];
  if (authPaths.includes(location)) {
    return null;
  }

  const tabs = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "History", href: "/history", icon: CalendarDays },
    { name: "Session", href: "/session", icon: Play, special: true },
    { name: "Books", href: "/books", icon: Library },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex items-center justify-around px-2 h-16 max-w-md mx-auto relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.href || (location.startsWith("/books/") && tab.href === "/books");

          if (tab.special) {
            return (
              <Link key={tab.href} href={tab.href} className="relative -top-4">
                <div className={cn(
                  "flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform active:scale-95",
                  isActive ? "bg-primary text-primary-foreground" : "bg-primary/90 text-primary-foreground hover:bg-primary"
                )}>
                  <Icon className="w-6 h-6 ml-1" fill="currentColor" />
                </div>
              </Link>
            );
          }

          return (
            <Link key={tab.href} href={tab.href} className={cn(
              "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
