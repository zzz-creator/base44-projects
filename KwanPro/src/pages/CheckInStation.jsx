import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { QrCode, RefreshCw, Monitor } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CheckInStation() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Class.filter({ is_active: true })
      .then(c => { setClasses(c); if (c.length > 0) setSelectedClass(c[0].id); setLoading(false); });
  }, []);

  const checkinUrl = selectedClass
    ? `${window.location.origin}/checkin?class_id=${selectedClass}&date=${date}`
    : "";

  const qrImageUrl = checkinUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(checkinUrl)}`
    : "";

  const selectedClassObj = classes.find(c => c.id === selectedClass);

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Check-In Station</h1>
        <p className="text-muted-foreground mt-1">Display this QR code at the front desk so students can scan to check in.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Class *</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select a class" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} — {c.day_of_week} {c.start_time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
          </div>
        </div>
      </div>

      {selectedClass && (
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <QrCode className="w-5 h-5 text-primary" />
              <p className="font-bold text-lg">{selectedClassObj?.name}</p>
            </div>
            <p className="text-muted-foreground text-sm">{new Date(date).toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border-4 border-primary/20 shadow-lg">
            <img src={qrImageUrl} alt="Check-in QR Code" className="w-64 h-64" />
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Students: scan with your phone camera to check in</p>
            <p className="text-xs text-muted-foreground break-all max-w-xs">{checkinUrl}</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.open(checkinUrl, "_blank")} className="gap-2">
              <Monitor className="w-4 h-4" /> Preview Check-In Page
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Print / Full Screen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}