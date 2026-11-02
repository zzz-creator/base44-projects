import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Award, CheckCircle, Clock, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import BeltBadge from "../components/BeltBadge";
import BeltProgressBar from "../components/BeltProgressBar";
import { DEFAULT_BELT_REQUIREMENTS, checkEligibility, getNextBelt } from "../utils/beltUtils";
import { toast } from "sonner";

export default function Promotions() {
  const [students, setStudents] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [requirements, setRequirements] = useState(DEFAULT_BELT_REQUIREMENTS);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("eligible");
  const [promoting, setPromoting] = useState(null);
  const [promoNote, setPromoNote] = useState("");
  // Pipeline state: { studentId -> "eligible" | "scheduled" | "promoted" }
  const [pipeline, setPipeline] = useState({});
  const [pipelineNotes, setPipelineNotes] = useState({});

  const load = async () => {
    const [s, p, br] = await Promise.all([
      base44.entities.Student.list(),
      base44.entities.Promotion.list("-promotion_date", 50),
      base44.entities.BeltRequirement.list(),
    ]);
    setStudents(s);
    setPromotions(p);
    if (br.length > 0) {
      const reqMap = {};
      br.forEach(r => { reqMap[r.belt] = r; });
      setRequirements(reqMap);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const eligible = students.filter(s => {
    const { eligible } = checkEligibility(s, requirements);
    return eligible && s.current_belt !== "Black";
  });

  const pipelineStudents = eligible; // all eligible students go into pipeline

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const studentId = result.draggableId;
    const dest = result.destination.droppableId;
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    if (dest === "promoted") {
      setPromoting(student);
    } else {
      setPipeline(p => ({ ...p, [studentId]: dest }));
    }
  };

  const getPipelineCol = (studentId) => pipeline[studentId] || "eligible";

  const inProgress = students.filter(s => {
    const { eligible } = checkEligibility(s, requirements);
    return !eligible && s.current_belt !== "Black";
  });

  const handlePromote = async (student) => {
    const nextBelt = getNextBelt(student.current_belt);
    if (!nextBelt) return;

    await base44.entities.Promotion.create({
      student_id: student.id,
      student_name: student.full_name,
      from_belt: student.current_belt,
      to_belt: nextBelt,
      promotion_date: new Date().toISOString().split("T")[0],
      test_result: "pass",
      instructor_notes: promoNote,
      classes_completed: student.classes_in_current_belt || 0,
    });

    await base44.entities.Student.update(student.id, {
      current_belt: nextBelt,
      classes_in_current_belt: 0,
      stripes: 0,
      belt_start_date: new Date().toISOString().split("T")[0],
      eligible_for_testing: false,
      instructor_approved: false,
    });

    toast.success(`${student.full_name} promoted to ${nextBelt} Belt!`);
    setPromoting(null);
    setPromoNote("");
    load();
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
        <p className="text-muted-foreground mt-1">Track belt testing eligibility and record promotions.</p>
      </div>

      <div className="flex gap-2">
        {["eligible", "pipeline", "in_progress", "history"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {t === "eligible" ? `Eligible (${eligible.length})` : t === "pipeline" ? `Pipeline` : t === "in_progress" ? `In Progress (${inProgress.length})` : "History"}
          </button>
        ))}
      </div>

      {tab === "eligible" && (
        <div className="space-y-4">
          {eligible.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">No students are currently eligible for promotion.</div>
          ) : eligible.map(student => {
            const nextBelt = getNextBelt(student.current_belt);
            const req = requirements[student.current_belt] || DEFAULT_BELT_REQUIREMENTS[student.current_belt];
            return (
              <div key={student.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-lg">
                      {student.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{student.full_name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <BeltBadge belt={student.current_belt} size="sm" />
                        <span className="text-muted-foreground text-xs">→</span>
                        {nextBelt && <BeltBadge belt={nextBelt} size="sm" />}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-100 px-3 py-1.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Eligible
                    </span>
                    <Button size="sm" onClick={() => setPromoting(student)}>
                      <Award className="w-3.5 h-3.5 mr-1" /> Promote
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <BeltProgressBar student={student} requirement={req} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "in_progress" && (
        <div className="space-y-4">
          {inProgress.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">All students are eligible or at black belt.</div>
          ) : inProgress.map(student => {
            const { reasons } = checkEligibility(student, requirements);
            const req = requirements[student.current_belt] || DEFAULT_BELT_REQUIREMENTS[student.current_belt];
            return (
              <div key={student.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                      {student.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{student.full_name}</p>
                      <BeltBadge belt={student.current_belt} size="sm" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {reasons.map((r, i) => (
                      <span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {r}
                      </span>
                    ))}
                  </div>
                </div>
                {req && <BeltProgressBar student={student} requirement={req} />}
              </div>
            );
          })}
        </div>
      )}

      {tab === "pipeline" && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "eligible", label: "Eligible — Not Yet Scheduled", color: "border-blue-300 bg-blue-50" },
              { id: "scheduled", label: "Scheduled for Test", color: "border-yellow-300 bg-yellow-50" },
              { id: "promoted", label: "Drag here to Promote ✓", color: "border-green-300 bg-green-50" },
            ].map(col => (
              <div key={col.id} className={`rounded-2xl border-2 ${col.color} p-3 min-h-48`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">{col.label}</p>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`space-y-2 min-h-16 rounded-xl transition-colors ${snapshot.isDraggingOver ? "bg-white/60" : ""}`}>
                      {pipelineStudents.filter(s => getPipelineCol(s.id) === col.id).map((student, idx) => {
                        const nextBelt = getNextBelt(student.current_belt);
                        return (
                          <Draggable key={student.id} draggableId={student.id} index={idx}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps}
                                className={`bg-card border border-border rounded-xl p-3 flex items-center gap-2 shadow-sm ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}`}>
                                <span {...provided.dragHandleProps}>
                                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{student.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{student.current_belt} → {nextBelt}</p>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Drag students between columns. Drop onto "Promote" to record a promotion.</p>
        </DragDropContext>
      )}

      {tab === "history" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {promotions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No promotions recorded yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {promotions.map(p => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{p.student_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.promotion_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BeltBadge belt={p.from_belt} size="sm" />
                    <span className="text-muted-foreground">→</span>
                    <BeltBadge belt={p.to_belt} size="sm" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.test_result === "pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {p.test_result}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Promotion Modal */}
      {promoting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <h3 className="font-semibold text-lg mb-1">Confirm Promotion</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Promote <strong>{promoting.full_name}</strong> from <strong>{promoting.current_belt}</strong> to <strong>{getNextBelt(promoting.current_belt)}</strong> Belt?
            </p>
            <textarea
              placeholder="Add notes (optional)..."
              value={promoNote}
              onChange={e => setPromoNote(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-3 text-sm h-24 resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setPromoting(null); setPromoNote(""); }}>Cancel</Button>
              <Button onClick={() => handlePromote(promoting)}>
                <Award className="w-4 h-4 mr-1.5" /> Confirm Promotion
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}