import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  GitBranch, 
  GitCommit, 
  Copy, 
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GitMerge,
  RotateCcw,
  Trash2
} from 'lucide-react';

export default function ScenarioBranching({ 
  currentScenario, 
  branches = [], 
  onCreateBranch,
  onSwitchBranch,
  onMergeBranches,
  onRevertToState,
  onDeleteBranch,
  currentScenarioId
}) {
  const [showForkDialog, setShowForkDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState([]);
  const [forkData, setForkData] = useState({
    name: '',
    description: '',
    whatIfQuestion: ''
  });
  const [creating, setCreating] = useState(false);

  const handleCreateFork = async () => {
    if (!forkData.name || !forkData.whatIfQuestion) return;

    setCreating(true);
    try {
      await onCreateBranch({
        ...forkData,
        parentId: currentScenario.id,
        parentName: currentScenario.name,
        timestamp: new Date().toISOString(),
        scenario: { ...currentScenario }
      });
      setShowForkDialog(false);
      setForkData({ name: '', description: '', whatIfQuestion: '' });
    } finally {
      setCreating(false);
    }
  };

  const handleMergeBranches = () => {
    if (selectedForMerge.length < 2 || !onMergeBranches) return;
    onMergeBranches(selectedForMerge);
    setShowMergeDialog(false);
    setSelectedForMerge([]);
  };

  const toggleMergeSelection = (branchId) => {
    setSelectedForMerge(prev => 
      prev.includes(branchId) 
        ? prev.filter(id => id !== branchId)
        : [...prev, branchId]
    );
  };

  // Build tree structure with enhanced controls
  const buildTree = (branches, parentId = null, depth = 0) => {
    const children = branches.filter(b => b.parentId === parentId);
    if (children.length === 0) return null;

    return children.map((branch, idx) => (
      <div key={branch.id} className="relative">
        {/* Connection Line */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 w-8 h-8 border-l-2 border-b-2 border-cyan-500/30 rounded-bl-lg"></div>
        )}

        <div className={`${depth > 0 ? 'ml-12' : ''} mb-3`}>
          <Card 
            className={`bg-slate-900/50 cyber-border p-4 hover-glow transition-all ${
              branch.id === currentScenarioId ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/20' : ''
            } ${selectedForMerge.includes(branch.id) ? 'border-purple-500/50' : ''}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSwitchBranch(branch)}>
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-cyan-400 font-mono">{branch.name}</h4>
              </div>
              <div className="flex items-center gap-2">
                {branch.id === currentScenarioId && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs">
                    ACTIVE
                  </Badge>
                )}
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-xs">
                  L{depth}
                </Badge>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-slate-400 font-mono text-xs mb-1">{branch.description}</p>
              <div className="flex items-start gap-2 mt-2 p-2 bg-purple-950/20 cyber-border rounded">
                <span className="text-purple-400 text-xs font-mono font-bold">?</span>
                <p className="text-purple-400 font-mono text-xs italic">
                  {branch.whatIfQuestion}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-slate-500">
                {new Date(branch.timestamp).toLocaleString()}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMergeSelection(branch.id);
                  }}
                  className={`border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-mono text-xs h-7 ${
                    selectedForMerge.includes(branch.id) ? 'bg-purple-500/20' : ''
                  }`}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {selectedForMerge.includes(branch.id) ? 'Selected' : 'Select'}
                </Button>
                {onRevertToState && branch.id !== currentScenarioId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRevertToState(branch);
                    }}
                    className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 font-mono text-xs h-7"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                )}
                {onDeleteBranch && branch.id !== currentScenarioId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete branch "${branch.name}"?`)) {
                        onDeleteBranch(branch.id);
                      }
                    }}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 font-mono text-xs h-7"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Recursive children */}
          {buildTree(branches, branch.id, depth + 1)}
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="bg-gradient-to-br from-cyan-950/30 to-purple-950/30 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono">
              SCENARIO BRANCHING
            </h3>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowForkDialog(true)}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-mono"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              FORK
            </Button>
            {onMergeBranches && selectedForMerge.length >= 2 && (
              <Button
                onClick={handleMergeBranches}
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-mono"
              >
                <GitMerge className="w-4 h-4 mr-2" />
                MERGE ({selectedForMerge.length})
              </Button>
            )}
          </div>
        </div>

        <p className="text-slate-400 font-mono text-sm">
          Create parallel "what-if" explorations, merge branches, and revert to previous states. 
          Visual tree structure shows all simulation paths.
        </p>
      </Card>

      {/* Branch Tree Visualization */}
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitCommit className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-bold text-green-400 glow-text font-mono">
            BRANCH TREE ({branches.length} {branches.length === 1 ? 'BRANCH' : 'BRANCHES'})
          </h3>
        </div>

        {branches.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 font-mono text-sm">
              No branches yet. Fork this scenario to explore alternative outcomes.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Main/Root Scenario */}
            <Card 
              className={`bg-gradient-to-br from-purple-950/50 to-pink-950/50 cyber-border p-4 border-2 ${
                currentScenarioId === currentScenario.id ? 'border-purple-500/80 shadow-lg shadow-purple-500/30' : 'border-purple-500/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSwitchBranch(currentScenario)}>
                  <GitCommit className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-bold text-purple-400 font-mono">
                    {currentScenario.name}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  {currentScenarioId === currentScenario.id && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs">
                      ACTIVE
                    </Badge>
                  )}
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                    ROOT
                  </Badge>
                </div>
              </div>
              <p className="text-slate-400 font-mono text-xs">{currentScenario.description}</p>
            </Card>

            {/* Branch Tree */}
            <div className="mt-4">
              {buildTree(branches, currentScenario.id, 0)}
            </div>
          </div>
        )}
      </Card>

      {/* Statistics */}
      <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
        <h3 className="text-lg font-bold text-yellow-400 glow-text font-mono mb-4">
          BRANCHING STATISTICS
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 cyber-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-cyan-400 font-mono">
              {branches.length + 1}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-1">Total Scenarios</div>
          </div>
          <div className="bg-slate-900/50 cyber-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400 font-mono">
              {branches.filter(b => b.parentId === currentScenario.id).length}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-1">Direct Forks</div>
          </div>
          <div className="bg-slate-900/50 cyber-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400 font-mono">
              {Math.max(...branches.map(b => {
                let depth = 0;
                let current = b;
                while (current.parentId) {
                  depth++;
                  current = branches.find(br => br.id === current.parentId) || {};
                }
                return depth;
              }), 0) + 1}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-1">Max Depth</div>
          </div>
          <div className="bg-slate-900/50 cyber-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-orange-400 font-mono">
              {branches.length > 0 ? branches[branches.length - 1].id : '0'}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-1">Latest Branch ID</div>
          </div>
        </div>
      </Card>

      {/* Fork Dialog */}
      <Dialog open={showForkDialog} onOpenChange={setShowForkDialog}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-xl cyber-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-cyan-400 font-mono flex items-center gap-2">
              <GitBranch className="w-6 h-6" />
              FORK SCENARIO
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="p-4 bg-cyan-950/20 cyber-border rounded-lg">
              <h4 className="text-sm font-bold text-cyan-400 font-mono mb-2">FORKING FROM:</h4>
              <p className="text-slate-300 font-mono text-sm">{currentScenario.name}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-green-400 font-mono">
                Branch Name *
              </label>
              <Input
                value={forkData.name}
                onChange={(e) => setForkData({ ...forkData, name: e.target.value })}
                placeholder="e.g., Escalation Scenario A"
                className="bg-slate-900/50 border-green-500/30 text-green-400 font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-purple-400 font-mono">
                What-If Question *
              </label>
              <Textarea
                value={forkData.whatIfQuestion}
                onChange={(e) => setForkData({ ...forkData, whatIfQuestion: e.target.value })}
                placeholder="e.g., What if a third-party nation intervenes militarily?"
                className="bg-slate-900/50 border-purple-500/30 text-purple-400 font-mono min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-yellow-400 font-mono">
                Description (Optional)
              </label>
              <Textarea
                value={forkData.description}
                onChange={(e) => setForkData({ ...forkData, description: e.target.value })}
                placeholder="Describe the key changes in this branch..."
                className="bg-slate-900/50 border-yellow-500/30 text-yellow-400 font-mono"
              />
            </div>

            <div className="p-4 bg-yellow-950/20 cyber-border rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                <p className="text-yellow-400 font-mono text-xs">
                  This will create a copy of the current scenario that you can modify independently. 
                  The original scenario will remain unchanged.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateFork}
                disabled={creating || !forkData.name || !forkData.whatIfQuestion}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-mono py-6"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    CREATING BRANCH...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    CREATE FORK
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowForkDialog(false)}
                variant="outline"
                className="border-slate-500/30 text-slate-400 hover:bg-slate-800 font-mono py-6"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}