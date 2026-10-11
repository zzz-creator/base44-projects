import * as React from 'react';
const { useState, useEffect } = React;
import { dataProvider as base44 } from '../../components/data/DataProvider';
import { Panel } from '../simulator/Panel';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { 
  FileText, Plus, Download, Upload, Play, Trash2, 
  CheckCircle, XCircle, Clock, TrendingUp, Edit, Database, Globe, History
} from 'lucide-react';
import ScenarioEditor from './ScenarioEditor';
import ScenarioVersionHistory from './ScenarioVersionHistory';

export default function ScenarioManager({ 
  scenarios, 
  currentScenario,
  onCreateScenario, 
  onLoadScenario, 
  onDeleteScenario,
  onExportScenario,
  onImportScenario,
  performanceData,
  systemState,
  addLog
}) {
  const [showEditor, setShowEditor] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('local'); // 'local', 'saved', 'public'
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionScenario, setVersionScenario] = useState(null);

  // Load saved scenarios from database
  useEffect(() => {
    loadSavedScenarios();
  }, []);

  const loadSavedScenarios = async () => {
    setLoadingSaved(true);
    try {
      const saved = await base44.entities.MissionScenario.list('-created_date', 50);
      setSavedScenarios(saved);
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleSaveToDatabase = async (scenarioData) => {
    try {
      if (editingScenario?.id && typeof editingScenario.id === 'string' && !editingScenario.id.startsWith('SCN-')) {
        // Create new version instead of updating
        const currentVersion = editingScenario.version || 1;
        const parentId = editingScenario.parentScenarioId || editingScenario.id;
        
        // Mark current as not latest
        await base44.entities.MissionScenario.update(editingScenario.id, { isLatestVersion: false });
        
        // Create new version
        const newVersionData = {
          ...scenarioData,
          version: currentVersion + 1,
          parentScenarioId: parentId,
          isLatestVersion: true,
          versionNotes: scenarioData.versionNotes || `Updated from version ${currentVersion}`
        };
        delete newVersionData.id;
        delete newVersionData.created_date;
        delete newVersionData.updated_date;
        
        await base44.entities.MissionScenario.create(newVersionData);
        addLog?.('success', `Scenario "${scenarioData.name}" v${currentVersion + 1} saved`, true);
      } else {
        // Create new saved scenario
        const newScenario = {
          ...scenarioData,
          version: 1,
          isLatestVersion: true
        };
        await base44.entities.MissionScenario.create(newScenario);
        addLog?.('success', `Scenario "${scenarioData.name}" saved to database`, true);
      }
      await loadSavedScenarios();
      setShowEditor(false);
      setEditingScenario(null);
    } catch (err) {
      addLog?.('error', `Failed to save scenario: ${err.message}`, true);
    }
  };
  
  const handleShowVersionHistory = (scenario) => {
    setVersionScenario(scenario);
    setShowVersionHistory(true);
  };
  
  const handleVersionRevert = (newVersion) => {
    loadSavedScenarios();
    addLog?.('success', `Reverted to version ${newVersion.version}`, true);
  };

  const handleDeleteSaved = async (id) => {
    if (!window.confirm('Delete this saved scenario?')) return;
    try {
      await base44.entities.MissionScenario.delete(id);
      addLog?.('info', 'Scenario deleted from database', true);
      await loadSavedScenarios();
    } catch (err) {
      addLog?.('error', `Failed to delete scenario: ${err.message}`, true);
    }
  };

  const handleCreateLocal = (scenarioData) => {
    onCreateScenario(scenarioData);
    setShowEditor(false);
    setEditingScenario(null);
  };

  const handleEditScenario = (scenario) => {
    setEditingScenario(scenario);
    setShowEditor(true);
  };

  const getScenarioStats = (scenarioId) => {
    const runs = performanceData.filter(p => p.scenarioId === scenarioId);
    const completed = runs.filter(r => r.completed).length;
    const avgTime = runs.length > 0 
      ? runs.reduce((sum, r) => sum + (r.completionTime || 0), 0) / runs.length 
      : 0;
    return { runs: runs.length, completed, avgTime: Math.round(avgTime / 1000) };
  };

  const publicScenarios = savedScenarios.filter(s => s.isPublic);
  const myScenarios = savedScenarios.filter(s => !s.isPublic);

  const renderScenarioCard = (scenario, isSaved = false) => {
    const stats = getScenarioStats(scenario.id);
    const isActive = currentScenario?.id === scenario.id;
    
    return (
      <div
        key={scenario.id}
        className={`p-3 rounded border transition-colors ${
          isActive 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-[#1a1a2e] border-[#2a2a3e] hover:border-[#3a3a4e]'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {/* @ts-ignore */}
              <FileText className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-bold text-gray-200">{scenario.name}</span>
              {isActive && <span className="text-xs text-green-400 font-bold">ACTIVE</span>}
              {scenario.difficulty && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  scenario.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                  scenario.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  scenario.difficulty === 'hard' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {scenario.difficulty}
                </span>
              )}
              {/* @ts-ignore */}
              {isSaved && <Database className="w-3 h-3 text-blue-400" title="Saved to database" />}
              {isSaved && scenario.version > 1 && (
                <span className="text-xs text-gray-500">v{scenario.version}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-2">{scenario.description}</p>
            
            {/* Stats */}
            <div className="flex items-center gap-3 text-xs">
              {isSaved ? (
                <>
                  <span className="text-gray-400">{scenario.timesPlayed || 0} plays</span>
                  {scenario.avgScore > 0 && (
                    <span className="text-gray-400">{Math.round(scenario.avgScore)}% avg</span>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    {/* @ts-ignore */}
                    <TrendingUp className="w-3 h-3 text-blue-400" />
                    <span className="text-gray-400">{stats.runs} runs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* @ts-ignore */}
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-gray-400">{stats.completed} completed</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => onLoadScenario(scenario)}
              disabled={isActive}
              className="p-1.5 hover:bg-green-500/20 rounded text-green-400 hover:text-green-300 disabled:opacity-30"
              title="Load Scenario"
            >
              {/* @ts-ignore */}
              <Play className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleEditScenario(scenario)}
              className="p-1.5 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300"
              title="Edit Scenario"
            >
              {/* @ts-ignore */}
              <Edit className="w-3 h-3" />
            </button>
            {isSaved && (
              <button
                onClick={() => handleShowVersionHistory(scenario)}
                className="p-1.5 hover:bg-purple-500/20 rounded text-purple-400 hover:text-purple-300"
                title="Version History"
              >
                {/* @ts-ignore */}
                <History className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => onExportScenario?.(scenario)}
              className="p-1.5 hover:bg-cyan-500/20 rounded text-cyan-400 hover:text-cyan-300"
              title="Export"
            >
              {/* @ts-ignore */}
              <Download className="w-3 h-3" />
            </button>
            <button
              onClick={() => isSaved ? handleDeleteSaved(scenario.id) : onDeleteScenario(scenario.id)}
              className="p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
              title="Delete"
            >
              {/* @ts-ignore */}
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        {/* Objectives preview */}
        {scenario.objectives?.length > 0 && (
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-[#2a2a3e]">
            {scenario.objectives.length} objective(s)
          </div>
        )}
        
        {/* Faults preview */}
        {Object.keys(scenario.faultConfig || {}).length > 0 && (
          <div className="text-xs mt-1">
            <span className="text-orange-400">{Object.keys(scenario.faultConfig).length} fault(s) configured</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Scenario Editor Modal */}
      {showEditor && (
        <ScenarioEditor
          scenario={editingScenario}
          onSave={activeTab === 'local' ? handleCreateLocal : handleSaveToDatabase}
          onCancel={() => {
            setShowEditor(false);
            setEditingScenario(null);
          }}
        />
      )}

      {/* Version History Modal */}
      {showVersionHistory && versionScenario && (
        <ScenarioVersionHistory
          scenario={versionScenario}
          onRevert={handleVersionRevert}
          onClose={() => {
            setShowVersionHistory(false);
            setVersionScenario(null);
          }}
          addLog={addLog}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] flex-shrink-0">
        <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
          Scenarios
        </span>
        <button
          onClick={() => {
            setEditingScenario(null);
            setShowEditor(true);
          }}
          className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
        >
          {/* @ts-ignore */}
          <Plus className="w-3 h-3" />
          New
        </button>
      </div>

      {/* Tabs */}
      <div className="px-2 py-1 bg-[#12121a] border-b border-[#2a2a3e] flex gap-1 flex-shrink-0">
        {[
          { id: 'local', label: 'Session', icon: FileText },
          { id: 'saved', label: 'Saved', icon: Database },
          { id: 'public', label: 'Public', icon: Globe }
        ].map((tab) => {
          /** @type {any} */
          const Icon = tab.icon;
          const count = tab.id === 'local' ? scenarios.length : tab.id === 'saved' ? myScenarios.length : publicScenarios.length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {/* @ts-ignore */}
              <Icon className="w-3 h-3" />
              {tab.label}
              {count > 0 && <span className="text-gray-600">({count})</span>}
            </button>
          );
        })}
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'local' && (
          <>
            {scenarios.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No session scenarios</p>
            ) : (
              scenarios.map((s) => renderScenarioCard(s, false))
            )}
          </>
        )}

        {activeTab === 'saved' && (
          <>
            {loadingSaved ? (
              <p className="text-xs text-gray-500 text-center py-4">Loading...</p>
            ) : myScenarios.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No saved scenarios</p>
            ) : (
              myScenarios.map((s) => renderScenarioCard(s, true))
            )}
          </>
        )}

        {activeTab === 'public' && (
          <>
            {loadingSaved ? (
              <p className="text-xs text-gray-500 text-center py-4">Loading...</p>
            ) : publicScenarios.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No public scenarios</p>
            ) : (
              publicScenarios.map((s) => renderScenarioCard(s, true))
            )}
          </>
        )}

        {/* Import Button */}
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
              // @ts-ignore
              const file = e.target?.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const content = event.target?.result;
                    if (typeof content !== 'string') return;
                    const scenario = JSON.parse(content);
                    onImportScenario(scenario);
                  } catch (err) {
                    alert('Invalid scenario file');
                  }
                };
                reader.readAsText(file);
              }
            };
            input.click();
          }}
          className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 text-blue-400 text-xs font-bold tracking-wider rounded transition-colors flex items-center justify-center gap-2"
        >
          {/* @ts-ignore */}
          <Upload className="w-3 h-3" />
          IMPORT SCENARIO
        </button>
      </div>
    </div>
  );
}