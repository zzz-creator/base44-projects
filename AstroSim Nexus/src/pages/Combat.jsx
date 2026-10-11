import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { initiateCombat, executeCombatTurn } from '../components/combatEngine';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Swords, Play, SkipForward, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function Combat() {
  const queryClient = useQueryClient();
  const [selectedEncounter, setSelectedEncounter] = useState(null);
  const [newBattle, setNewBattle] = useState({ attacker: '', defender: '', location: '' });

  const { data: encounters = [] } = useQuery({
    queryKey: ['encounters'],
    queryFn: () => base44.entities.CombatEncounter.list('-created_date')
  });

  const { data: factions = [] } = useQuery({
    queryKey: ['factions'],
    queryFn: () => base44.entities.Faction.list()
  });

  const { data: colonies = [] } = useQuery({
    queryKey: ['colonies'],
    queryFn: () => base44.entities.Colony.list()
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['participants', selectedEncounter],
    queryFn: () => selectedEncounter ? base44.entities.CombatParticipant.filter({ encounter_id: selectedEncounter }) : [],
    enabled: !!selectedEncounter
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['combatLogs', selectedEncounter],
    queryFn: () => selectedEncounter ? base44.entities.CombatLog.filter({ encounter_id: selectedEncounter }) : [],
    enabled: !!selectedEncounter
  });

  const { data: ships = [] } = useQuery({
    queryKey: ['ships'],
    queryFn: () => base44.entities.Ship.list()
  });

  const createBattleMutation = useMutation({
    mutationFn: async (data) => {
      return await initiateCombat(data.attacker, data.defender, data.location);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['encounters']);
      toast.success('⚔️ Combat initiated!');
      setNewBattle({ attacker: '', defender: '', location: '' });
    }
  });

  const executeTurnMutation = useMutation({
    mutationFn: (encounterId) => executeCombatTurn(encounterId),
    onSuccess: () => {
      queryClient.invalidateQueries(['encounters']);
      queryClient.invalidateQueries(['participants']);
      queryClient.invalidateQueries(['combatLogs']);
      queryClient.invalidateQueries(['ships']);
    }
  });

  const renderHealthBar = (current, max, type) => {
    const percentage = (current / max) * 100;
    const blocks = Math.ceil((percentage / 100) * 8);
    const filled = '█'.repeat(Math.max(0, blocks));
    const empty = '░'.repeat(Math.max(0, 8 - blocks));
    
    const color = percentage > 60 ? 'text-green-400' : percentage > 30 ? 'text-yellow-400' : 'text-red-400';
    
    return (
      <span className={`font-mono ${color}`}>
        {filled}{empty}
      </span>
    );
  };

  const getShipName = (shipId) => {
    const ship = ships.find(s => s.id === shipId);
    return ship ? ship.name : 'Unknown';
  };

  const getFactionName = (factionId) => {
    const faction = factions.find(f => f.id === factionId);
    return faction ? faction.name : 'Unknown';
  };

  const getColonyName = (colonyId) => {
    const colony = colonies.find(c => c.id === colonyId);
    return colony ? colony.name : 'Unknown';
  };

  const selectedEncounterData = encounters.find(e => e.id === selectedEncounter);

  const attackerParticipants = participants.filter(p => p.side === 'Attacker');
  const defenderParticipants = participants.filter(p => p.side === 'Defender');

  return (
    <div className="min-h-screen bg-slate-950 p-6 font-mono">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="border-b-2 border-green-500 pb-4">
          <h1 className="text-4xl font-bold text-green-400">⚔️ COMBAT OPERATIONS</h1>
          <p className="text-green-300 mt-2">/// TACTICAL ENGAGEMENT MONITOR</p>
        </div>

        {/* New Battle Initiation */}
        <Card className="bg-slate-900 border-green-500">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Swords className="w-5 h-5" />
              INITIATE COMBAT ENCOUNTER
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-green-400 text-sm">ATTACKER FACTION</label>
                <Select value={newBattle.attacker} onValueChange={(v) => setNewBattle({...newBattle, attacker: v})}>
                  <SelectTrigger className="bg-slate-800 border-green-500 text-green-400">
                    <SelectValue placeholder="Select faction" />
                  </SelectTrigger>
                  <SelectContent>
                    {factions.length > 0 ? (
                      factions.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-slate-400">No factions available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-green-400 text-sm">DEFENDER FACTION</label>
                <Select value={newBattle.defender} onValueChange={(v) => setNewBattle({...newBattle, defender: v})}>
                  <SelectTrigger className="bg-slate-800 border-green-500 text-green-400">
                    <SelectValue placeholder="Select faction" />
                  </SelectTrigger>
                  <SelectContent>
                    {factions.length > 0 ? (
                      factions.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-slate-400">No factions available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-green-400 text-sm">LOCATION</label>
                <Select value={newBattle.location} onValueChange={(v) => setNewBattle({...newBattle, location: v})}>
                  <SelectTrigger className="bg-slate-800 border-green-500 text-green-400">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {colonies.length > 0 ? (
                      colonies.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-slate-400">No colonies available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={() => createBattleMutation.mutate(newBattle)}
              className="mt-4 bg-green-600 hover:bg-green-700 text-black font-bold"
              disabled={!newBattle.attacker || !newBattle.defender || !newBattle.location}
            >
              <Swords className="w-4 h-4 mr-2" />
              ENGAGE
            </Button>
          </CardContent>
        </Card>

        {/* Active Encounters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {encounters.slice(0, 9).map(enc => (
            <Card 
              key={enc.id}
              className={`bg-slate-900 cursor-pointer transition-all ${
                selectedEncounter === enc.id ? 'border-2 border-green-400' : 'border border-green-500'
              }`}
              onClick={() => setSelectedEncounter(enc.id)}
            >
              <CardContent className="p-4">
                <div className="text-green-400 font-bold mb-2">
                  {getFactionName(enc.attacker_faction_id)} vs {getFactionName(enc.defender_faction_id)}
                </div>
                <div className="text-xs text-green-300 space-y-1">
                  <div>Location: {getColonyName(enc.location_colony_id)}</div>
                  <div>Turn: {enc.current_turn}</div>
                  <div>Status: <Badge className={`
                    ${enc.status === 'Active' ? 'bg-yellow-500' : ''}
                    ${enc.status === 'Attacker Victory' ? 'bg-green-500' : ''}
                    ${enc.status === 'Defender Victory' ? 'bg-blue-500' : ''}
                    ${enc.status === 'Stalemate' ? 'bg-gray-500' : ''}
                  `}>{enc.status}</Badge></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Combat Terminal */}
        {selectedEncounterData && (
          <Card className="bg-black border-2 border-green-500">
            <CardContent className="p-6">
              <div className="text-green-400 space-y-2">
                <div className="border-b border-green-500 pb-2">
                  <div className="text-center text-xl font-bold">
                    ==============================================================
                  </div>
                  <div className="text-center">
                    SYSTEM: {getColonyName(selectedEncounterData.location_colony_id)}
                  </div>
                  <div className="text-center">
                    COMBAT REPORT - TURN {selectedEncounterData.current_turn}
                  </div>
                  <div className="text-center text-xl font-bold">
                    ==============================================================
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mt-4">
                  <div>
                    <div className="text-yellow-400 font-bold mb-2">
                      [Fleet A: {getFactionName(selectedEncounterData.attacker_faction_id)}]
                    </div>
                    <div className="text-xs space-y-1">
                      <div>Ship Name          Hull      Shield    Status</div>
                      <div>-------------------------------------------------------</div>
                      {attackerParticipants.map(p => (
                        <div key={p.id} className="flex justify-between">
                          <span className="w-20 truncate">{getShipName(p.ship_id)}</span>
                          <span>{renderHealthBar(p.current_hull, 100, 'hull')}</span>
                          <span>{renderHealthBar(p.current_shields, 100, 'shield')}</span>
                          <span className={`w-12 ${
                            p.status === 'Destroyed' ? 'text-red-500' : 
                            p.status === 'Retreating' ? 'text-yellow-500' : 'text-green-500'
                          }`}>{p.status}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs">
                      Morale: {Math.floor(selectedEncounterData.attacker_morale)}%
                    </div>
                  </div>

                  <div>
                    <div className="text-blue-400 font-bold mb-2">
                      [Fleet B: {getFactionName(selectedEncounterData.defender_faction_id)}]
                    </div>
                    <div className="text-xs space-y-1">
                      <div>Ship Name          Hull      Shield    Status</div>
                      <div>-------------------------------------------------------</div>
                      {defenderParticipants.map(p => (
                        <div key={p.id} className="flex justify-between">
                          <span className="w-20 truncate">{getShipName(p.ship_id)}</span>
                          <span>{renderHealthBar(p.current_hull, 100, 'hull')}</span>
                          <span>{renderHealthBar(p.current_shields, 100, 'shield')}</span>
                          <span className={`w-12 ${
                            p.status === 'Destroyed' ? 'text-red-500' : 
                            p.status === 'Retreating' ? 'text-yellow-500' : 'text-green-500'
                          }`}>{p.status}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs">
                      Morale: {Math.floor(selectedEncounterData.defender_morale)}%
                    </div>
                  </div>
                </div>

                <div className="border-t border-green-500 pt-4 mt-4">
                  <div className="font-bold mb-2">Turn Summary:</div>
                  <div className="text-xs space-y-1">
                    <div>- Fleet A dealt {selectedEncounterData.total_attacker_damage} total damage</div>
                    <div>- Fleet B dealt {selectedEncounterData.total_defender_damage} total damage</div>
                    <div>- Status: {selectedEncounterData.status}</div>
                    {logs.slice(-3).map((log, idx) => (
                      <div key={idx}>- {log.description}</div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-green-500 pt-4 mt-4 flex gap-4">
                  <Button
                    onClick={() => executeTurnMutation.mutate(selectedEncounter)}
                    disabled={selectedEncounterData.status !== 'Active'}
                    className="bg-green-600 hover:bg-green-700 text-black"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Execute Next Turn
                  </Button>
                  {selectedEncounterData.status !== 'Active' && (
                    <Badge className="bg-red-600 text-white px-4 py-2">
                      COMBAT ENDED: {selectedEncounterData.status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}