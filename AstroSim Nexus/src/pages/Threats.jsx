import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { AlertTriangle, Shield, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function Threats() {
  const queryClient = useQueryClient();

  const { data: threats = [], isLoading } = useQuery({
    queryKey: ['threats'],
    queryFn: () => base44.entities.Threat.filter({ active: true })
  });

  const { data: colonies = [] } = useQuery({
    queryKey: ['colonies'],
    queryFn: () => base44.entities.Colony.list()
  });

  const resolveThreatMutation = useMutation({
    mutationFn: (threatId) => base44.entities.Threat.update(threatId, { active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threats'] });
      toast.success('✅ Threat resolved!');
    }
  });

  const getSeverityColor = (severity) => {
    if (severity >= 75) return 'bg-red-500';
    if (severity >= 50) return 'bg-orange-500';
    if (severity >= 25) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getStageColor = (stage) => {
    const colors = {
      Detection: 'bg-blue-100 text-blue-800',
      Escalation: 'bg-yellow-100 text-yellow-800',
      Critical: 'bg-red-100 text-red-800',
      Resolution: 'bg-green-100 text-green-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getColonyName = (colonyId) => {
    const colony = colonies.find(c => c.id === colonyId);
    return colony?.name || 'Unknown Colony';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading threat data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="border-b border-slate-700 pb-4">
          <h1 className="text-4xl font-bold text-white">⚠️ Threat Management</h1>
          <p className="text-slate-400 mt-2">Active: {threats.length} threats</p>
        </div>

        {threats.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">All Clear</h3>
              <p className="text-slate-400">No active threats detected</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {threats.map((threat) => (
              <Card key={threat.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-6 h-6 ${threat.severity >= 75 ? 'text-red-500' : threat.severity >= 50 ? 'text-orange-500' : 'text-yellow-500'}`} />
                      <div>
                        <CardTitle className="text-white">{threat.type}</CardTitle>
                        <p className="text-sm text-slate-400 mt-1">{getColonyName(threat.colony_id)}</p>
                      </div>
                    </div>
                    <Badge className={getStageColor(threat.stage)}>{threat.stage}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                      <span>Severity</span>
                      <span className="text-white font-semibold">{threat.severity}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getSeverityColor(threat.severity)}`}
                        style={{ width: `${threat.severity}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>{threat.duration} turns remaining</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => resolveThreatMutation.mutate(threat.id)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={resolveThreatMutation.isPending}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Resolve Threat
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}