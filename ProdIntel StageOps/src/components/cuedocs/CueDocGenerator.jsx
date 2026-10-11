import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { callGemini } from '../../components/ai/geminiClient';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  FileText,
  Download,
  Printer,
  Loader2,
  Sparkles,
  Users,
  ListTodo,
  AlertTriangle,
  Wrench,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';

const departmentLabels = {
  lighting: 'Lighting',
  sound: 'Sound',
  staging: 'Staging',
  video: 'Video',
  fly: 'Fly',
  props: 'Props',
  special_effects: 'Special Effects',
};

export default function CueDocGenerator({ open, onClose, production }) {
  const [includeSections, setIncludeSections] = useState({
    cues: true,
    crew: true,
    tasks: true,
    equipment: true,
    incidents: false,
  });
  const [generating, setGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const printRef = useRef(null);

  const { data: cueDocs = [] } = useQuery({
    queryKey: ['cueDocs', production?.id],
    queryFn: () => base44.entities.CueDocumentation.filter({ production_id: production?.id }, 'cue_number'),
    enabled: !!production?.id,
  });

  const { data: crewAssignments = [] } = useQuery({
    queryKey: ['crewAssignments', production?.id],
    queryFn: () => base44.entities.CrewAssignment.filter({ production_id: production?.id }),
    enabled: !!production?.id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', production?.id],
    queryFn: () => base44.entities.TaskChecklist.filter({ production_id: production?.id }),
    enabled: !!production?.id,
  });

  const { data: equipmentSchedules = [] } = useQuery({
    queryKey: ['equipmentSchedules', production?.id],
    queryFn: () => base44.entities.EquipmentSchedule.filter({ production_id: production?.id }),
    enabled: !!production?.id,
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents', production?.id],
    queryFn: () => base44.entities.IncidentLog.filter({ production_id: production?.id }),
    enabled: !!production?.id,
  });

  const { data: venue } = useQuery({
    queryKey: ['venue', production?.venue_id],
    queryFn: async () => {
      const venues = await base44.entities.Venue.filter({ id: production?.venue_id });
      return venues[0];
    },
    enabled: !!production?.venue_id,
  });

  // Group cues by department
  const cuesByDepartment = cueDocs.reduce((acc, cue) => {
    const dept = cue.department || 'other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(cue);
    return acc;
  }, {});

  const generateAISuggestions = async () => {
    setLoadingAI(true);
    try {
      const context = {
        production: production?.name,
        cueCount: cueDocs.length,
        departments: Object.keys(cuesByDepartment),
        crewCount: crewAssignments.length,
        pendingTasks: tasks.filter(t => t.completion_status !== 'completed').length,
        openIncidents: incidents.filter(i => i.resolution_status !== 'closed').length,
      };

      const result = await callGemini(`You are a professional stage manager reviewing cue documentation for a theatrical production.
        
Production: ${context.production}
Current cues: ${context.cueCount} across departments: ${context.departments.join(', ')}
Crew assigned: ${context.crewCount}
Pending tasks: ${context.pendingTasks}
Open incidents: ${context.openIncidents}

Cue details:
${cueDocs.slice(0, 20).map(c => `- ${c.cue_number} (${c.department}): ${c.description || 'No description'}`).join('\n')}

Provide brief, actionable suggestions for:
1. Any missing cue types that are commonly needed
2. Safety considerations based on the departments involved
3. Pre-show checklist items
4. Communication protocols during the show

Keep suggestions practical and specific to this production.`, {
        type: 'object',
        properties: {
          missing_cues: { type: 'array', items: { type: 'string' } },
          safety_notes: { type: 'array', items: { type: 'string' } },
          preshow_checklist: { type: 'array', items: { type: 'string' } },
          communication_tips: { type: 'array', items: { type: 'string' } }
        }
      });

      setAiSuggestions(result);
    } catch (error) {
      console.error('AI suggestions error:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  const generatePDF = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Helper function to add new page if needed
      const checkNewPage = (neededSpace = 30) => {
        if (yPos + neededSpace > 270) {
          doc.addPage();
          yPos = 20;
        }
      };

      // Title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(production?.name || 'Production', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Cue Documentation', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Production Info
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PRODUCTION INFORMATION', margin, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      if (venue) {
        doc.text(`Venue: ${venue.name}`, margin, yPos);
        yPos += 5;
      }
      if (production?.start_date) {
        doc.text(`Dates: ${format(new Date(production.start_date), 'MMM d, yyyy')}${production.end_date ? ` - ${format(new Date(production.end_date), 'MMM d, yyyy')}` : ''}`, margin, yPos);
        yPos += 5;
      }
      doc.text(`Status: ${production?.status || 'Planning'}`, margin, yPos);
      yPos += 15;

      // Cue Sheets by Department
      if (includeSections.cues && cueDocs.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('CUE SHEETS', margin, yPos);
        yPos += 10;

        Object.entries(cuesByDepartment).forEach(([dept, cues]) => {
          checkNewPage(40);
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(departmentLabels[dept] || dept.toUpperCase(), margin, yPos);
          yPos += 7;

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          
          cues.forEach(cue => {
            checkNewPage(15);
            doc.text(`${cue.cue_number}`, margin, yPos);
            const descText = cue.description || 'No description';
            const lines = doc.splitTextToSize(descText, contentWidth - 30);
            doc.text(lines, margin + 25, yPos);
            yPos += (lines.length * 4) + 3;
          });
          yPos += 5;
        });
        yPos += 10;
      }

      // Crew List
      if (includeSections.crew && crewAssignments.length > 0) {
        checkNewPage(50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('CREW ASSIGNMENTS', margin, yPos);
        yPos += 10;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        crewAssignments.forEach(crew => {
          checkNewPage(10);
          doc.text(`${crew.crew_member_name || 'TBD'} - ${crew.role}`, margin, yPos);
          if (crew.contact_info) {
            doc.text(crew.contact_info, margin + 80, yPos);
          }
          yPos += 5;
        });
        yPos += 10;
      }

      // Task Checklist
      if (includeSections.tasks && tasks.length > 0) {
        checkNewPage(50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('TASK CHECKLIST', margin, yPos);
        yPos += 10;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        tasks.forEach(task => {
          checkNewPage(10);
          const status = task.completion_status === 'completed' ? '[X]' : '[ ]';
          doc.text(`${status} ${task.task_name}`, margin, yPos);
          if (task.assigned_to) {
            doc.text(`(${task.assigned_to})`, margin + 100, yPos);
          }
          yPos += 5;
        });
        yPos += 10;
      }

      // Equipment
      if (includeSections.equipment && equipmentSchedules.length > 0) {
        checkNewPage(50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('EQUIPMENT SCHEDULE', margin, yPos);
        yPos += 10;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        equipmentSchedules.forEach(schedule => {
          checkNewPage(10);
          doc.text(`• ${schedule.notes || 'Equipment scheduled'}`, margin, yPos);
          yPos += 5;
        });
        yPos += 10;
      }

      // Incidents
      if (includeSections.incidents && incidents.length > 0) {
        checkNewPage(50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('INCIDENT LOG', margin, yPos);
        yPos += 10;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        incidents.forEach(incident => {
          checkNewPage(15);
          doc.text(`[${incident.severity?.toUpperCase()}] ${incident.description}`, margin, yPos);
          yPos += 5;
          doc.text(`Status: ${incident.resolution_status}`, margin + 5, yPos);
          yPos += 7;
        });
      }

      // AI Suggestions
      if (aiSuggestions) {
        checkNewPage(50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('AI RECOMMENDATIONS', margin, yPos);
        yPos += 10;

        if (aiSuggestions.preshow_checklist?.length > 0) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('Pre-Show Checklist:', margin, yPos);
          yPos += 6;
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          aiSuggestions.preshow_checklist.forEach(item => {
            checkNewPage(8);
            doc.text(`[ ] ${item}`, margin, yPos);
            yPos += 5;
          });
          yPos += 5;
        }

        if (aiSuggestions.safety_notes?.length > 0) {
          checkNewPage(20);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('Safety Notes:', margin, yPos);
          yPos += 6;
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          aiSuggestions.safety_notes.forEach(note => {
            checkNewPage(8);
            const lines = doc.splitTextToSize(`• ${note}`, contentWidth);
            doc.text(lines, margin, yPos);
            yPos += (lines.length * 4) + 2;
          });
        }
      }

      // Footer on last page
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`${production?.name} - Cue Documentation - Page ${doc.internal.getNumberOfPages()}`, pageWidth / 2, 285, { align: 'center' });

      doc.save(`${production?.name || 'Production'}_CueDoc_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${production?.name || 'Production'} - Cue Documentation</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 24px; margin-bottom: 5px; }
          h3 { font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
          .header p { color: #666; margin: 5px 0; }
          .cue-item { display: flex; gap: 15px; margin: 5px 0; font-size: 14px; }
          .cue-number { font-family: monospace; font-weight: bold; min-width: 60px; }
          .crew-item, .task-item { display: flex; justify-content: space-between; font-size: 14px; margin: 5px 0; }
          .muted { color: #666; }
          .completed { text-decoration: line-through; color: #999; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${production?.name || 'Production'}</h1>
          <p>Cue Documentation</p>
          <p style="font-size: 12px;">Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}</p>
        </div>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!production) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Cue Documentation
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="configure" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="configure">Configure</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="flex-1 overflow-auto">
            <div className="space-y-6 py-4">
              <div>
                <h3 className="font-medium mb-3">Production: {production.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    {cueDocs.length} Cues
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {crewAssignments.length} Crew
                  </div>
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4" />
                    {tasks.length} Tasks
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {incidents.length} Incidents
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Include Sections</h4>
                <div className="space-y-3">
                  {[
                    { key: 'cues', label: 'Cue Sheets', icon: ClipboardList, count: cueDocs.length },
                    { key: 'crew', label: 'Crew Assignments', icon: Users, count: crewAssignments.length },
                    { key: 'tasks', label: 'Task Checklist', icon: ListTodo, count: tasks.length },
                    { key: 'equipment', label: 'Equipment Schedule', icon: Wrench, count: equipmentSchedules.length },
                    { key: 'incidents', label: 'Incident Log', icon: AlertTriangle, count: incidents.length },
                  ].map(({ key, label, icon: Icon, count }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={key}
                          checked={includeSections[key]}
                          onCheckedChange={(checked) => 
                            setIncludeSections(prev => ({ ...prev, [key]: checked }))
                          }
                        />
                        <Label htmlFor={key} className="flex items-center gap-2 cursor-pointer">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          {label}
                        </Label>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto">
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <div ref={printRef} className="space-y-6">
                <div className="text-center border-b pb-4">
                  <h1 className="text-xl font-bold">{production.name}</h1>
                  <p className="text-muted-foreground">Cue Documentation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generated: {format(new Date(), 'MMMM d, yyyy')}
                  </p>
                </div>

                {includeSections.cues && Object.entries(cuesByDepartment).map(([dept, cues]) => (
                  <div key={dept}>
                    <h3 className="font-semibold border-b pb-1 mb-2">
                      {departmentLabels[dept] || dept}
                    </h3>
                    <div className="space-y-1 text-sm">
                      {cues.map(cue => (
                        <div key={cue.id} className="flex gap-4">
                          <span className="font-mono font-medium w-16">{cue.cue_number}</span>
                          <span className="text-muted-foreground">{cue.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {includeSections.crew && crewAssignments.length > 0 && (
                  <div>
                    <h3 className="font-semibold border-b pb-1 mb-2">Crew Assignments</h3>
                    <div className="space-y-1 text-sm">
                      {crewAssignments.map(crew => (
                        <div key={crew.id} className="flex justify-between">
                          <span>{crew.crew_member_name} - {crew.role}</span>
                          <span className="text-muted-foreground">{crew.contact_info}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {includeSections.tasks && tasks.length > 0 && (
                  <div>
                    <h3 className="font-semibold border-b pb-1 mb-2">Task Checklist</h3>
                    <div className="space-y-1 text-sm">
                      {tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 ${task.completion_status === 'completed' ? 'text-green-500' : 'text-muted-foreground'}`} />
                          <span className={task.completion_status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                            {task.task_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ai" className="flex-1 overflow-auto">
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Get AI-powered suggestions for your cue documentation
                </p>
                <Button 
                  onClick={generateAISuggestions} 
                  disabled={loadingAI}
                  variant="outline"
                >
                  {loadingAI ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate Suggestions
                </Button>
              </div>

              {aiSuggestions && (
                <ScrollArea className="h-[350px]">
                  <div className="space-y-4">
                    {aiSuggestions.missing_cues?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <ClipboardList className="w-4 h-4" />
                          Suggested Missing Cues
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {aiSuggestions.missing_cues.map((cue, i) => (
                            <li key={i}>• {cue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiSuggestions.safety_notes?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-600">
                          <AlertTriangle className="w-4 h-4" />
                          Safety Considerations
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {aiSuggestions.safety_notes.map((note, i) => (
                            <li key={i}>• {note}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiSuggestions.preshow_checklist?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <ListTodo className="w-4 h-4" />
                          Pre-Show Checklist
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {aiSuggestions.preshow_checklist.map((item, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Checkbox id={`preshow-${i}`} />
                              <Label htmlFor={`preshow-${i}`} className="cursor-pointer font-normal">
                                {item}
                              </Label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiSuggestions.communication_tips?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Communication Tips</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {aiSuggestions.communication_tips.map((tip, i) => (
                            <li key={i}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {!aiSuggestions && !loadingAI && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Click "Generate Suggestions" to get AI-powered recommendations</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={generatePDF} disabled={generating}>
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}