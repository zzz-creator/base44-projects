import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, AlertCircle, Shield } from "lucide-react";

export default function CheckInScan() {
  const [status, setStatus] = useState("loading"); // loading | success | already | error | no_student
  const [message, setMessage] = useState("");
  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("");

  useEffect(() => {
    async function processCheckIn() {
      const params = new URLSearchParams(window.location.search);
      const classId = params.get("class_id");
      const date = params.get("date");

      if (!classId || !date) {
        setStatus("error");
        setMessage("Invalid check-in link. Please scan the QR code again.");
        return;
      }

      try {
        const me = await base44.auth.me();
        const [students, classData, existingAttendance] = await Promise.all([
          base44.entities.Student.filter({ email: me.email }),
          base44.entities.Class.filter({ id: classId }),
          base44.entities.Attendance.filter({ class_id: classId, date }),
        ]);

        const cls = classData[0];
        if (!cls) {
          setStatus("error");
          setMessage("Class not found.");
          return;
        }
        setClassName(cls.name);

        const student = students[0];
        if (!student) {
          setStatus("no_student");
          setMessage("No student record linked to your account. Please speak to your instructor.");
          return;
        }
        setStudentName(student.full_name);

        // Check if already checked in
        const alreadyIn = existingAttendance.find(a => a.student_id === student.id);
        if (alreadyIn) {
          setStatus("already");
          setMessage("You're already checked in for this class.");
          return;
        }

        // Record attendance
        await base44.entities.Attendance.create({
          student_id: student.id,
          student_name: student.full_name,
          class_id: classId,
          class_name: cls.name,
          date,
          belt_at_time: student.current_belt,
        });

        // Update student class counts
        await base44.entities.Student.update(student.id, {
          total_classes_attended: (student.total_classes_attended || 0) + 1,
          classes_in_current_belt: (student.classes_in_current_belt || 0) + 1,
        });

        setStatus("success");
      } catch (err) {
        setStatus("error");
        setMessage("Something went wrong. Please try again or see your instructor.");
      }
    }

    processCheckIn();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">TKD Pro</span>
        </div>

        {status === "loading" && (
          <div className="space-y-4">
            <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Logging your attendance...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-700">Checked In!</h2>
              <p className="text-lg font-medium mt-1">{studentName}</p>
              <p className="text-muted-foreground">{className}</p>
            </div>
            <p className="text-sm text-muted-foreground bg-green-50 border border-green-200 rounded-xl p-3">
              Your attendance has been recorded. Have a great class! 🥋
            </p>
          </div>
        )}

        {status === "already" && (
          <div className="space-y-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-blue-700">Already Checked In</h2>
              <p className="text-lg font-medium mt-1">{studentName}</p>
              <p className="text-muted-foreground">{className}</p>
            </div>
            <p className="text-sm text-muted-foreground">You've already been marked present for this class.</p>
          </div>
        )}

        {(status === "error" || status === "no_student") && (
          <div className="space-y-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-700">Check-In Failed</h2>
              <p className="text-muted-foreground mt-2">{message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}