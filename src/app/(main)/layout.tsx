
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Search, PlusSquare, User, Menu } from "lucide-react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg champagne-gradient flex items-center justify-center font-headline font-bold text-lg text-background">
              D
            </div>
            <span className="font-headline font-bold text-lg">Dash</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <PlusSquare className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 md:px-8">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden flex items-center justify-around p-2 border-t bg-card sticky bottom-0 z-50">
          <Button variant="ghost" size="icon" className="flex flex-col items-center gap-1 h-auto py-2 flex-1">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <Search className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="flex flex-col items-center gap-1 h-auto py-2 flex-1">
            <PlusSquare className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="flex flex-col items-center gap-1 h-auto py-2 flex-1">
            <User className="w-6 h-6" />
          </Button>
        </nav>
      </div>

      {/* Right Sidebar - Trends/Suggestions */}
      <aside className="w-80 p-6 hidden lg:block border-l">
        <div className="sticky top-6 space-y-6">
          <div className="obsidian-card p-4 space-y-4">
            <h3 className="font-headline font-bold text-sm">Campus Trends</h3>
            <div className="space-y-3">
              {[
                { tag: "#Hackathon2025", posts: "1.2k" },
                { tag: "#FinalsWeek", posts: "850" },
                { tag: "#CampusElections", posts: "420" },
                { tag: "#LostAndFound", posts: "120" },
              ].map((trend) => (
                <div key={trend.tag} className="flex flex-col">
                  <span className="text-sm font-bold text-primary hover:underline cursor-pointer">{trend.tag}</span>
                  <span className="text-[10px] text-muted-foreground">{trend.posts} posts</span>
                </div>
              ))}
            </div>
            <Button variant="link" className="p-0 h-auto text-xs text-primary">Show more</Button>
          </div>

          <div className="obsidian-card p-4 space-y-4">
            <h3 className="font-headline font-bold text-sm">Suggested to Follow</h3>
            <div className="space-y-4">
              {[
                { name: "Dr. Sarah Miller", username: "sarahm", verified: true },
                { name: "Engineering Society", username: "eng_soc", verified: true },
                { name: "Jake Thompson", username: "jake_t", verified: false },
              ].map((user) => (
                <div key={user.username} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8 border">
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold truncate max-w-[100px]">{user.name}</span>
                      <span className="text-[10px] text-muted-foreground">@{user.username}</span>
                    </div>
                  </div>
                  <Button size="sm" className="h-7 text-[10px] rounded-full px-3">Follow</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
