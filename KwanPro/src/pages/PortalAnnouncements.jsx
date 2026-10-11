import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Megaphone, Calendar } from "lucide-react";

const TYPE_STYLES = {
  announcement: "bg-blue-100 text-blue-700",
  test_date: "bg-purple-100 text-purple-700",
  event: "bg-green-100 text-green-700",
  closure: "bg-red-100 text-red-700",
};

export default function PortalAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Announcement.filter({ is_published: true }, "-created_date", 20)
      .then(a => { setAnnouncements(a); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground mt-1">News and updates from the dojo.</p>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No announcements yet.</div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{a.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[a.type] || TYPE_STYLES.announcement}`}>{a.type}</span>
                    {a.target_belt && a.target_belt !== "All" && a.target_belt.split(",").map(b => (
                      <span key={b} className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">{b} Belt</span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{a.content}</p>
                  {a.event_date && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(a.event_date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}