
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Megaphone, Send, ShieldAlert, CheckCircle2 } from "lucide-react";
import { adminAnnouncementAssistant, AdminAnnouncementAssistantOutput } from "@/ai/flows/admin-announcement-assistant";
import { useToast } from "@/hooks/use-toast";

export default function AdminAnnouncementsPage() {
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [context, setContext] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AdminAnnouncementAssistantOutput | null>(null);

  const handleGenerate = async () => {
    if (!draft) return;
    setIsAiLoading(true);
    try {
      const result = await adminAnnouncementAssistant({ 
        draftMessage: draft, 
        context: context 
      });
      setSuggestion(result);
      toast({
        title: "Draft Optimized",
        description: "AI has suggested a title and priority level based on your input.",
      });
    } catch (error) {
      console.error("AI Assistant error", error);
      toast({
        variant: "destructive",
        title: "AI Failed",
        description: "Could not generate suggestions at this time.",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSend = () => {
    toast({
      title: "Announcement Sent",
      description: "Successfully broadcast to all students.",
    });
    setDraft("");
    setSuggestion(null);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Megaphone className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-headline font-bold">Campus Broadcasting</h1>
          <p className="text-sm text-muted-foreground">Draft and deliver official university alerts.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="obsidian-card">
          <CardHeader>
            <CardTitle className="text-lg">Compose New Announcement</CardTitle>
            <CardDescription>Enter the core details. Dash AI will help refine the tone and priority.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Initial Draft</Label>
              <Textarea 
                placeholder="What is the announcement about?" 
                className="min-h-[120px] bg-background/50"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Context (Optional)</Label>
              <Input 
                placeholder="e.g. For final year students only" 
                className="bg-background/50"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>

            <Button 
              className="w-full champagne-gradient font-bold" 
              onClick={handleGenerate}
              disabled={isAiLoading || !draft}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isAiLoading ? "Processing with AI..." : "Optimize with AI Assistant"}
            </Button>
          </CardContent>
        </Card>

        {suggestion && (
          <Card className="obsidian-card border-primary/40 bg-primary/5 animate-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  AI Suggested Draft
                </CardTitle>
                <CardDescription>Refined for clarity and impact</CardDescription>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                suggestion.suggestedPriority === 'Emergency' ? 'bg-destructive text-destructive-foreground' :
                suggestion.suggestedPriority === 'Urgent' ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {suggestion.suggestedPriority} Priority
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Title</Label>
                <div className="p-3 bg-background rounded-md border font-headline font-bold">
                  {suggestion.suggestedTitle}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Revised Message</Label>
                <div className="p-4 bg-background rounded-md border text-sm leading-relaxed italic">
                  "{suggestion.revisedMessage}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Target Audience</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="fac-eng">Engineering Faculty</SelectItem>
                      <SelectItem value="year-4">4th Year Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Expiry</Label>
                  <Select defaultValue="24h">
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select expiry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="24h">24 Hours</SelectItem>
                      <SelectItem value="7d">7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setSuggestion(null)}>
                  Discard
                </Button>
                <Button className="flex-2 champagne-gradient font-bold px-8" onClick={handleSend}>
                  <Send className="w-4 h-4 mr-2" />
                  Broadcast Announcement
                </Button>
              </div>

              {suggestion.suggestedPriority === 'Emergency' && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-[11px] font-medium">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  This will override "Do Not Disturb" on student devices and show a full-screen alert.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
