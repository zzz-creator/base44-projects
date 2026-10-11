import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Calendar, ChevronLeft, ChevronRight, Download, Loader2, Theater, ListTodo, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';

const eventTypes = [
  { id: 'productions', label: 'Productions', color: 'bg-blue-500', icon: Theater },
  { id: 'tasks', label: 'Tasks', color: 'bg-purple-500', icon: ListTodo },
  { id: 'crew', label: 'Crew Assignments', color: 'bg-green-500', icon: Users },
];

export default function ProductionCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFilters, setSelectedFilters] = useState(['productions', 'tasks', 'crew']);
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: productions = [], isLoading: loadingProductions } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.Production.list(),
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.TaskChecklist.list(),
  });

  const { data: crewAssignments = [], isLoading: loadingCrew } = useQuery({
    queryKey: ['crewAssignments'],
    queryFn: () => base44.entities.CrewAssignment.list(),
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const events = useMemo(() => {
    const allEvents = [];

    if (selectedFilters.includes('productions')) {
      productions.forEach(prod => {
        if (prod.start_date || prod.end_date) {
          allEvents.push({
            id: `prod-${prod.id}`,
            type: 'productions',
            title: prod.name,
            startDate: prod.start_date ? parseISO(prod.start_date) : null,
            endDate: prod.end_date ? parseISO(prod.end_date) : null,
            status: prod.status,
            data: prod,
          });
        }
      });
    }

    if (selectedFilters.includes('tasks')) {
      tasks.forEach(task => {
        if (task.due_date) {
          allEvents.push({
            id: `task-${task.id}`,
            type: 'tasks',
            title: task.task_name,
            date: parseISO(task.due_date),
            priority: task.priority,
            data: task,
          });
        }
      });
    }

    if (selectedFilters.includes('crew')) {
      crewAssignments.forEach(crew => {
        if (crew.start_date || crew.end_date) {
          allEvents.push({
            id: `crew-${crew.id}`,
            type: 'crew',
            title: `${crew.crew_member_name} - ${crew.role}`,
            startDate: crew.start_date ? parseISO(crew.start_date) : null,
            endDate: crew.end_date ? parseISO(crew.end_date) : null,
            data: crew,
          });
        }
      });
    }

    return allEvents;
  }, [productions, tasks, crewAssignments, selectedFilters]);

  const getEventsForDay = (day) => {
    return events.filter(event => {
      if (event.date) {
        return isSameDay(event.date, day);
      }
      if (event.startDate && event.endDate) {
        return isWithinInterval(day, { start: event.startDate, end: event.endDate });
      }
      if (event.startDate) {
        return isSameDay(event.startDate, day);
      }
      return false;
    });
  };

  const handleExport = () => {
    const csvData = events.map(e => ({
      Type: e.type,
      Title: e.title,
      Date: e.date ? format(e.date, 'yyyy-MM-dd') : `${e.startDate ? format(e.startDate, 'yyyy-MM-dd') : ''} - ${e.endDate ? format(e.endDate, 'yyyy-MM-dd') : ''}`,
      Status: e.status || e.priority || '',
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-${format(currentDate, 'yyyy-MM')}.csv`;
    a.click();
  };

  const isLoading = loadingProductions || loadingTasks || loadingCrew;

  const dayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production Calendar</h1>
          <p className="text-slate-500">View all production events and schedules</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Calendar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {eventTypes.map(type => {
              const Icon = type.icon;
              return (
                <div key={type.id} className="flex items-center gap-2">
                  <Checkbox
                    id={type.id}
                    checked={selectedFilters.includes(type.id)}
                    onCheckedChange={(checked) => {
                      setSelectedFilters(prev =>
                        checked ? [...prev, type.id] : prev.filter(f => f !== type.id)
                      );
                    }}
                  />
                  <label htmlFor={type.id} className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-3 h-3 rounded ${type.color}`} />
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{type.label}</span>
                  </label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h3>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-slate-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-2">
                {monthDays.map(day => {
                  const dayEvents = getEventsForDay(day);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toString()}
                      onClick={() => setSelectedDay(day)}
                      className={`min-h-24 p-2 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'border-blue-500 bg-blue-50' :
                        isToday ? 'border-blue-300 bg-blue-50/50' :
                        'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        !isSameMonth(day, currentDate) ? 'text-slate-400' : 'text-slate-900'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => {
                          const typeConfig = eventTypes.find(t => t.type === event.type);
                          return (
                            <div
                              key={event.id}
                              className={`text-xs px-1 py-0.5 rounded text-white truncate ${
                                event.type === 'productions' ? 'bg-blue-500' :
                                event.type === 'tasks' ? 'bg-purple-500' : 'bg-green-500'
                              }`}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-slate-500">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Day Events */}
      {selectedDay && dayEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Events for {format(selectedDay, 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dayEvents.map(event => (
                <div key={event.id} className="p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        event.type === 'productions' ? 'bg-blue-500' :
                        event.type === 'tasks' ? 'bg-purple-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium text-slate-900">{event.title}</p>
                        <p className="text-sm text-slate-500 capitalize">{event.type}</p>
                      </div>
                    </div>
                    {event.status && (
                      <Badge variant="outline">{event.status}</Badge>
                    )}
                    {event.priority && (
                      <Badge variant={event.priority === 'critical' ? 'destructive' : 'outline'}>
                        {event.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}