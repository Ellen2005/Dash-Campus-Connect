"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, Users, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashLogo } from "@/components/shared/dash-logo";
import Link from "next/link";

type Field = {
  id: string;
  name: string;
  description: string | null;
  _count: {
    students: number;
    communities: number;
  };
};

export default function AdminFieldsPage() {
  const { toast } = useToast();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-portal/fields", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && Array.isArray(json?.fields)) {
        setFields(json.fields);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load fields.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const openCreate = () => {
    setEditingField(null);
    setName("");
    setDescription("");
    setDialogOpen(true);
  };

  const openEdit = (field: Field) => {
    setEditingField(field);
    setName(field.name);
    setDescription(field.description || "");
    setDialogOpen(true);
  };

  const saveField = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Field name is required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const url = editingField
        ? `/api/admin-portal/fields?id=${editingField.id}`
        : "/api/admin-portal/fields";
      const method = editingField ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: json?.error ?? "Failed to save field.", variant: "destructive" });
        return;
      }

      toast({
        title: editingField ? "Field updated" : "Field created",
        description: editingField
          ? "Field has been updated successfully."
          : "Field created with auto-communities.",
      });

      setDialogOpen(false);
      fetchFields();
    } catch {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setFieldToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const deleteField = async () => {
    if (!fieldToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin-portal/fields?id=${fieldToDelete}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: json?.error ?? "Failed to delete field.", variant: "destructive" });
        return;
      }
      toast({ title: "Deleted", description: "Field has been deleted." });
      setDeleteConfirmOpen(false);
      fetchFields();
    } catch {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally {
      setDeleting(false);
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
            <span className="font-headline font-bold text-sm">Fields of Study</span>
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
            <h1 className="text-xl font-headline font-bold">Fields of Study</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage academic fields. Creating a field auto-generates communities.
            </p>
          </div>
          <Button onClick={openCreate} className="dash-button-primary gap-2">
            <Plus className="w-4 h-4" />
            Add Field
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-12 dash-card">
            <Layers className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm font-semibold">No fields yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first field of study.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, i) => (
              <div
                key={field.id}
                className="dash-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 animate-in fade-in duration-200"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <Avatar className="w-10 h-10 shrink-0 bg-primary/10">
                  <AvatarFallback className="bg-transparent text-primary font-bold text-sm">
                    {field.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{field.name}</p>
                    {field._count.students > 0 && (
                      <Badge variant="secondary" className="text-[9px] gap-1">
                        <Users className="w-2.5 h-2.5" />
                        {field._count.students}
                      </Badge>
                    )}
                    {field._count.communities > 0 && (
                      <Badge variant="outline" className="text-[9px] gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        {field._count.communities} communities
                      </Badge>
                    )}
                  </div>
                  {field.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{field.description}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openEdit(field)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => confirmDelete(field.id)}
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
            <DialogTitle>{editingField ? "Edit Field" : "Create Field of Study"}</DialogTitle>
            <DialogDescription>
              {editingField
                ? "Update the field details."
                : "Adding a field will auto-create communities for all level combinations."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Field Name *
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Computer Science, Engineering"
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
                placeholder="Brief description of this field..."
                className="min-h-[80px] text-sm bg-muted/30 resize-none"
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="dash-button-primary h-8 px-4" onClick={saveField} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              {editingField ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Field?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the field and may affect
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
              onClick={deleteField}
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