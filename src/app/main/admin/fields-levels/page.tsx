"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Loader2, GraduationCap, Layers, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

export default function AdminFieldsLevelsPage() {
  const { toast } = useToast();
  const { dashUser } = useAuth();
  const [fields, setFields] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fieldDialog, setFieldDialog] = useState(false);
  const [levelDialog, setLevelDialog] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [fieldForm, setFieldForm] = useState({ name: "", description: "" });
  const [levelForm, setLevelForm] = useState({ name: "", description: "", order: "0" });
  const [saving, setSaving] = useState(false);

  const schoolId = dashUser?.schoolId;

  const loadData = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [fieldsRes, levelsRes] = await Promise.all([
        fetch(`/api/admin/fields?schoolId=${schoolId}`, { cache: "no-store" }),
        fetch(`/api/admin/levels?schoolId=${schoolId}`, { cache: "no-store" }),
      ]);
      const fieldsJson = fieldsRes.ok ? await fieldsRes.json().catch(() => ({})) : {};
      const levelsJson = levelsRes.ok ? await levelsRes.json().catch(() => ({})) : {};
      setFields(fieldsJson.fields || []);
      setLevels(levelsJson.levels || []);
    } catch {
      toast({ title: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [schoolId]);

  const saveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !fieldForm.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/fields", {
        method: editingField ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...fieldForm, schoolId, id: editingField?.id }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: editingField ? "Field updated" : "Field created" });
      setFieldDialog(false);
      setEditingField(null);
      setFieldForm({ name: "", description: "" });
      loadData();
    } catch {
      toast({ title: "Failed to save field", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !levelForm.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/levels", {
        method: editingLevel ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...levelForm, order: parseInt(levelForm.order) || 0, schoolId, id: editingLevel?.id }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: editingLevel ? "Level updated" : "Level created" });
      setLevelDialog(false);
      setEditingLevel(null);
      setLevelForm({ name: "", description: "", order: "0" });
      loadData();
    } catch {
      toast({ title: "Failed to save level", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteField = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/fields?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Field deleted" });
      loadData();
    } catch {
      toast({ title: "Failed to delete field", variant: "destructive" });
    }
  };

  const deleteLevel = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/levels?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Level deleted" });
      loadData();
    } catch {
      toast({ title: "Failed to delete level", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 pb-16 page-enter">
      <div>
        <h1 className="text-2xl font-headline font-bold">Fields & Levels Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage academic fields of study and levels for your institution.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="fields">
          <TabsList className="bg-transparent h-auto p-0 gap-5 border-b w-full justify-start rounded-none">
            <TabsTrigger value="fields" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground">
              <BookOpen className="w-4 h-4 mr-2" /> Fields of Study ({fields.length})
            </TabsTrigger>
            <TabsTrigger value="levels" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-2.5 text-sm font-medium text-muted-foreground">
              <Layers className="w-4 h-4 mr-2" /> Levels ({levels.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" className="dash-button-primary gap-2" onClick={() => { setEditingField(null); setFieldForm({ name: "", description: "" }); setFieldDialog(true); }}>
                  <Plus className="w-4 h-4" /> Add Field of Study
                </Button>
              </div>
              {fields.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No fields of study created yet.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {fields.map((field: any) => (
                    <Card key={field.id} className="dash-card-hover">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{field.name}</h3>
                          {field.description && <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>}
                          <Badge className="mt-1 text-[9px] bg-muted text-muted-foreground border-border">
                            {field._count?.students || 0} students
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingField(field); setFieldForm({ name: field.name, description: field.description || "" }); setFieldDialog(true); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteField(field.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="levels" className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" className="dash-button-primary gap-2" onClick={() => { setEditingLevel(null); setLevelForm({ name: "", description: "", order: "0" }); setLevelDialog(true); }}>
                  <Plus className="w-4 h-4" /> Add Level
                </Button>
              </div>
              {levels.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No levels created yet.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {levels.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((level: any) => (
                    <Card key={level.id} className="dash-card-hover">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {level.order || level.name.match(/\d+/)?.[0] || "?"}
                          </div>
                          <div>
                            <h3 className="font-semibold">{level.name}</h3>
                            {level.description && <p className="text-xs text-muted-foreground mt-0.5">{level.description}</p>}
                            <Badge className="mt-1 text-[9px] bg-muted text-muted-foreground border-border">
                              {level._count?.students || 0} students
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingLevel(level); setLevelForm({ name: level.name, description: level.description || "", order: String(level.order || 0) }); setLevelDialog(true); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteLevel(level.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Field Dialog */}
      <Dialog open={fieldDialog} onOpenChange={setFieldDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Field of Study" : "Add Field of Study"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveField} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Field Name</Label>
              <Input value={fieldForm.name} onChange={e => setFieldForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Banking and Finance" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Description (Optional)</Label>
              <Input value={fieldForm.description} onChange={e => setFieldForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
            </div>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setFieldDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {editingField ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Level Dialog */}
      <Dialog open={levelDialog} onOpenChange={setLevelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLevel ? "Edit Level" : "Add Level"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveLevel} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Level Name</Label>
              <Input value={levelForm.name} onChange={e => setLevelForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. HND 2" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Order (for sorting)</Label>
              <Input type="number" value={levelForm.order} onChange={e => setLevelForm(f => ({ ...f, order: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Description (Optional)</Label>
              <Input value={levelForm.description} onChange={e => setLevelForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
            </div>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setLevelDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {editingLevel ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}