
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/feed/post-card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Sparkles, Edit3, MapPin, Calendar, BookOpen, UserPlus, Grid, Image as ImageIcon, Bookmark } from "lucide-react";
import { studentBioGenerator } from "@/ai/flows/student-bio-generator";

export default function ProfilePage() {
  const [bio, setBio] = useState("Final year Computer Science student. Passionate about AI and distributed systems.");
  const [academicField, setAcademicField] = useState("Computer Science");
  const [interests, setInterests] = useState("AI, Coding, Hiking, Chess");
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  const handleGenerateBio = async () => {
    setIsGeneratingBio(true);
    try {
      const result = await studentBioGenerator({ academicField, interests });
      setBio(result.bio);
    } catch (error) {
      console.error("Bio gen failed", error);
    } finally {
      setIsGeneratingBio(false);
    }
  };

  return (
    <div className="pb-20">
      <div className="relative mb-20">
        <div className="h-48 w-full bg-gradient-to-r from-background to-muted rounded-xl border overflow-hidden">
          <img src="https://picsum.photos/seed/dashcover/1200/400" alt="Cover" className="w-full h-full object-cover opacity-60" />
        </div>
        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
            <AvatarImage src="https://picsum.photos/seed/me/200/200" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div className="mb-4 space-y-1">
            <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
              Alex Rivera
              <div className="h-4 w-4 champagne-gradient rounded-full" />
            </h1>
            <p className="text-sm text-muted-foreground">@arivera_comp</p>
          </div>
        </div>
        <div className="absolute -bottom-12 right-8 flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="obsidian-card max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Your Profile</DialogTitle>
                <DialogDescription>Use Dash AI to craft a creative bio based on your interests.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label>Academic Field</Label>
                  <Input value={academicField} onChange={(e) => setAcademicField(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Interests (comma separated)</Label>
                  <Input value={interests} onChange={(e) => setInterests(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Bio</Label>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-[10px] h-auto p-0 text-primary font-bold"
                      onClick={handleGenerateBio}
                      disabled={isGeneratingBio}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {isGeneratingBio ? "Drafting..." : "Draft with Dash AI"}
                    </Button>
                  </div>
                  <textarea 
                    className="w-full min-h-[100px] bg-background border rounded-md p-3 text-sm"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                <Button className="w-full champagne-gradient font-bold">Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" className="gap-2 champagne-gradient font-bold">
            <UserPlus className="w-4 h-4" />
            Connections
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="obsidian-card p-6 space-y-4">
            <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-muted-foreground">About</h3>
            <p className="text-sm leading-relaxed">{bio}</p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>{academicField}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Modern Campus, Wing B</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Joined Sept 2021</span>
              </div>
            </div>
            <div className="flex items-center gap-6 pt-4 border-t">
              <div className="text-center">
                <p className="text-lg font-bold">245</p>
                <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">189</p>
                <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Following</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="bg-transparent h-auto p-0 gap-8 border-b w-full justify-start rounded-none">
              <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-bold gap-2">
                <Grid className="w-4 h-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="media" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-bold gap-2">
                <ImageIcon className="w-4 h-4" />
                Media
              </TabsTrigger>
              <TabsTrigger value="saved" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-bold gap-2">
                <Bookmark className="w-4 h-4" />
                Saved
              </TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="pt-6 space-y-6">
              <PostCard 
                author={{ name: "Alex Rivera", username: "arivera_comp", avatar: "https://picsum.photos/seed/me/100/100" }}
                content="Just finished the distributed systems project! If anyone needs help with the Raft algorithm implementation, hit me up. #ComputerScience #Raft"
                image="https://picsum.photos/seed/code/800/400"
                timestamp="15 mins ago"
                likes={124}
                comments={18}
              />
            </TabsContent>
            <TabsContent value="media" className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden border">
                    <img src={`https://picsum.photos/seed/media${i}/300/300`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
