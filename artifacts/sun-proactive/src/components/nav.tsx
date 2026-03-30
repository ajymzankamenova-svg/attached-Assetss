import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { 
  Sun, 
  Menu,
  LayoutDashboard,
  CheckSquare,
  PlusCircle,
  Users,
  MessageSquare,
  Shield,
  User,
  LogOut,
  Bell
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetNotifications } from "@workspace/api-client-react";

export function Nav() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [location, setLocation] = useLocation();

  const { data: notifications = [] } = useGetNotifications({
    query: {
      enabled: !!user,
      queryKey: ["/api/notifications"]
    }
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const NavLinks = () => (
    <>
      <Link href="/dashboard" className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${location.startsWith('/dashboard') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
        <LayoutDashboard className="w-4 h-4" /> {t("nav.dashboard")}
      </Link>
      <Link href="/tasks" className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${location === '/tasks' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
        <CheckSquare className="w-4 h-4" /> {t("nav.tasks")}
      </Link>
      
      {user?.role === "admin" && (
        <>
          <Link href="/create-task" className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${location.startsWith('/create-task') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
            <PlusCircle className="w-4 h-4" /> {t("nav.create_task")}
          </Link>
          <Link href="/admin" className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${location.startsWith('/admin') && !location.startsWith('/admin/tasks') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
            <Shield className="w-4 h-4" /> {t("nav.admin")}
          </Link>
        </>
      )}

      <Link href="/volunteers" className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${location.startsWith('/volunteers') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
        <Users className="w-4 h-4" /> {t("nav.volunteers")}
      </Link>
      <Link href="/chat" className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${location.startsWith('/chat') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
        <MessageSquare className="w-4 h-4" /> {t("nav.chat")}
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Sun className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline-block">Sun Proactive</span>
          </Link>
          
          {user && (
            <nav className="hidden md:flex gap-1">
              <NavLinks />
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 px-0 font-medium">
                {language.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage("en")}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("ru")}>Русский</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("kz")}>Қазақша</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <>
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-destructive"></span>
                  )}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} alt={user.name} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full cursor-pointer flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {t("nav.profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex gap-2">
              <Link href="/login">
                <Button variant="ghost">{t("nav.login")}</Button>
              </Link>
              <Link href="/register">
                <Button>{t("nav.register")}</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          {user && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col gap-4 pt-12">
                <NavLinks />
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}
