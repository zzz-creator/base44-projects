import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PortalSchedule() {
  const [classes, setClasses] = useState([]);
  const [bookings, setBookings] = useState([]); // all bookings for capacity calc
  const [myBookings, setMyBookings] = useState([]); // current student's bookings
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    try {
      const me = await base44.auth.me();
      const [allClasses, allBookings, students] = await Promise.all([
        base44.entities.Class.filter({ is_active: true }),
        base44.entities.ClassBooking.filter({ status: "booked" }),
        base44.entities.Student.filter({ email: me.email }),
      ]);
      setClasses(allClasses);
      setBookings(allBookings);
      const s = students[0];
      setStudent(s);
      if (s) setMyBookings(allBookings.filter(b => b.student_id === s.id));
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getClassBookings = (classId) => bookings.filter(b => b.class_id === classId);
  const isBooked = (classId) => student && myBookings.some(b => b.class_id === classId);

  const handleBook = async (cls) => {
    if (!student) return toast.error("No student record linked to your account.");
    const existing = bookings.filter(b => b.class_id === cls.id);
    if (cls.capacity && existing.length >= cls.capacity) return toast.error("Class is full.");
    setActionLoading(cls.id);
    await base44.entities.ClassBooking.create({
      class_id: cls.id,
      class_name: cls.name,
      student_id: student.id,
      student_name: student.full_name,
      status: "booked",
    });
    toast.success(`Booked ${cls.name}!`);
    await load();
    setActionLoading(null);
  };

  const handleCancel = async (cls) => {
    const booking = myBookings.find(b => b.class_id === cls.id);
    if (!booking) return;
    setActionLoading(cls.id);
    await base44.entities.ClassBooking.update(booking.id, { status: "cancelled" });
    toast.success("Booking cancelled.");
    await load();
    setActionLoading(null);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Class Schedule</h1>
        <p className="text-muted-foreground mt-1">Reserve your spot in upcoming classes.</p>
      </div>

      {DAYS.map(day => {
        const dayclasses = classes.filter(c => c.day_of_week === day);
        if (dayclasses.length === 0) return null;
        return (
          <div key={day}>
            <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider mb-2">{day}</h2>
            <div className="space-y-3">
              {dayclasses.map(cls => {
                const classBookings = getClassBookings(cls.id);
                const spotsLeft = cls.capacity ? cls.capacity - classBookings.length : null;
                const isFull = cls.capacity && classBookings.length >= cls.capacity;
                const booked = isBooked(cls.id);
                return (
                  <div key={cls.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">{cls.start_time} – {cls.end_time} · {cls.level}</p>
                      {cls.instructor_name && <p className="text-xs text-muted-foreground mt-0.5">Instructor: {cls.instructor_name}</p>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {cls.capacity && (
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${isFull ? "text-red-500" : spotsLeft <= 3 ? "text-amber-600" : "text-green-600"}`}>
                            {isFull ? "Full" : `${spotsLeft} spots left`}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" /> {classBookings.length}/{cls.capacity}
                          </p>
                        </div>
                      )}
                      {student && (
                        booked ? (
                          <Button size="sm" variant="outline" className="gap-1.5 text-green-600 border-green-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                            disabled={actionLoading === cls.id}
                            onClick={() => handleCancel(cls)}>
                            <CheckCircle className="w-3.5 h-3.5" /> Booked · Cancel
                          </Button>
                        ) : (
                          <Button size="sm" disabled={isFull || actionLoading === cls.id} onClick={() => handleBook(cls)}>
                            {isFull ? "Full" : actionLoading === cls.id ? "..." : "Book"}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {classes.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">No classes scheduled.</div>
      )}
    </div>
  );
}