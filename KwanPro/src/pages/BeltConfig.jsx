import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Save, Plus, X, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const DEFAULT_BELTS = [
  { name: "White",  color_hex: "#f3f4f6", text_color_hex: "#1f2937", order: 1 },
  { name: "Yellow", color_hex: "#fef08a", text_color_hex: "#78350f", order: 2 },
  { name: "Orange", color_hex: "#fed7aa", text_color_hex: "#7c2d12", order: 3 },
  { name: "Green",  color_hex: "#bbf7d0", text_color_hex: "#14532d", order: 4 },
  { name: "Blue",   color_hex: "#bfdbfe", text_color_hex: "#1e3a8a", order: 5 },
  { name: "Red",    color_hex: "#fecaca", text_color_hex: "#7f1d1d", order: 6 },
  { name: "Black",  color_hex: "#111827", text_color_hex: "#ffffff", order: 7 },
];

const DEFAULT_REQS = {
  White:  { required_classes: 20, minimum_months: 2, required_skills: ["Basic Stances", "Front Kick", "Bow & Etiquette"], description: "" },
  Yellow: { required_classes: 25, minimum_months: 2, required_skills: ["Walking Stance", "Round Kick", "Taegeuk 1 Jang"], description: "" },
  Orange: { required_classes: 30, minimum_months: 3, required_skills: ["Back Stance", "Side Kick", "Taegeuk 2 Jang"], description: "" },
  Green:  { required_classes: 30, minimum_months: 3, required_skills: ["Tiger Stance", "Turning Kick", "Taegeuk 3 Jang"], description: "" },
  Blue:   { required_classes: 35, minimum_months: 4, required_skills: ["Taegeuk 4 Jang", "Free Sparring", "Board Breaking"], description: "" },
  Red:    { required_classes: 40, minimum_months: 4, required_skills: ["Taegeuk 5 Jang", "Advanced Sparring", "Self Defense"], description: "" },
  Black:  { required_classes: 0, minimum_months: 0, required_skills: [], description: "Final rank." },
};

export default function BeltConfig() {
  const [belts, setBelts] = useState([]);
  const [requirements, setRequirements] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBelt, setSelectedBelt] = useState(null);
  const [showAddBelt, setShowAddBelt] = useState(false);
  const [newBelt, setNewBelt] = useState({ name: "", color_hex: "#ffffff", text_color_hex: "#000000" });
  const [editingBelt, setEditingBelt] = useState(null); // belt id being edited inline

  useEffect(() => { load(); }, []);

  async function load() {
    const [bls, brs] = await Promise.all([
      base44.entities.BeltLevel.list("order"),
      base44.entities.BeltRequirement.list(),
    ]);

    const activeBelts = bls.filter(b => b.is_active !== false);
    const displayBelts = activeBelts.length > 0 ? activeBelts : DEFAULT_BELTS;
    setBelts(displayBelts);

    const reqMap = { ...DEFAULT_REQS };
    brs.forEach(r => { reqMap[r.belt] = { ...reqMap[r.belt], ...r }; });
    setRequirements(reqMap);
    setSelectedBelt(displayBelts[0]?.name || null);
    setLoading(false);
  }

  const updateReqField = (belt, field, value) => {
    setRequirements(r => ({ ...r, [belt]: { ...r[belt], [field]: value } }));
  };

  const addSkill = (belt) => {
    const current = requirements[belt]?.required_skills || [];
    updateReqField(belt, "required_skills", [...current, ""]);
  };

  const updateSkill = (belt, idx, val) => {
    const skills = [...(requirements[belt]?.required_skills || [])];
    skills[idx] = val;
    updateReqField(belt, "required_skills", skills);
  };

  const removeSkill = (belt, idx) => {
    const skills = (requirements[belt]?.required_skills || []).filter((_, i) => i !== idx);
    updateReqField(belt, "required_skills", skills);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    // Save belt levels
    const existing = await base44.entities.BeltLevel.list();
    const existingMap = {};
    existing.forEach(b => { existingMap[b.name] = b.id; });

    for (let i = 0; i < belts.length; i++) {
      const b = belts[i];
      const data = { name: b.name, color_hex: b.color_hex, text_color_hex: b.text_color_hex || "#000000", order: i + 1, is_active: true };
      if (existingMap[b.name]) {
        await base44.entities.BeltLevel.update(existingMap[b.name], data);
      } else {
        await base44.entities.BeltLevel.create(data);
      }
    }

    // Save requirements
    const existingReqs = await base44.entities.BeltRequirement.list();
    const existingReqMap = {};
    existingReqs.forEach(r => { existingReqMap[r.belt] = r.id; });

    for (const belt of belts.map(b => b.name)) {
      const req = requirements[belt];
      if (!req) continue;
      const data = {
        belt,
        required_classes: req.required_classes || 0,
        minimum_months: req.minimum_months || 0,
        required_skills: (req.required_skills || []).filter(s => s.trim()),
        description: req.description || "",
      };
      if (existingReqMap[belt]) {
        await base44.entities.BeltRequirement.update(existingReqMap[belt], data);
      } else {
        await base44.entities.BeltRequirement.create(data);
      }
    }

    toast.success("Belt configuration saved!");
    setSaving(false);
  };

  const addBelt = async () => {
    if (!newBelt.name.trim()) return;
    const existing = await base44.entities.BeltLevel.list();
    const existingMap = {};
    existing.forEach(b => { existingMap[b.name] = b.id; });
    const data = { name: newBelt.name.trim(), color_hex: newBelt.color_hex, text_color_hex: newBelt.text_color_hex, order: belts.length + 1, is_active: true };
    if (existingMap[newBelt.name.trim()]) {
      await base44.entities.BeltLevel.update(existingMap[newBelt.name.trim()], data);
    } else {
      await base44.entities.BeltLevel.create(data);
    }
    setRequirements(r => ({ ...r, [newBelt.name.trim()]: { required_classes: 0, minimum_months: 0, required_skills: [], description: "" } }));
    setShowAddBelt(false);
    setNewBelt({ name: "", color_hex: "#ffffff", text_color_hex: "#000000" });
    toast.success(`Belt "${newBelt.name.trim()}" added`);
    load();
  };

  const deleteBelt = async (beltName) => {
    if (!confirm(`Delete the "${beltName}" belt? This removes the belt configuration only, not students.`)) return;
    const existing = await base44.entities.BeltLevel.list();
    const found = existing.find(b => b.name === beltName);
    if (found) await base44.entities.BeltLevel.update(found.id, { is_active: false });
    if (selectedBelt === beltName) setSelectedBelt(belts.find(b => b.name !== beltName)?.name || null);
    toast.success(`Belt "${beltName}" removed`);
    load();
  };

  const updateBeltColor = (beltName, field, value) => {
    setBelts(prev => prev.map(b => b.name === beltName ? { ...b, [field]: value } : b));
  };

  const updateBeltName = (oldName, newName) => {
    setBelts(prev => prev.map(b => b.name === oldName ? { ...b, name: newName } : b));
    setRequirements(prev => {
      const newReqs = { ...prev };
      if (newReqs[oldName]) { newReqs[newName] = newReqs[oldName]; delete newReqs[oldName]; }
      return newReqs;
    });
    if (selectedBelt === oldName) setSelectedBelt(newName);
    setEditingBelt(null);
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const req = requirements[selectedBelt] || {};
  const selectedBeltObj = belts.find(b => b.name === selectedBelt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Belt Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage belt ranks, colors, and promotion requirements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddBelt(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Belt
          </Button>
          <Button onClick={handleSaveAll} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      {/* Add Belt Modal */}
      {showAddBelt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Add New Belt</h2>
              <button onClick={() => setShowAddBelt(false)} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <Label>Belt Name *</Label>
              <Input value={newBelt.name} onChange={e => setNewBelt(v => ({ ...v, name: e.target.value }))} placeholder="e.g. Purple" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Background Color</Label>
                <div className="flex gap-2 mt-1">
                  <input type="color" value={newBelt.color_hex} onChange={e => setNewBelt(v => ({ ...v, color_hex: e.target.value }))} className="h-9 w-12 rounded border border-input cursor-pointer" />
                  <Input value={newBelt.color_hex} onChange={e => setNewBelt(v => ({ ...v, color_hex: e.target.value }))} className="flex-1 font-mono text-sm" />
                </div>
              </div>
              <div>
                <Label>Text Color</Label>
                <div className="flex gap-2 mt-1">
                  <input type="color" value={newBelt.text_color_hex} onChange={e => setNewBelt(v => ({ ...v, text_color_hex: e.target.value }))} className="h-9 w-12 rounded border border-input cursor-pointer" />
                  <Input value={newBelt.text_color_hex} onChange={e => setNewBelt(v => ({ ...v, text_color_hex: e.target.value }))} className="flex-1 font-mono text-sm" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
              <span className="text-sm font-medium">Preview:</span>
              <span className="px-3 py-1 rounded-full text-sm font-medium border" style={{ background: newBelt.color_hex, color: newBelt.text_color_hex, borderColor: newBelt.color_hex }}>
                {newBelt.name || "Belt Name"} Belt
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddBelt(false)} className="flex-1">Cancel</Button>
              <Button onClick={addBelt} disabled={!newBelt.name.trim()} className="flex-1">Add Belt</Button>
            </div>
          </div>
        </div>
      )}

      {/* Belt list with inline editing */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <p className="text-sm font-medium text-muted-foreground">Belt Ranks (in order)</p>
        </div>
        <div className="divide-y divide-border">
          {belts.map((belt, idx) => (
            <div
              key={belt.name}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors ${selectedBelt === belt.name ? "bg-primary/5 border-l-2 border-primary" : ""}`}
              onClick={() => setSelectedBelt(belt.name)}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground w-5 flex-shrink-0">#{idx + 1}</span>
              
              {editingBelt === belt.name ? (
                <form onSubmit={e => { e.preventDefault(); updateBeltName(belt.name, e.target.elements.newname.value); }} className="flex-1 flex gap-2" onClick={e => e.stopPropagation()}>
                  <Input name="newname" defaultValue={belt.name} className="h-7 text-sm" autoFocus />
                  <Button type="submit" size="sm" variant="outline" className="h-7 px-2 text-xs">Save</Button>
                  <button type="button" onClick={() => setEditingBelt(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                </form>
              ) : (
                <div className="flex-1 flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-sm font-medium border" style={{ background: belt.color_hex, color: belt.text_color_hex || "#000", borderColor: belt.color_hex }}>
                    {belt.name} Belt
                  </span>
                  {/* Color pickers inline */}
                  <div className="flex gap-1.5 items-center" onClick={e => e.stopPropagation()}>
                    <input type="color" value={belt.color_hex} title="Background color"
                      onChange={e => updateBeltColor(belt.name, "color_hex", e.target.value)}
                      className="h-6 w-6 rounded border border-input cursor-pointer p-0" />
                    <input type="color" value={belt.text_color_hex || "#000000"} title="Text color"
                      onChange={e => updateBeltColor(belt.name, "text_color_hex", e.target.value)}
                      className="h-6 w-6 rounded border border-input cursor-pointer p-0" />
                  </div>
                </div>
              )}

              <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => setEditingBelt(belt.name)} title="Rename" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteBelt(belt.name)} title="Delete" className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements for selected belt */}
      {selectedBelt && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            {selectedBeltObj && (
              <span className="px-4 py-1.5 rounded-full text-base font-semibold border" style={{ background: selectedBeltObj.color_hex, color: selectedBeltObj.text_color_hex || "#000", borderColor: selectedBeltObj.color_hex }}>
                {selectedBelt} Belt — Requirements
              </span>
            )}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label className="text-base font-semibold">Required Classes</Label>
                <p className="text-xs text-muted-foreground mb-2">Minimum classes before testing</p>
                <Input type="number" value={req.required_classes || 0} onChange={e => updateReqField(selectedBelt, "required_classes", +e.target.value)} className="text-lg font-bold h-12" />
              </div>
              <div>
                <Label className="text-base font-semibold">Minimum Months</Label>
                <p className="text-xs text-muted-foreground mb-2">Minimum time-in-rank before testing</p>
                <Input type="number" value={req.minimum_months || 0} onChange={e => updateReqField(selectedBelt, "minimum_months", +e.target.value)} className="text-lg font-bold h-12" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="text-base font-semibold">Required Skills</Label>
                  <p className="text-xs text-muted-foreground">Skills that must be demonstrated at testing</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => addSkill(selectedBelt)} className="gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Skill
                </Button>
              </div>
              <div className="space-y-2">
                {(req.required_skills || []).map((skill, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selectedBeltObj?.color_hex || "#ccc" }} />
                    <Input value={skill} onChange={e => updateSkill(selectedBelt, idx, e.target.value)} placeholder="e.g. Front Kick" className="flex-1" />
                    <button onClick={() => removeSkill(selectedBelt, idx)} className="p-1.5 rounded hover:bg-red-50 hover:text-red-500 text-muted-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(req.required_skills || []).length === 0 && (
                  <p className="text-muted-foreground text-sm py-2">No skills added yet.</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold">Description</Label>
              <p className="text-xs text-muted-foreground mb-2">Notes about this belt level</p>
              <textarea
                value={req.description || ""}
                onChange={e => updateReqField(selectedBelt, "description", e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-3 text-sm h-24 resize-none"
                placeholder="Optional description..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}