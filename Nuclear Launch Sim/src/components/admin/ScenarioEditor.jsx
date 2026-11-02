// @ts-nocheck
import * as React from 'react';
const { useState, useEffect } = React;
import { 
  Save, X, Target, Zap, Cloud, 
  Plus, Trash2, FileText, CheckCircle
} from 'lucide-react';
{/* @ts-ignore */}
import { Input } from "../../components/ui/input";
{/* @ts-ignore */}
import { Textarea } from "../../components/ui/textarea";
{/* @ts-ignore */}
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
{/* @ts-ignore */}
import { Switch } from "../../components/ui/switch";

const FAULT_TYPES = [
  { id: 'HARD_FAILURE', name: 'Hard Failure', color: 'text-red-400' },
  { id: 'INTERMITTENT', name: 'Intermittent', color: 'text-orange-400' },
  { id: 'SENSOR_DRIFT', name: 'Sensor Drift', color: 'text-yellow-400' },
  { id: 'LOGIC_ERROR', name: 'Logic Error', color: 'text-amber-400' }
];

const SUBSYSTEMS = [
  { id: 'reactor', name: 'Reactor Core' },
  { id: 'targeting', name: 'Targeting System' },
  { id: 'comms', name: 'Communications' },
  { id: 'guidance', name: 'Guidance Computer' },
  { id: 'datalink', name: 'Data Link' },
  { id: 'power', name: 'Power Distribution' }
];

const WEATHER_OPTIONS = [
  { id: 'clear', name: 'Clear' },
  { id: 'cloudy', name: 'Cloudy' },
  { id: 'rain', name: 'Rain' },
  { id: 'storm', name: 'Storm' },
  { id: 'wind', name: 'High Wind' }
];

const TIME_OPTIONS = [
  { id: 'dawn', name: 'Dawn' },
  { id: 'day', name: 'Day' },
  { id: 'dusk', name: 'Dusk' },
  { id: 'night', name: 'Night' }
];

export default function ScenarioEditor({ scenario, onSave, onCancel, subsystems = SUBSYSTEMS }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'medium',
    category: 'training',
    objectives: [],
    faultConfig: {},
    environmentConfig: {
      weather: 'clear',
      timePeriod: 'day',
      temperature: 22
    },
    timeLimit: 0,
    targetCoords: { lat: '', lon: '' },
    trainingCodes: ['', ''],
    successCriteria: {
      maxErrors: 3,
      maxTime: 600,
      requiredPhase: 5
    },
    isPublic: false
  });

  const [newObjective, setNewObjective] = useState('');
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    if (scenario) {
      setFormData({
        ...formData,
        ...scenario,
        objectives: scenario.objectives || [],
        faultConfig: scenario.faultConfig || {},
        environmentConfig: scenario.environmentConfig || { weather: 'clear', timePeriod: 'day', temperature: 22 },
        targetCoords: scenario.targetCoords || { lat: '', lon: '' },
        trainingCodes: scenario.trainingCodes || ['', ''],
        successCriteria: scenario.successCriteria || { maxErrors: 3, maxTime: 600, requiredPhase: 5 }
      });
    }
  }, [scenario]);

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  const addObjective = () => {
    if (!newObjective.trim()) return;
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, newObjective.trim()]
    }));
    setNewObjective('');
  };

  const removeObjective = (index) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }));
  };

  const updateFault = (subsystemId, faultType, probability = 1.0) => {
    if (faultType === 'none') {
      const newConfig = { ...formData.faultConfig };
      delete newConfig[subsystemId];
      setFormData(prev => ({ ...prev, faultConfig: newConfig }));
    } else {
      setFormData(prev => ({
        ...prev,
        faultConfig: {
          ...prev.faultConfig,
          [subsystemId]: { type: faultType, probability }
        }
      }));
    }
  };

  const sections = [
    /** @type {any} */
    { id: 'basic', label: 'Basic Info', icon: FileText },
    /** @type {any} */
    { id: 'objectives', label: 'Objectives', icon: Target },
    /** @type {any} */
    { id: 'faults', label: 'Fault Config', icon: Zap },
    /** @type {any} */
    { id: 'environment', label: 'Environment', icon: Cloud },
    /** @type {any} */
    { id: 'criteria', label: 'Success Criteria', icon: CheckCircle }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#0d0d14] border border-[#2a2a3e] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1a1a2e] border-b border-[#2a2a3e] flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-200">
            {scenario ? 'Edit Scenario' : 'Create New Scenario'}
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-300">
            {/* @ts-ignore */}
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-4 py-2 bg-[#12121a] border-b border-[#2a2a3e] flex gap-1 overflow-x-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-bold whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {/* @ts-ignore */}
                {/* @ts-ignore */}
                <Icon className="w-3 h-3" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Basic Info */}
          {activeSection === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Scenario Name *</label>
                {/* @ts-ignore */}
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter scenario name..."
                  className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Description</label>
                {/* @ts-ignore */}
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the scenario and training objectives..."
                  className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200 h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Difficulty</label>
                  {/* @ts-ignore */}
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty: v }))}
                  >
                    <SelectTrigger className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="extreme">Extreme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Category</label>
                  {/* @ts-ignore */}
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Time Limit (seconds, 0 = no limit)</label>
                  {/* @ts-ignore */}
                  <Input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 0 }))}
                    className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200"
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  {/* @ts-ignore */}
                  <Switch
                    checked={formData.isPublic}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, isPublic: v }))}
                  />
                  <label className="text-xs text-gray-400">Share publicly</label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Target Latitude</label>
                  {/* @ts-ignore */}
                  <Input
                    value={formData.targetCoords.lat}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      targetCoords: { ...prev.targetCoords, lat: e.target.value }
                    }))}
                    placeholder="45.0000"
                    className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Target Longitude</label>
                  {/* @ts-ignore */}
                  <Input
                    value={formData.targetCoords.lon}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      targetCoords: { ...prev.targetCoords, lon: e.target.value }
                    }))}
                    placeholder="90.0000"
                    className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Training Code 1</label>
                  {/* @ts-ignore */}
                  <Input
                    value={formData.trainingCodes[0]}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      trainingCodes: [e.target.value, prev.trainingCodes[1]]
                    }))}
                    placeholder="ALPHA-7742"
                    className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Training Code 2</label>
                  {/* @ts-ignore */}
                  <Input
                    value={formData.trainingCodes[1]}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      trainingCodes: [prev.trainingCodes[0], e.target.value]
                    }))}
                    placeholder="BRAVO-9918"
                    className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Objectives */}
          {activeSection === 'objectives' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {/* @ts-ignore */}
                <Input
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Add a mission objective..."
                  className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200"
                  onKeyDown={(e) => e.key === 'Enter' && addObjective()}
                />
                <button
                  onClick={addObjective}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                >
                  {/* @ts-ignore */}
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {formData.objectives.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No objectives defined yet.</p>
                ) : (
                  formData.objectives.map((obj, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-[#1a1a2e] border border-[#2a2a3e] rounded"
                    >
                      {/* @ts-ignore */}
                      {/* @ts-ignore */}
                      <Target className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="flex-1 text-sm text-gray-300">{obj}</span>
                      <button
                        onClick={() => removeObjective(idx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        {/* @ts-ignore */}
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Fault Configuration */}
          {activeSection === 'faults' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-4">Configure system faults to inject during the mission.</p>
              
              {subsystems.map((sub) => {
                const currentFault = formData.faultConfig[sub.id];
                return (
                  <div 
                    key={sub.id}
                    className={`p-3 rounded border ${
                      currentFault ? 'bg-orange-500/10 border-orange-500/30' : 'bg-[#1a1a2e] border-[#2a2a3e]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-200">{sub.name}</span>
                      {/* @ts-ignore */}
                      <Select
                        value={currentFault?.type || 'none'}
                        onValueChange={(v) => updateFault(sub.id, v)}
                      >
                        <SelectTrigger className="w-40 bg-[#0a0a0f] border-[#2a2a3e] text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Fault</SelectItem>
                          {FAULT_TYPES.map((ft) => (
                            <SelectItem key={ft.id} value={ft.id}>
                              <span className={ft.color}>{ft.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {currentFault?.type === 'INTERMITTENT' && (
                      <div className="mt-2">
                        <label className="text-xs text-gray-500">
                          Failure Probability: {Math.round((currentFault.probability || 1) * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={currentFault.probability || 1}
                          onChange={(e) => updateFault(sub.id, 'INTERMITTENT', parseFloat(e.target.value))}
                          className="w-full mt-1"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Environment */}
          {activeSection === 'environment' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Weather Condition</label>
                {/* @ts-ignore */}
                <Select
                  value={formData.environmentConfig.weather}
                  onValueChange={(v) => setFormData(prev => ({
                    ...prev,
                    environmentConfig: { ...prev.environmentConfig, weather: v }
                  }))}
                >
                  <SelectTrigger className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEATHER_OPTIONS.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Time Period</label>
                {/* @ts-ignore */}
                <Select
                  value={formData.environmentConfig.timePeriod}
                  onValueChange={(v) => setFormData(prev => ({
                    ...prev,
                    environmentConfig: { ...prev.environmentConfig, timePeriod: v }
                  }))}
                >
                  <SelectTrigger className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Temperature: {formData.environmentConfig.temperature}°C
                </label>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  value={formData.environmentConfig.temperature}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    environmentConfig: { ...prev.environmentConfig, temperature: parseInt(e.target.value) }
                  }))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Success Criteria */}
          {activeSection === 'criteria' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Maximum Errors Allowed</label>
                {/* @ts-ignore */}
                <Input
                  type="number"
                  value={formData.successCriteria.maxErrors}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    successCriteria: { ...prev.successCriteria, maxErrors: parseInt(e.target.value) || 0 }
                  }))}
                  className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Maximum Time (seconds)</label>
                {/* @ts-ignore */}
                <Input
                  type="number"
                  value={formData.successCriteria.maxTime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    successCriteria: { ...prev.successCriteria, maxTime: parseInt(e.target.value) || 0 }
                  }))}
                  className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Required Phase to Complete</label>
                {/* @ts-ignore */}
                <Select
                  value={String(formData.successCriteria.requiredPhase)}
                  onValueChange={(v) => setFormData(prev => ({
                    ...prev,
                    successCriteria: { ...prev.successCriteria, requiredPhase: parseInt(v) }
                  }))}
                >
                  <SelectTrigger className="bg-[#0a0a0f] border-[#2a2a3e] text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Phase 1 - Diagnostics</SelectItem>
                    <SelectItem value="2">Phase 2 - Authentication</SelectItem>
                    <SelectItem value="3">Phase 3 - Validation</SelectItem>
                    <SelectItem value="4">Phase 4 - Key Authorization</SelectItem>
                    <SelectItem value="5">Phase 5 - Launch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0a0a0f] border-t border-[#2a2a3e] flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wider rounded transition-colors flex items-center gap-2"
          >
            {/* @ts-ignore */}
            <Save className="w-4 h-4" />
            {scenario ? 'Update Scenario' : 'Create Scenario'}
          </button>
        </div>
      </div>
    </div>
  );
}