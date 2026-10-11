import { useState } from "react";
import { X, Camera, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BELT_ORDER } from "../utils/beltUtils";

export default function StudentFormModal({ student, onSave, onClose }) {
  const [form, setForm] = useState({
    full_name: student?.full_name || "",
    email: student?.email || "",
    phone: student?.phone || "",
    date_of_birth: student?.date_of_birth || "",
    emergency_contact_name: student?.emergency_contact_name || "",
    emergency_contact_phone: student?.emergency_contact_phone || "",
    current_belt: student?.current_belt || "White",
    belt_start_date: student?.belt_start_date || "",
    classes_in_current_belt: student?.classes_in_current_belt ?? 0,
    total_classes_attended: student?.total_classes_attended ?? 0,
    membership_status: student?.membership_status || "active",
    membership_plan: student?.membership_plan || "monthly",
    join_date: student?.join_date || new Date().toISOString().split("T")[0],
    instructor_notes: student?.instructor_notes || "",
    photo_url: student?.photo_url || "",
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("photo_url", file_url);
    setUploadingPhoto(false);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="font-semibold text-lg">{student ? "Edit Student" : "Add Student"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Profile Photo */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border flex-shrink-0">
              {form.photo_url ? (
                <img src={form.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-muted-foreground">{form.full_name?.charAt(0) || "?"}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Profile Photo</p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted hover:bg-accent text-sm transition-colors">
                {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
              </label>
              {form.photo_url && (
                <button onClick={() => set("photo_url", "")} className="ml-2 text-xs text-destructive hover:underline">Remove</button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={e => set("full_name", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Join Date</Label>
              <Input type="date" value={form.join_date} onChange={e => set("join_date", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Emergency Contact</Label>
              <Input value={form.emergency_contact_name} onChange={e => set("emergency_contact_name", e.target.value)} placeholder="Name" className="mt-1" />
            </div>
            <div>
              <Label>Emergency Phone</Label>
              <Input value={form.emergency_contact_phone} onChange={e => set("emergency_contact_phone", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Belt Start Date (override)</Label>
              <Input type="date" value={form.belt_start_date} onChange={e => set("belt_start_date", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Classes in Current Belt (override)</Label>
              <Input type="number" value={form.classes_in_current_belt} onChange={e => set("classes_in_current_belt", parseInt(e.target.value) || 0)} className="mt-1" />
            </div>
            <div>
              <Label>Total Classes Attended (override)</Label>
              <Input type="number" value={form.total_classes_attended} onChange={e => set("total_classes_attended", parseInt(e.target.value) || 0)} className="mt-1" />
            </div>
            <div>
              <Label>Current Belt</Label>
              <Select value={form.current_belt} onValueChange={v => set("current_belt", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{BELT_ORDER.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Membership Status</Label>
              <Select value={form.membership_status} onValueChange={v => set("membership_status", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Membership Plan</Label>
              <Select value={form.membership_plan} onValueChange={v => set("membership_plan", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Instructor Notes</Label>
              <textarea
                value={form.instructor_notes}
                onChange={e => set("instructor_notes", e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background p-2 text-sm resize-none h-20"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.full_name}>Save Student</Button>
        </div>
      </div>
    </div>
  );
}