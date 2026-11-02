import * as React from 'react';
const { useState, useEffect } = React;
import { dataProvider as base44 } from '../../components/data/DataProvider';
import { 
  History, GitBranch, RotateCcw, Eye, Clock, User,
  ChevronRight, X, Diff
} from 'lucide-react';
// @ts-ignore
import { motion, AnimatePresence } from 'framer-motion';

/**
 * @param {Object} props
 * @param {any} props.scenario
 * @param {import('react').MouseEventHandler<HTMLButtonElement>} [props.onRevert]
 * @param {import('react').MouseEventHandler<HTMLButtonElement>} props.onClose
 * @param {Function} [props.addLog]
 */
export default function ScenarioVersionHistory({ 
  scenario, 
  onRevert, 
  onClose,
  addLog 
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareVersion, setCompareVersion] = useState(null);

  useEffect(() => {
    loadVersions();
  }, [scenario]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      // Get all versions of this scenario (by parentScenarioId or same name)
      const parentId = scenario.parentScenarioId || scenario.id;
      const allVersions = await base44.entities.MissionScenario.filter(
        { 
          $or: [
            { id: parentId },
            { parentScenarioId: parentId }
          ]
        },
        '-version',
        50
      );
      
      // If no versions found with parentId, get by name
      if (allVersions.length <= 1) {
        const byName = await base44.entities.MissionScenario.filter(
          { name: scenario.name },
          '-version',
          50
        );
        setVersions(byName);
      } else {
        setVersions(allVersions);
      }
    } catch (err) {
      console.error('Failed to load versions:', err);
      setVersions([scenario]);
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (version) => {
    if (!window.confirm(`Revert to version ${version.version}? This will create a new version.`)) return;
    
    try {
      // Create new version based on old one
      const newVersion = {
        ...version,
        id: undefined,
        version: (versions[0]?.version || 1) + 1,
        parentScenarioId: scenario.parentScenarioId || scenario.id,
        versionNotes: `Reverted to version ${version.version}`,
        isLatestVersion: true,
        created_date: undefined,
        updated_date: undefined
      };
      
      // Mark current latest as not latest
      if (versions[0]?.isLatestVersion) {
        await base44.entities.MissionScenario.update(versions[0].id, { isLatestVersion: false });
      }
      
      const created = await base44.entities.MissionScenario.create(newVersion);
      addLog?.('success', `Reverted to version ${version.version}`, true);
      onRevert?.(created);
      loadVersions();
    } catch (err) {
      addLog?.('error', `Failed to revert: ${err.message}`, true);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleString();
  };

  const getDiffSummary = (v1, v2) => {
    const changes = [];
    
    if (v1.description !== v2.description) changes.push('description');
    if (v1.difficulty !== v2.difficulty) changes.push('difficulty');
    if (JSON.stringify(v1.objectives) !== JSON.stringify(v2.objectives)) changes.push('objectives');
    if (JSON.stringify(v1.faultConfig) !== JSON.stringify(v2.faultConfig)) changes.push('fault config');
    if (JSON.stringify(v1.environmentConfig) !== JSON.stringify(v2.environmentConfig)) changes.push('environment');
    if (JSON.stringify(v1.successCriteria) !== JSON.stringify(v2.successCriteria)) changes.push('success criteria');
    
    return changes;
  };

  return (
    <AnimatePresence>
      {/* @ts-ignore */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        {/* @ts-ignore */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-3xl bg-[#0d0d14] border border-[#2a2a3e] rounded-xl overflow-hidden max-h-[80vh] flex flex-col"
        >
        {/* Header */}
        <div className="px-4 py-3 bg-[#1a1a2e] border-b border-[#2a2a3e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* @ts-ignore */}
            <History className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-gray-200">Version History</h2>
              <p className="text-xs text-gray-500">{scenario.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            {/* @ts-ignore */}
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500 text-sm">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No version history available</div>
          ) : (
            <div className="space-y-3">
              {/* Compare Mode Toggle */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400">{versions.length} version(s)</span>
                <button
                  onClick={() => {
                    setComparing(!comparing);
                    setCompareVersion(null);
                  }}
                   className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                    comparing 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'bg-[#1a1a2e] text-gray-400 border border-[#2a2a3e] hover:text-gray-200'
                  }`}
                >
                  {/* @ts-ignore */}
                  <Diff className="w-3 h-3 inline mr-1" />
                  {comparing ? 'Exit Compare' : 'Compare Versions'}
                </button>
              </div>

              {/* Version List */}
              {versions.map((version, idx) => {
                const isLatest = version.isLatestVersion || idx === 0;
                const isCurrent = version.id === scenario.id;
                const isCompareSelected = compareVersion?.id === version.id;
                
                return (
                  <div
                    key={version.id}
                    className={`p-3 rounded border transition-colors ${
                      isCurrent 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : isCompareSelected
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-[#12121a] border-[#2a2a3e] hover:border-[#3a3a4e]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {/* @ts-ignore */}
                          <GitBranch className="w-3 h-3 text-gray-500" />
                          <span className="text-sm font-bold text-gray-200">
                            Version {version.version || 1}
                          </span>
                          {isLatest && (
                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                              Latest
                            </span>
                          )}
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                              Current
                            </span>
                          )}
                        </div>
                        
                        {version.versionNotes && (
                          <p className="text-xs text-gray-400 mb-2">{version.versionNotes}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            {/* @ts-ignore */}
                            <Clock className="w-3 h-3" />
                            {formatDate(version.created_date)}
                          </span>
                          {version.created_by && (
                            <span className="flex items-center gap-1">
                              {/* @ts-ignore */}
                              <User className="w-3 h-3" />
                              {version.created_by}
                            </span>
                          )}
                        </div>

                        {/* Diff Summary */}
                        {comparing && compareVersion && compareVersion.id !== version.id && (
                          <div className="mt-2 pt-2 border-t border-[#2a2a3e]">
                            <span className="text-xs text-gray-500">Changes: </span>
                            {getDiffSummary(version, compareVersion).map((change, i) => (
                              <span key={i} className="text-xs text-amber-400 mr-2">{change}</span>
                            ))}
                            {getDiffSummary(version, compareVersion).length === 0 && (
                              <span className="text-xs text-green-400">No changes</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {comparing ? (
                          <button
                            onClick={() => setCompareVersion(isCompareSelected ? null : version)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              isCompareSelected
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-[#1a1a2e] text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            {isCompareSelected ? 'Selected' : 'Select'}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setSelectedVersion(selectedVersion?.id === version.id ? null : version)}
                              className="p-1.5 hover:bg-blue-500/20 rounded text-blue-400"
                              title="View Details"
                            >
                              {/* @ts-ignore */}
                              <Eye className="w-3 h-3" />
                            </button>
                            {!isCurrent && (
                              <button
                                onClick={() => handleRevert(version)}
                                className="p-1.5 hover:bg-amber-500/20 rounded text-amber-400"
                                title="Revert to this version"
                              >
                                {/* @ts-ignore */}
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {selectedVersion?.id === version.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 pt-3 border-t border-[#2a2a3e] space-y-2 overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Difficulty:</span>
                              <span className="text-gray-300 ml-2">{version.difficulty}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Category:</span>
                              <span className="text-gray-300 ml-2">{version.category}</span>
                            </div>
                          </div>
                          
                          {version.objectives?.length > 0 && (
                            <div className="text-xs">
                              <span className="text-gray-500">Objectives:</span>
                              <ul className="mt-1 space-y-0.5">
                                {version.objectives.map((obj, i) => (
                                  <li key={i} className="text-gray-400 flex items-center gap-1">
                                    {/* @ts-ignore */}
                                    <ChevronRight className="w-3 h-3" />
                                    {obj}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {Object.keys(version.faultConfig || {}).length > 0 && (
                            <div className="text-xs">
                              <span className="text-gray-500">Faults:</span>
                              <span className="text-orange-400 ml-2">
                                {Object.keys(version.faultConfig).length} configured
                              </span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#0a0a0f] border-t border-[#2a2a3e] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1a1a2e] hover:bg-[#252540] border border-[#2a2a3e] text-gray-400 text-xs font-bold rounded transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);
}