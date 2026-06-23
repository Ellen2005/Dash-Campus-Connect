"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, Users, Layers, MoveUp, MoveDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashLogo } from "@/components/shared/dash-logo";
import Link from "next/link";

type Level = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  _count: {
    students: number;
    communities: number;
  };
};

export default function AdminLevelsPage() {
  const { toast } = useToast();
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-portal/levels", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && Array.isArray(json?.levels)) {
        setLevels(json.levels);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load levels.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const openCreate = () => {
    setEditingLevel(null);
    setName("");
    setDescription("");
    setOrder(levels.length);
    setDialogOpen(true);
  };

  const openEdit = (level: Level) => {
    setEditingLevel(level);
    setName(level.name);
    setDescription(level.description || "");
    setOrder(level.order);
    setDialogOpen(true);
  };

  const saveLevel = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Level name is required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const url = editingLevel
        ? `/api/admin-portal/levels?id=${editingLevel.id}`
        : "/api/admin-portal/levels";
      const method = editingLevel ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          order,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: json?.error ?? "Failed to save level.", variant: "destructive" });
        return;
      }

      toast({
        title: editingLevel ? "Level updated" : "Level created",
        description: editingLevel
          ? "Level has been updated successfully."
          : "Level created with auto-communities.",
      });

      setDialogOpen(false);
      fetchLevels();
    } catch {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setLevelToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const deleteLevel = async () => {
    if (!levelToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin-portal/levels?id=${levelToDelete}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: json?.error ?? "Failed to delete level.", variant: "destructive" });
        return;
      }
      toast({ title: "Deleted", description: "Level has been deleted." });
      setDeleteConfirmOpen(false);
      fetchLevels();
    } catch {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const moveLevel = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= levels.length) return;

    // Optimistic update
    const updatedLevels = [...levels];
    const temp = updatedLevels[index];
    updatedLevels[index] = { ...updatedLevels[newIndex], order: index };
    updatedLevels[newIndex] = { ...temp, order: newIndex };
    setLevels(updatedLevels);

    // Save to server
    try {
      await fetch(`/api/admin-portal/levels?id=${temp.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: temp.name, order: newIndex }),
      });
    } catch {
      // Revert on failure
      fetchLevels();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin-portal" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Portal</span>
            </Link>
            <span className="text-muted-foreground">|</span>
            <span className="font-headline font-bold text-sm">Levels of Study</span>
          </div>
          <div className="flex items-center gap-2">
            <DashLogo size={28} />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-headline font-bold">Levels of Study</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage academic levels (e.g., Year 1, Year 2). Creating a level auto-generates communities.
            </p>
          </div>
          <Button onClick={openCreate} className="dash-button-primary gap-2">
            <Plus className="w-4 h-4" />
            Add Level
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : levels.length === 0 ? (
          <div className="text-center py-12 dash-card">
            <Layers className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm font-semibold">No levels yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first level of study.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {levels.map((level, i) => (
              <div
                key={level.id}
                className="dash-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 animate-in fade-in duration-200"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => moveLevel(i, "up")}
                    disabled={i === 0}
                  >
                    <MoveUp className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => moveLevel(i, "down")}
                    disabled={i === levels.length - 1}
                  >
                    <MoveDown className="w-3 h-3" />
                  </Button>
                </div>
                <Avatar className="w-10 h-10 shrink-0 bg-primary/10">
                  <AvatarFallback className="bg-transparent text-primary font-bold text-sm">
                    L{level.order + 1}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{level.name}</p>
                    {level._count.students > 0 && (
                      <Badge variant="secondary" className="text-[9px] gap-1">
                        <Users className="w-2.5 h-2.5" />
                        {level._count.students}
                      </Badge>
                    )}
                    {level._count.communities > 0 && (
                      <Badge variant="outline" className="text-[9px] gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        {level._count.communities} communities
                      </Badge>
                    )}
                  </div>
                  {level.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{level.description}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openEdit(level)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => confirmDelete(level.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLevel ? "Edit Level" : "Create Level of Study"}</DialogTitle>
            <DialogDescription>
              {editingLevel
                ? "Update the level details."
                : "Adding a level will auto-create communities for all field combinations."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Level Name *
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Level 1, Year 1, Final Year"
                className="h-9 text-sm bg-muted/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Description (optional)
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this level..."
                className="min-h-[80px] text-sm bg-muted/30 resize-none"
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="dash-button-primary h-8 px-4" onClick={saveLevel} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              {editingLevel ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Level?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the level and may affect
              associated communities.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-8 px-4"
              onClick={deleteLevel}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}