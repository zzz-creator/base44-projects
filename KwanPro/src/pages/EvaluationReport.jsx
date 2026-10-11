import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Download, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";



export default function EvaluationReport() {
  const [students, setStudents] = useState([]);
  const [beltReqs, setBeltReqs] = useState([]);
  const [beltLevels, setBeltLevels] = useState([]);
  const [selectedBelt, setSelectedBelt] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [s, r, bl] = await Promise.all([
      base44.entities.Student.list("-created_date"),
      base44.entities.BeltRequirement.list(),
      base44.entities.BeltLevel.list("order"),
    ]);
    setStudents(s);
    setBeltReqs(r);
    setBeltLevels(bl.filter(b => b.is_active !== false).length > 0 ? bl.filter(b => b.is_active !== false) : [
      { name: "White", order: 1 }, { name: "Yellow", order: 2 }, { name: "Orange", order: 3 },
      { name: "Green", order: 4 }, { name: "Blue", order: 5 }, { name: "Red", order: 6 }, { name: "Black", order: 7 }
    ]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = students.filter(s => {
    const matchBelt = selectedBelt === "all" || s.current_belt === selectedBelt;
    const matchSearch = !search || s.full_name?.toLowerCase().includes(search.toLowerCase());
    return matchBelt && matchSearch;
  });

  const beltOrder = beltLevels.map(b => b.name);
  const getReq = (belt) => beltReqs.find(r => r.belt === belt);

  const isEligible = (student) => {
    const req = getReq(student.current_belt);
    if (!req) return false;
    const classes = student.classes_in_current_belt || 0;
    const months = student.belt_start_date
      ? Math.floor((new Date() - new Date(student.belt_start_date)) / (1000 * 60 * 60 * 24 * 30))
      : 0;
    return classes >= req.required_classes && months >= req.minimum_months;
  };

  const getNextBelt = (belt) => beltOrder[beltOrder.indexOf(belt) + 1];

  const generatePDF = (student) => {
    const req = getReq(student.current_belt);
    const nextBelt = getNextBelt(student.current_belt);
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    // Header
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("TKD Pro — Belt Evaluation Form", margin, 18);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString("en-AU")}`, margin, 30);
    y = 55;

    // Student info box
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(margin, y, 170, 38, 3, 3, "F");
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(student.full_name, margin + 6, y + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Current Belt: ${student.current_belt} Belt`, margin + 6, y + 22);
    doc.text(`Testing For: ${nextBelt || "N/A"} Belt`, margin + 6, y + 30);
    if (student.join_date) doc.text(`Student Since: ${new Date(student.join_date).toLocaleDateString("en-AU")}`, margin + 90, y + 22);
    if (student.belt_start_date) doc.text(`Belt Start: ${new Date(student.belt_start_date).toLocaleDateString("en-AU")}`, margin + 90, y + 30);
    y += 48;

    // Requirements section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Minimum Requirements", margin, y);
    y += 6;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 190, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (req) {
      const classes = student.classes_in_current_belt || 0;
      const months = student.belt_start_date
        ? Math.floor((new Date() - new Date(student.belt_start_date)) / (1000 * 60 * 60 * 24 * 30))
        : 0;
      const classOk = classes >= req.required_classes;
      const monthOk = months >= req.minimum_months;

      doc.setTextColor(classOk ? 22 : 185, classOk ? 163 : 28, classOk ? 74 : 28);
      doc.text(`✓ Classes Attended: ${classes} / ${req.required_classes} required  ${classOk ? "(MET)" : "(NOT MET)"}`, margin, y);
      y += 7;
      doc.setTextColor(monthOk ? 22 : 185, monthOk ? 163 : 28, monthOk ? 74 : 28);
      doc.text(`✓ Time in Rank: ${months} / ${req.minimum_months} months required  ${monthOk ? "(MET)" : "(NOT MET)"}`, margin, y);
      y += 10;
    } else {
      doc.setTextColor(150, 150, 150);
      doc.text("No requirements configured for this belt.", margin, y);
      y += 10;
    }

    doc.setTextColor(0, 0, 0);

    // Skills checklist
    if (req?.required_skills?.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Required Skills — Instructor Evaluation", margin, y);
      y += 6;
      doc.line(margin, y, 190, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Skill", margin + 8, y);
      doc.text("Pass", 140, y);
      doc.text("Fail", 155, y);
      doc.text("Score (1–10)", 165, y);
      y += 4;
      doc.line(margin, y, 190, y);
      y += 6;

      req.required_skills.forEach((skill, i) => {
        if (y > 265) {
          doc.addPage();
          y = margin;
        }
        // alternating row bg
        if (i % 2 === 0) {
          doc.setFillColor(248, 249, 251);
          doc.rect(margin, y - 4, 170, 9, "F");
        }
        doc.setDrawColor(180, 180, 180);
        // checkbox
        doc.rect(margin + 1, y - 3, 5, 5);
        doc.text(skill, margin + 9, y + 1);
        // Pass box
        doc.rect(140, y - 3, 5, 5);
        // Fail box
        doc.rect(155, y - 3, 5, 5);
        // Score line
        doc.line(166, y + 2, 188, y + 2);
        y += 10;
      });
      y += 4;
    }

    // Overall score section
    if (y > 240) { doc.addPage(); y = margin; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Overall Evaluation", margin, y);
    y += 6;
    doc.line(margin, y, 190, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Overall Result:", margin, y);
    doc.rect(50, y - 4, 20, 7); doc.text("Pass", 52, y);
    doc.rect(80, y - 4, 20, 7); doc.text("Fail", 82, y);
    doc.rect(110, y - 4, 30, 7); doc.text("Retry Date:", 112, y);
    y += 14;
    doc.text("Instructor Notes:", margin, y);
    y += 5;
    doc.setDrawColor(180, 180, 180);
    for (let i = 0; i < 4; i++) {
      doc.line(margin, y, 190, y);
      y += 7;
    }
    y += 6;

    // Signatures
    doc.text("Instructor Signature: ____________________________", margin, y);
    doc.text("Date: ______________", 140, y);
    y += 12;
    doc.text("Student Signature: ______________________________", margin, y);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("TKD Pro — Confidential Evaluation Document", 105, 290, { align: "center" });

    doc.save(`Evaluation_${student.full_name.replace(/\s+/g, "_")}_${student.current_belt}.pdf`);
    toast.success(`PDF generated for ${student.full_name}`);
  };

  const generateBulkPDF = () => {
    filtered.forEach(s => generatePDF(s));
    toast.success(`Generated ${filtered.length} evaluation forms`);
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evaluation Reports</h1>
          <p className="text-muted-foreground mt-1">Generate PDF evaluation forms for student belt testing.</p>
        </div>
        <Link to="/belt-config">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Settings className="w-4 h-4" /> Manage Belt Requirements
          </button>
        </Link>
      </div>

      {true && (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search students..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={selectedBelt} onValueChange={setSelectedBelt}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Belts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Belts</SelectItem>
                {beltOrder.map(b => <SelectItem key={b} value={b}>{b} Belt</SelectItem>)}
              </SelectContent>
            </Select>
            {filtered.length > 0 && (
              <Button variant="outline" onClick={generateBulkPDF} className="gap-2">
                <Download className="w-4 h-4" /> Download All ({filtered.length})
              </Button>
            )}
          </div>

          {/* Student list */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No students found.</div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(s => {
                  const req = getReq(s.current_belt);
                  const eligible = isEligible(s);
                  const nextBelt = getNextBelt(s.current_belt);
                  const classes = s.classes_in_current_belt || 0;
                  return (
                    <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors flex-wrap">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                        {s.full_name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{s.full_name}</span>
                          {eligible && nextBelt && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Eligible for {nextBelt}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {s.current_belt} Belt · {classes} classes{req ? ` / ${req.required_classes} req'd` : ""}
                          {req?.required_skills?.length ? ` · ${req.required_skills.length} skills to test` : ""}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => generatePDF(s)} className="gap-2 flex-shrink-0">
                        <FileText className="w-3.5 h-3.5" /> Generate PDF
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}