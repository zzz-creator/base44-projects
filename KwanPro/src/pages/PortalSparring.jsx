import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Swords, Trophy, MessageSquare } from "lucide-react";

export default function PortalSparring() {
  const [matches, setMatches] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      const students = await base44.entities.Student.filter({ email: me.email });
      const s = students[0];
      setStudent(s);
      if (s) {
        const allMatches = await base44.entities.SparringMatch.list("-date", 200);
        setMatches(allMatches.filter(m => m.student1_id === s.id || m.student2_id === s.id));
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  if (!student) return (
    <div className="w-full text-center py-16 text-muted-foreground">No student record linked to your account.</div>
  );

  const wins = matches.filter(m => m.winner_id === student.id).length;
  const draws = matches.filter(m => m.result === "draw").length;
  const losses = matches.length - wins - draws;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sparring History</h1>
        <p className="text-muted-foreground mt-1">Your match results and instructor feedback.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{wins}</p>
          <p className="text-sm text-muted-foreground mt-1">Wins</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-red-500">{losses}</p>
          <p className="text-sm text-muted-foreground mt-1">Losses</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-muted-foreground">{draws}</p>
          <p className="text-sm text-muted-foreground mt-1">Draws</p>
        </div>
      </div>

      {/* Match list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
          <Swords className="w-4 h-4 text-muted-foreground" />
          <p className="font-semibold text-sm">All Matches ({matches.length})</p>
        </div>
        {matches.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No sparring matches recorded yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {matches.map(match => {
              const isStudent1 = match.student1_id === student.id;
              const opponent = isStudent1 ? match.student2_name : match.student1_name;
              const myResult = match.result === "draw" ? "draw" : match.winner_id === student.id ? "win" : "loss";
              const myFeedback = isStudent1 ? match.student1_feedback : match.student2_feedback;

              return (
                <div key={match.id} className="px-5 py-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{match.date}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Swords className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium">vs. {opponent}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0 ${
                      myResult === "win" ? "bg-green-100 text-green-700" :
                      myResult === "loss" ? "bg-red-100 text-red-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {myResult === "win" ? "🏆 Win" : myResult === "loss" ? "Loss" : "Draw"}
                    </span>
                  </div>

                  {(match.instructor_feedback || myFeedback) && (
                    <div className="mt-2 ml-24 space-y-1.5">
                      {match.instructor_feedback && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="italic">"{match.instructor_feedback}"</span>
                        </div>
                      )}
                      {myFeedback && (
                        <div className="flex items-start gap-1.5 text-xs">
                          <MessageSquare className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                          <span className="text-foreground italic">"{myFeedback}"</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}