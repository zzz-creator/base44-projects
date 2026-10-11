import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { GitBranch, Plus, Link as LinkIcon } from 'lucide-react';

export default function ScenarioBranching({ 
  scenarios, 
  currentScenario, 
  onCreateBranch,
  onLinkScenarios,
  onSwitchScenario 
}) {
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [branchData, setBranchData] = useState({
    name: '',
    description: '',
    whatIf: '',
    parentId: currentScenario?.id || null
  });

  const handleCreateBranch = () => {
    onCreateBranch({
      ...branchData,
      baseScenario: currentScenario,
      timestamp: new Date().toISOString()
    });
    setShowBranchDialog(false);
    setBranchData({ name: '', description: '', whatIf: '', parentId: null });
  };

  const buildScenarioTree = (scenarios) => {
    const tree = {};
    scenarios.forEach(s => {
      if (!s.parentId) {
        tree[s.id] = { ...s, children: [] };
      }
    });
    scenarios.forEach(s => {
      if (s.parentId && tree[s.parentId]) {
        tree[s.parentId].children.push(s);
      }
    });
    return Object.values(tree);
  };

  const renderScenarioNode = (scenario, depth = 0) => (
    <div key={scenario.id} className={`ml-${depth * 4}`}>
      <button
        onClick={() => onSwitchScenario(scenario)}
        className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
          currentScenario?.id === scenario.id
            ? 'bg-cyan-500/20 border-2 border-cyan-500/50'
            : 'bg-slate-900/50 border border-slate-700/30 hover:bg-slate-800/50'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-mono font-bold text-sm">{scenario.name}</span>
              {currentScenario?.id === scenario.id && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs">
                  ACTIVE
                </Badge>
              )}
            </div>
            <p className="text-slate-400 font-mono text-xs mb-1">{scenario.description}</p>
            {scenario.whatIf && (
              <div className="text-xs text-purple-400 font-mono mt-2">
                What if: {scenario.whatIf}
              </div>
            )}
          </div>
        </div>
      </button>
      {scenario.children?.map(child => renderScenarioNode(child, depth + 1))}
    </div>
  );

  const scenarioTree = buildScenarioTree(scenarios);
  const maxDepth = Math.max(...scenarios.map(s => {
    let depth = 0;
    let current = s;
    while (current.parentId) {
      depth++;
      current = scenarios.find(sc => sc.id === current.parentId) || {};
    }
    return depth;
  }));

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono flex items-center gap-2">
          <GitBranch className="w-6 h-6" />
          SCENARIO BRANCHES
        </h3>
        <Button
          onClick={() => setShowBranchDialog(true)}
          disabled={!currentScenario}
          className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-mono"
        >
          <Plus className="w-4 h-4 mr-2" />
          FORK SCENARIO
        </Button>
      </div>

      {scenarios.length === 0 ? (
        <div className="text-center py-8 text-slate-400 font-mono text-sm">
          No scenarios created yet. Create a scenario to start branching.
        </div>
      ) : (
        <>
          <div className="mb-4 p-3 bg-purple-950/20 cyber-border rounded">
            <div className="text-xs text-purple-400 font-mono mb-2">BRANCHING STATISTICS</div>
            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <div className="text-slate-500">Total Scenarios</div>
                <div className="text-cyan-400 font-bold">{scenarios.length}</div>
              </div>
              <div>
                <div className="text-slate-500">Direct Forks</div>
                <div className="text-purple-400 font-bold">
                  {scenarios.filter(s => s.parentId).length}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Max Depth</div>
                <div className="text-green-400 font-bold">{maxDepth}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {scenarioTree.map(scenario => renderScenarioNode(scenario))}
          </div>
        </>
      )}

      <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-xl cyber-border">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 font-mono">CREATE SCENARIO BRANCH</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 font-mono text-sm mb-2 block">Branch Name</label>
              <Input
                placeholder="e.g., Diplomatic Resolution Path"
                value={branchData.name}
                onChange={(e) => setBranchData({...branchData, name: e.target.value})}
                className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-mono text-sm mb-2 block">Description</label>
              <Textarea
                placeholder="Describe this scenario branch..."
                value={branchData.description}
                onChange={(e) => setBranchData({...branchData, description: e.target.value})}
                className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-mono text-sm mb-2 block">What-If Question</label>
              <Input
                placeholder="e.g., What if diplomatic talks succeed?"
                value={branchData.whatIf}
                onChange={(e) => setBranchData({...branchData, whatIf: e.target.value})}
                className="bg-slate-900/50 border-purple-500/30 text-purple-400 font-mono"
              />
            </div>
            <Button
              onClick={handleCreateBranch}
              disabled={!branchData.name || !branchData.whatIf}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              CREATE BRANCH
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}