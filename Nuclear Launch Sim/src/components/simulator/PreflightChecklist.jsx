import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, AlertTriangle, FileText, Target, Users, Shield, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_CHECKLIST = [
  { id: 'briefing', label: 'Review mission briefing', category: 'preparation', required: true },
  { id: 'auth_codes', label: 'Verify authentication codes are available', category: 'preparation', required: true },
  { id: 'comms_check', label: 'Confirm communication channels', category: 'systems', required: true },
  { id: 'target_coords', label: 'Target coordinates prepared', category: 'mission', required: true },
  { id: 'dual_officer', label: 'Dual officer authorization ready', category: 'authorization', required: true },
  { id: 'abort_procedure', label: 'Abort procedures understood', category: 'safety', required: true },
  { id: 'env_conditions', label: 'Environmental conditions reviewed', category: 'systems', required: false },
  { id: 'backup_systems', label: 'Backup systems status confirmed', category: 'systems', required: false }
];

const CATEGORIES = {
  preparation: { name: 'Preparation', icon: FileText, color: 'blue' },
  systems: { name: 'Systems', icon: Shield, color: 'cyan' },
  mission: { name: 'Mission', icon: Target, color: 'amber' },
  authorization: { name: 'Authorization', icon: Users, color: 'purple' },
  safety: { name: 'Safety', icon: AlertTriangle, color: 'red' }
};

export default function PreflightChecklist({ 
  scenario, 
  onComplete, 
  onCancel,
  environmentFactors 
}) {
  const [checkedItems, setCheckedItems] = useState({});
  const [customItems, setCustomItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [startTime] = useState(Date.now());

  const allItems = [...DEFAULT_CHECKLIST, ...customItems];
  const requiredItems = allItems.filter(item => item.required);
  const requiredChecked = requiredItems.every(item => checkedItems[item.id]);
  const totalChecked = Object.values(checkedItems).filter(Boolean).length;
  const progress = (totalChecked / allItems.length) * 100;

  const toggleItem = (itemId) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const addCustomItem = () => {
    if (!newItemText.trim()) return;
    
    const newItem = {
      id: `custom_${Date.now()}`,
      label: newItemText.trim(),
      category: 'preparation',
      required: false,
      custom: true
    };
    
    setCustomItems(prev => [...prev, newItem]);
    setNewItemText('');
  };

  const handleComplete = () => {
    const checklistData = {
      items: allItems.map(item => ({
        ...item,
        checked: !!checkedItems[item.id]
      })),
      completionTime: Date.now() - startTime,
      allRequiredComplete: requiredChecked
    };
    onComplete(checklistData);
  };

  const groupedItems = allItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl bg-[#0d0d14] border border-[#2a2a3e] rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-900/30 to-[#0d0d14] border-b border-[#2a2a3e]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-amber-400 tracking-wider">PRE-FLIGHT CHECKLIST</h2>
              <p className="text-xs text-gray-500 mt-1">
                {scenario ? `Scenario: ${scenario.name}` : 'Standard Operations'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-gray-300">
                {totalChecked}/{allItems.length}
              </div>
              <div className="text-xs text-gray-500">Items Complete</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={`h-full ${requiredChecked ? 'bg-green-500' : 'bg-amber-500'}`}
            />
          </div>
        </div>

        {/* Mission Briefing */}
        {scenario && (
          <div className="px-6 py-4 bg-[#12121a] border-b border-[#2a2a3e]">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mission Briefing</h3>
            <p className="text-sm text-gray-300">{scenario.description}</p>
            
            {scenario.metadata?.trainingObjectives && (
              <div className="mt-3">
                <h4 className="text-xs text-gray-500 mb-1">Training Objectives:</h4>
                <ul className="space-y-1">
                  {scenario.metadata.trainingObjectives.map((obj, idx) => (
                    <li key={idx} className="text-xs text-cyan-400 flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {scenario.metadata?.difficulty && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-500">Difficulty:</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  scenario.metadata.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                  scenario.metadata.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {scenario.metadata.difficulty.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Environment Warning */}
        {environmentFactors && environmentFactors.weather?.degradation > 0.1 && (
          <div className="px-6 py-3 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-400">
              Weather Advisory: {environmentFactors.weather.name} conditions may affect operations
            </span>
          </div>
        )}

        {/* Checklist Items */}
        <div className="px-6 py-4 max-h-[400px] overflow-y-auto space-y-4">
          {Object.entries(groupedItems).map(([categoryId, items]) => {
            const category = CATEGORIES[categoryId];
            const Icon = category?.icon || FileText;
            
            return (
              <div key={categoryId}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 text-${category?.color || 'gray'}-400`} />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {category?.name || categoryId}
                  </span>
                </div>
                
                <div className="space-y-1 ml-6">
                  {items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded border transition-all ${
                        checkedItems[item.id]
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-[#1a1a2e] border-[#2a2a3e] hover:border-[#3a3a4e]'
                      }`}
                    >
                      {checkedItems[item.id] ? (
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      )}
                      <span className={`text-sm flex-1 text-left ${
                        checkedItems[item.id] ? 'text-gray-300' : 'text-gray-400'
                      }`}>
                        {item.label}
                      </span>
                      {item.required && !checkedItems[item.id] && (
                        <span className="text-xs text-red-400">Required</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Add Custom Item */}
          <div className="pt-4 border-t border-[#2a2a3e]">
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                placeholder="Add custom checklist item..."
                className="flex-1 px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3e] rounded text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={addCustomItem}
                disabled={!newItemText.trim()}
                className="px-4 py-2 bg-[#1a1a2e] hover:bg-[#252540] disabled:opacity-50 border border-[#2a2a3e] text-gray-400 text-sm rounded transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0a0a0f] border-t border-[#2a2a3e] flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-3">
            {!requiredChecked && (
              <span className="text-xs text-orange-400">
                Complete all required items to proceed
              </span>
            )}
            <button
              onClick={handleComplete}
              disabled={!requiredChecked}
              className={`px-6 py-2 font-bold text-sm tracking-wider rounded transition-colors ${
                requiredChecked
                  ? 'bg-green-600 hover:bg-green-500 text-black'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              BEGIN MISSION
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}