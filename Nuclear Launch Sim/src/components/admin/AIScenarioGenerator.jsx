// @ts-nocheck
import * as React from 'react';
const { useState } = React;
import { Sparkles, FileText, Zap, AlertTriangle, Target, Clock, Loader2 } from 'lucide-react';
{/* @ts-ignore */}
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
{/* @ts-ignore */}
import { Input } from "../../components/ui/input";
{/* @ts-ignore */}
import { Textarea } from "../../components/ui/textarea";
import { dataProvider as base44 } from '../../components/data/DataProvider';

const SCENARIO_TEMPLATES = [
  {
    id: 'comms_failure',
    name: 'Communications Failure',
    description: 'Simulate complete communications blackout',
    faultConfig: { comms: { type: 'HARD_FAILURE', probability: 1.0 } },
    difficulty: 'medium'
  },
  {
    id: 'cascading_failure',
    name: 'Cascading System Failure',
    description: 'Multiple subsystems fail in sequence',
    faultConfig: { 
      reactor: { type: 'SENSOR_DRIFT', probability: 1.0 },
      power: { type: 'INTERMITTENT', probability: 0.7 },
      guidance: { type: 'LOGIC_ERROR', probability: 0.5 }
    },
    difficulty: 'hard'
  },
  {
    id: 'degraded_ops',
    name: 'Degraded Operations',
    description: 'All systems operating at reduced capacity',
    faultConfig: {
      reactor: { type: 'SENSOR_DRIFT', probability: 1.0 },
      targeting: { type: 'SENSOR_DRIFT', probability: 1.0 },
      comms: { type: 'SENSOR_DRIFT', probability: 1.0 },
      guidance: { type: 'SENSOR_DRIFT', probability: 1.0 },
      datalink: { type: 'SENSOR_DRIFT', probability: 1.0 },
      power: { type: 'SENSOR_DRIFT', probability: 1.0 }
    },
    difficulty: 'medium'
  },
  {
    id: 'timing_critical',
    name: 'Time-Critical Response',
    description: 'Fast-paced scenario requiring quick decisions',
    faultConfig: {},
    timeMultiplier: 0.5,
    difficulty: 'hard'
  },
  {
    id: 'perfect_conditions',
    name: 'Nominal Operations',
    description: 'All systems functioning normally',
    faultConfig: {},
    difficulty: 'easy'
  }
];

const DIFFICULTY_COLORS = {
  easy: 'text-green-400 bg-green-500/10 border-green-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  hard: 'text-red-400 bg-red-500/10 border-red-500/30'
};

export default function AIScenarioGenerator({ onCreateScenario, subsystems, addLog }) {
  const [mode, setMode] = useState('template'); // 'template', 'ai', 'custom'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [customConfig, setCustomConfig] = useState({
    name: '',
    description: '',
    difficulty: 'medium',
    targetOutcome: 'success',
    focusAreas: []
  });

  const handleTemplateSelect = (templateId) => {
    const template = SCENARIO_TEMPLATES.find(t => t.id === templateId);
    setSelectedTemplate(template);
  };

  const handleCreateFromTemplate = () => {
    if (!selectedTemplate) return;
    
    const scenario = {
      name: selectedTemplate.name,
      description: selectedTemplate.description,
      faultConfig: selectedTemplate.faultConfig,
      diagnosticOverrides: {},
      targetCoords: { lat: '45.0000', lon: '90.0000' },
      metadata: {
        source: 'template',
        templateId: selectedTemplate.id,
        difficulty: selectedTemplate.difficulty
      }
    };
    
    onCreateScenario(scenario);
    addLog('system', `Created scenario from template: ${selectedTemplate.name}`, true);
    setSelectedTemplate(null);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setAiGenerating(true);
    addLog('info', 'Generating AI scenario...', true);
    
    try {
      // @ts-ignore
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a training scenario generator for a strategic command simulator. Generate a realistic training scenario based on this request: "${aiPrompt}"

The simulator has these subsystems: reactor, targeting, comms, guidance, datalink, power.
Fault types available: HARD_FAILURE, INTERMITTENT (with probability 0-1), SENSOR_DRIFT, LOGIC_ERROR.

Generate a JSON scenario with this exact structure:
{
  "name": "Scenario Name",
  "description": "Detailed description of the training objective",
  "faultConfig": {
    "subsystemId": { "type": "FAULT_TYPE", "probability": 0.8 }
  },
  "difficulty": "easy|medium|hard",
  "trainingObjectives": ["objective1", "objective2"]
}

Be creative but realistic. Focus on training value.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            faultConfig: { type: "object" },
            difficulty: { type: "string" },
            trainingObjectives: { type: "array", items: { type: "string" } }
          },
          required: ["name", "description", "faultConfig", "difficulty"]
        }
      });

      const scenario = {
        name: response.name,
        description: response.description,
        faultConfig: response.faultConfig || {},
        diagnosticOverrides: {},
        targetCoords: { lat: '45.0000', lon: '90.0000' },
        metadata: {
          source: 'ai',
          prompt: aiPrompt,
          difficulty: response.difficulty,
          trainingObjectives: response.trainingObjectives
        }
      };

      onCreateScenario(scenario);
      addLog('success', `AI generated scenario: ${response.name}`, true);
      setAiPrompt('');
    } catch (err) {
      addLog('error', `AI generation failed: ${err.message}`, true);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] flex-shrink-0">
        <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
          Scenario Generator
        </span>
        <div className="flex gap-1">
          {['template', 'ai'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-1 text-xs rounded ${
                mode === m 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {m === 'template' ? 'Templates' : 'AI'}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {mode === 'template' && (
          <>
            <div className="space-y-2">
              {SCENARIO_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`w-full p-3 rounded border text-left transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'bg-blue-500/10 border-blue-500/50'
                      : 'bg-[#1a1a2e] border-[#2a2a3e] hover:border-[#3a3a4e]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-200">{template.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${DIFFICULTY_COLORS[template.difficulty]}`}>
                      {template.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{template.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-600">
                      {Object.keys(template.faultConfig).length} fault(s)
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {selectedTemplate && (
              <button
                onClick={handleCreateFromTemplate}
                className="w-full px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 text-green-400 text-xs font-bold tracking-wider rounded transition-colors flex items-center justify-center gap-2"
              >
                {/* @ts-ignore */}
                <FileText className="w-3 h-3" />
                CREATE FROM TEMPLATE
              </button>
            )}
          </>
        )}

        {mode === 'ai' && (
          <>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Describe your training scenario
              </label>
              {/* @ts-ignore */}
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Create a scenario where the operator must handle intermittent communications while managing a reactor warning..."
                className="bg-[#0a0a0f] border-[#2a2a3e] text-xs text-gray-200 h-24 resize-none"
              />
            </div>

            <div className="flex items-start gap-2 p-2 bg-purple-500/10 border border-purple-500/30 rounded">
              {/* @ts-ignore */}
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-purple-300">
                AI will analyze your request and generate appropriate fault configurations, difficulty settings, and training objectives.
              </p>
            </div>

            <button
              onClick={handleAIGenerate}
              disabled={!aiPrompt.trim() || aiGenerating}
              className="w-full px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 disabled:bg-gray-700 disabled:cursor-not-allowed border border-purple-600/50 text-purple-400 text-xs font-bold tracking-wider rounded transition-colors flex items-center justify-center gap-2"
            >
              {aiGenerating ? (
                <>
                  {/* @ts-ignore */}
                  <Loader2 className="w-3 h-3 animate-spin" />
                  GENERATING...
                </>
              ) : (
                <>
                  {/* @ts-ignore */}
                  <Sparkles className="w-3 h-3" />
                  GENERATE WITH AI
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}