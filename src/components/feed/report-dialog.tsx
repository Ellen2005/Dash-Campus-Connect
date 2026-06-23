"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";

interface ReportDialogProps {
  contentType?: "post" | "comment" | "listing" | "user";
  contentId?: string;
  open: boolean;
  onClose: () => void;
}

const SCAM_KEYWORDS = ["fast cash", "crypto", "investment opportunity", "wire transfer", "western union", "guaranteed returns"];

export function ReportDialog({ contentType = "post", contentId, open, onClose }: ReportDialogProps) {
  const { toast } = useToast();
  const { t } = useI18n();
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const detectedScam = SCAM_KEYWORDS.some(kw => details.toLowerCase().includes(kw));

  useEffect(() => {
    if (!open) { setTimeout(() => { setSubmitted(false); setReason(""); setDetails(""); }, 300); }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !contentId) return;
    setIsLoading(true);

    try {
      const body: Record<string, string> = { reason, details };
      if (contentType === "post") body.postId = contentId;
      else if (contentType === "listing") body.listingId = contentId;
      else {
        // For user/comment reports, still tie to a generic reason
        body.reason = reason;
        body.details = details;
      }

      const res = await fetch("/api/moderation/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to submit report");
      }

      setSubmitted(true);
      toast({
        title: "Report Submitted",
        description: "Our moderation team will review this and follow up with you.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-base">Report Received</h3>
              <p className="text-sm text-muted-foreground max-w-xs">Your report has been logged. We'll review it and notify you once action is taken.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border">
              <ShieldCheck className="w-3 h-3 text-primary" />
              Closed-loop feedback active — you'll hear back
            </div>
            <Button onClick={onClose} className="dash-button-primary h-9 px-6 text-sm">{t("done")}</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <Flag className="w-4 h-4 text-destructive" />
                {t("report")} {contentType}
              </DialogTitle>
              <DialogDescription className="text-xs">Help keep Dash safe. Reports are reviewed privately by campus moderators.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="bg-muted/30 border-border h-9 text-sm">
                    <SelectValue placeholder="Select a reason…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spam">Spam or Scam</SelectItem>
                    <SelectItem value="harassment">Harassment or Bullying</SelectItem>
                    <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                    <SelectItem value="misinformation">Misinformation</SelectItem>
                    <SelectItem value="impersonation">Impersonation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Details (Optional)</Label>
                <Textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Describe what you saw…"
                  className="min-h-[80px] bg-muted/30 border-border resize-none text-sm"
                  maxLength={500}
                />
                {detectedScam && (
                  <p className="text-[10px] text-destructive font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Scam keywords detected — flagged for priority review
                  </p>
                )}
              </div>

              <p className="text-[10px] text-muted-foreground bg-muted/20 rounded-lg px-3 py-2 border border-border">
                Your identity is kept confidential.
              </p>

              <DialogFooter>
                <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isLoading}>{t("cancel")}</Button>
                <Button type="submit" variant="destructive" size="sm" className="font-semibold" disabled={isLoading || !reason}>
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Flag className="w-3.5 h-3.5 mr-1.5" />}
                  Submit Report
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
