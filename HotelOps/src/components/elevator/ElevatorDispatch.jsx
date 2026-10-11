import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ArrowUpDown, Clock, User, AlertCircle } from 'lucide-react';
import { cn } from "../../lib/utils";

export default function ElevatorDispatch({ requests = [], onAssignElevator, elevators = [] }) {
  const getPriorityColor = (level) => {
    if (level >= 8) return 'bg-red-100 text-red-800 border-red-300';
    if (level >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const getRequestTypeIcon = (type) => {
    switch (type) {
      case 'emergency': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'service': return <ArrowUpDown className="w-4 h-4 text-blue-600" />;
      default: return <User className="w-4 h-4 text-slate-600" />;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending').sort((a, b) => b.priority_level - a.priority_level);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center justify-between">
          <span>Elevator Queue</span>
          <Badge variant="secondary">{pendingRequests.length} Pending</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">No pending requests</p>
          </div>
        ) : (
          pendingRequests.map((request) => (
            <div
              key={request.id}
              className="border rounded-lg p-3 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getRequestTypeIcon(request.request_type)}
                  <span className="font-medium text-sm">
                    Floor {request.from_floor} → {request.to_floor}
                  </span>
                </div>
                <Badge className={cn("border", getPriorityColor(request.priority_level))}>
                  Priority {request.priority_level}
                </Badge>
              </div>
              
              <div className="text-xs text-slate-600 space-y-1">
                <p>Type: {request.request_type.toUpperCase()}</p>
                {request.guest_id && <p>Guest ID: {request.guest_id.slice(0, 8)}...</p>}
                <p className="text-slate-400">
                  {new Date(request.created_date).toLocaleTimeString()}
                </p>
              </div>

              <div className="mt-2 flex gap-2">
                {elevators.filter(e => e.status === 'idle').map((elevator) => (
                  <Button
                    key={elevator.id}
                    size="sm"
                    variant="outline"
                    onClick={() => onAssignElevator(request.id, elevator.id)}
                    className="text-xs"
                  >
                    Assign {elevator.elevator_name}
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}