"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen, Search, Plus, X, Loader2, FileText, Video, Link as LinkIcon,
  Image, FileCode, ExternalLink, Upload, Download, Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { uploadFile } from "@/lib/upload";

type Resource = {
  id: string;
  title: string;
  type: "PDF" | "VIDEO" | "LINK" | "IMAGE" | "TEXT" | "COURSE";
  description?: string;
  url?: string;
  content?: string;
  uploadedBy: { id: string; name: string; username: string; profilePhoto?: string | null };
  createdAt: string;
};

const RESOURCE_TYPES = ["PDF", "VIDEO", "LINK", "IMAGE", "TEXT", "COURSE"] as const;

const TYPE_ICONS: Record<string, any> = {
  PDF: FileText, VIDEO: Video, LINK: LinkIcon,
  IMAGE: Image, TEXT: FileCode, COURSE: BookOpen,
};

const TYPE_COLORS: Record<string, string> = {
  PDF: "text-red-500 bg-red-500/10 border-red-500/20",
  VIDEO: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  LINK: "text-green-500 bg-green-500/10 border-green-500/20",
  IMAGE: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  TEXT: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  COURSE: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
};

export function LibraryTab({ schoolId }: { schoolId?: string }) {
  const { toast } = useToast();
  const { dashUser } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string>("");
  const [addOpen, setAddOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("PDF");
  const [description, setDescription] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [textContent, setTextContent] = useState("");
  const [uploadFile_, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useState<HTMLInputElement | null>(null);
  const setFileRef = fileRef[1];
  const fileRefValue = fileRef[0];

  useEffect(() => {
    loadResources();
  }, [schoolId]);

  async function loadResources() {
    if (!schoolId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ schoolId });
      if (activeType) params.set("type", activeType);
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/library?${params}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(json.resources)) {
        setResources(json.resources);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load library resources", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResources();
  }, [activeType, search]);

  const handleUpload = async () => {
    if (!title.trim() || !dashUser?.id || !schoolId) return;
    setUploading(true);
    try {
      let finalUrl = urlInput;
      let finalContent = textContent;

      if (uploadFile_) {
        const { url, error } = await uploadFile(uploadFile_, "library", dashUser.id);
        if (error) throw new Error(error);
        finalUrl = url;
      }

      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          description: description.trim(),
          url: finalUrl,
          content: finalContent,
          schoolId,
          uploadedById: dashUser.id,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to add resource");

      toast({ title: "Resource added!" });
      setAddOpen(false);
      setTitle("");
      setDescription("");
      setUrlInput("");
      setTextContent("");
      setUploadFile(null);
      loadResources();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const deleteResource = async (id: string) => {
    try {
      const res = await fetch(`/api/library?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setResources(prev => prev.filter(r => r.id !== id));
      toast({ title: "Resource deleted" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const filteredResources = resources.filter(r => !activeType || r.type === activeType);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..." className="pl-10 h-9 text-sm bg-muted/30" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <Button size="sm" className="dash-button-primary h-8 text-xs gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      <Tabs value={activeType || "all"} onValueChange={v => setActiveType(v === "all" ? "" : v)}>
        <TabsList className="bg-transparent h-auto p-0 gap-2 border-b w-full justify-start rounded-none overflow-x-auto no-scrollbar">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary/10 data-[state=active]:shadow-none data-[state=active]:text-primary rounded-full px-3 py-1.5 text-xs font-medium">All</TabsTrigger>
          {RESOURCE_TYPES.map(rt => (
            <TabsTrigger key={rt} value={rt} className="data-[state=active]:bg-primary/10 data-[state=active]:shadow-none data-[state=active]:text-primary rounded-full px-3 py-1.5 text-xs font-medium gap-1.5">
              {React.createElement(TYPE_ICONS[rt] || BookOpen, { className: "w-3 h-3" })} {rt}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeType || "all"} className="pt-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No resources found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredResources.map((r, i) => (
                <Card key={r.id} className="dash-card animate-in fade-in duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[r.type] || "bg-muted text-muted-foreground"} border`}>
                        {React.createElement(TYPE_ICONS[r.type] || BookOpen, { className: "w-4 h-4" })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold truncate">{r.title}</h3>
                          <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 font-bold shrink-0">{r.type}</Badge>
                        </div>
                        {r.description && <p className="text-[11px] text-muted-foreground line-clamp-2 mb-1">{r.description}</p>}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>by {r.uploadedBy?.name || "Unknown"}</span>
                          <span>·</span>
                          <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border">
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button size="sm" variant="outline" className="w-full h-7 text-[10px] gap-1">
                            {r.type === "LINK" ? <ExternalLink className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                            {r.type === "LINK" ? "Open" : "Download"}
                          </Button>
                        </a>
                      )}
                      {r.content && (
                        <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => navigator.clipboard.writeText(r.content!)}>
                          <FileCode className="w-3 h-3" /> Copy
                        </Button>
                      )}
                      {dashUser?.id === r.uploadedBy?.id && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => deleteResource(r.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Resource Dialog */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) { setTitle(""); setDescription(""); setUrlInput(""); setTextContent(""); setUploadFile(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Add Resource
            </DialogTitle>
            <DialogDescription>Share a study resource with your campus community</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9 text-sm bg-muted/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map(rt => (
                    <SelectItem key={rt} value={rt}>{React.createElement(TYPE_ICONS[rt] || BookOpen, { className: "w-3.5 h-3.5 mr-2" })} {rt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Introduction to Calculus" className="h-9 text-sm bg-muted/30" maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Description (optional)</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." className="min-h-[60px] resize-none text-sm bg-muted/30" maxLength={2000} />
            </div>
            {(type === "PDF" || type === "VIDEO" || type === "IMAGE") && (
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Upload File</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => fileRefValue?.click()}>
                    <Upload className="w-3 h-3 mr-1.5" /> Choose File
                  </Button>
                  <span className="text-[10px] text-muted-foreground">{uploadFile_ ? uploadFile_.name : "No file selected"}</span>
                </div>
                <input ref={setFileRef} type="file" hidden onChange={e => setUploadFile(e.target.files?.[0] || null)} />
              </div>
            )}
            {type === "LINK" && (
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">URL</Label>
                <Input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." className="h-9 text-sm bg-muted/30" />
              </div>
            )}
            {type === "TEXT" && (
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Content</Label>
                <Textarea value={textContent} onChange={e => setTextContent(e.target.value)} placeholder="Paste text content..." className="min-h-[150px] resize-none text-sm bg-muted/30" />
              </div>
            )}
            {type === "COURSE" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Course URL</Label>
                  <Input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." className="h-9 text-sm bg-muted/30" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Notes</Label>
                  <Textarea value={textContent} onChange={e => setTextContent(e.target.value)} placeholder="Course notes..." className="min-h-[80px] resize-none text-sm bg-muted/30" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)} disabled={uploading}>Cancel</Button>
            <Button size="sm" className="dash-button-primary h-8 px-4 text-xs" onClick={handleUpload} disabled={uploading || !title.trim()}>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
              Add Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}