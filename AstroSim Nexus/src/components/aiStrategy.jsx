import { base44 } from '../api/base44Client';

// Calculate economic stress factor
export const calculateEconomicStressFactor = async (faction, colonies, inventory) => {
  const creditDeficit = Math.max(0, 5000 - faction.credits) / 5000;
  
  const factionColonies = colonies.filter(c => c.owner_faction_id === faction.id);
  const factionInventory = inventory.filter(inv => 
    factionColonies.some(col => col.id === inv.colony_id)
  );
  
  const avgInventory = factionInventory.length > 0 
    ? factionInventory.reduce((sum, inv) => sum + inv.quantity, 0) / factionInventory.length 
    : 0;
  
  const resourceScarcity = Math.max(0, 1 - (avgInventory / 1000));
  
  return creditDeficit + resourceScarcity;
};

// Calculate threat pressure factor
export const calculateThreatPressureFactor = async (faction, threats, colonies, agreements) => {
  const factionColonies = colonies.filter(c => c.owner_faction_id === faction.id);
  const activeThreats = threats.filter(t => 
    t.active && factionColonies.some(col => col.id === t.colony_id)
  );
  
  const avgThreatLevel = activeThreats.length > 0
    ? activeThreats.reduce((sum, t) => sum + t.severity, 0) / activeThreats.length
    : 0;
  
  const hostileAgreements = agreements.filter(a => 
    (a.faction_a_id === faction.id || a.faction_b_id === faction.id) &&
    a.type === 'War' &&
    a.status === 'Active'
  );
  
  const diplomaticHostility = hostileAgreements.length * 20;
  
  return (avgThreatLevel + diplomaticHostility) / 100;
};

// Calculate opportunity index
export const calculateOpportunityIndex = async (faction, colonies) => {
  const factionColonies = colonies.filter(c => c.owner_faction_id === faction.id);
  
  const avgStability = factionColonies.length > 0
    ? factionColonies.reduce((sum, c) => sum + c.stability_index, 0) / factionColonies.length
    : 50;
  
  const creditSurplus = Math.max(0, faction.credits - 5000) / 10000;
  const stabilityBonus = (avgStability - 50) / 100;
  
  return (stabilityBonus + creditSurplus) / 100;
};

// Update dynamic priorities
export const updateDynamicPriorities = async (faction, profile, gameState) => {
  const economicStress = await calculateEconomicStressFactor(
    faction, 
    gameState.colonies, 
    gameState.inventory
  );
  
  const threatPressure = await calculateThreatPressureFactor(
    faction,
    gameState.threats,
    gameState.colonies,
    gameState.agreements
  );
  
  const opportunity = await calculateOpportunityIndex(faction, gameState.colonies);
  
  const economicWeight = profile.economic_priority_weight * (1 + economicStress);
  const militaryWeight = profile.military_priority_weight * (1 + threatPressure);
  const expansionWeight = profile.expansion_priority_weight * (1 + opportunity);
  
  const total = economicWeight + militaryWeight + expansionWeight;
  
  return {
    economic: economicWeight / total,
    military: militaryWeight / total,
    expansion: expansionWeight / total,
    economicStress,
    threatPressure,
    opportunity
  };
};

// Determine strategic mode
export const determineStrategicMode = (priorities) => {
  if (priorities.military > 0.5) return 'Defensive';
  if (priorities.economic > 0.5) return 'Economic';
  if (priorities.expansion > 0.5) return 'Expansion';
  if (priorities.economicStress > 1.5) return 'Retrenchment';
  return 'TechCatchUp';
};

// Calculate research priority score
export const calculateResearchPriorityScore = async (research, faction, priorities, rivals) => {
  const categoryWeights = {
    'Energy': priorities.economic,
    'Defense': priorities.military,
    'Logistics': priorities.expansion,
    'Economics': priorities.economic,
    'Expansion': priorities.expansion
  };
  
  const categoryAlignment = categoryWeights[research.category] || 0.3;
  
  const rivalResearch = rivals.filter(r => r.category === research.category);
  const techGap = Math.max(0, rivalResearch.length - 1) * 0.2;
  
  const progressRatio = research.progress / research.completion_threshold;
  const nearCompletion = progressRatio > 0.7 ? 0.3 : 0;
  
  return (categoryAlignment * 1.5) + techGap + nearCompletion;
};

// Select optimal research
export const selectOptimalResearch = async (faction, priorities, currentTurn) => {
  const allResearch = await base44.entities.ResearchProject.filter({ faction_id: faction.id });
  const inProgress = allResearch.filter(r => r.progress > 0 && r.progress < r.completion_threshold);
  
  if (inProgress.length > 0) {
    return inProgress[0]; // Continue existing research
  }
  
  const available = allResearch.filter(r => r.progress === 0);
  if (available.length === 0) return null;
  
  const allFactions = await base44.entities.Faction.list();
  const rivals = allFactions.filter(f => f.id !== faction.id);
  const rivalResearch = await Promise.all(
    rivals.map(r => base44.entities.ResearchProject.filter({ faction_id: r.id }))
  );
  const flatRivals = rivalResearch.flat();
  
  let bestResearch = null;
  let bestScore = -1;
  
  for (const research of available) {
    const score = await calculateResearchPriorityScore(research, faction, priorities, flatRivals);
    if (score > bestScore) {
      bestScore = score;
      bestResearch = research;
    }
  }
  
  return bestResearch;
};

// Calculate AI action score
export const calculateActionScore = (action, priorities, memory) => {
  const baseScore = Math.random() * 50; // Some randomness
  
  const economicBonus = action.type === 'economic' ? priorities.economic * 100 : 0;
  const militaryBonus = action.type === 'military' ? priorities.military * 100 : 0;
  const expansionBonus = action.type === 'expansion' ? priorities.expansion * 100 : 0;
  
  const memoryBonus = memory ? memory.successful_expansion_rate * 20 : 0;
  
  return baseScore + economicBonus + militaryBonus + expansionBonus + memoryBonus;
};

// Update strategic memory
export const updateStrategicMemory = async (faction, memory, currentTurn, events) => {
  const recentEvents = events.filter(e => 
    e.source_id === faction.id && 
    e.event_type !== 'Turn'
  );
  
  const economicLosses = recentEvents.filter(e => 
    e.description.includes('loss') || e.description.includes('shortage')
  ).length;
  
  const militaryLosses = recentEvents.filter(e => 
    e.description.includes('threat') || e.description.includes('attack')
  ).length;
  
  const priorities = {
    economic: memory.recent_economic_losses > 2 ? 0.5 : 0.3,
    military: memory.recent_military_losses > 2 ? 0.5 : 0.3,
    expansion: 0.2
  };
  
  const newMode = determineStrategicMode(priorities);
  const modeChanged = newMode !== memory.current_strategic_mode;
  
  await base44.entities.FactionStrategicMemory.update(memory.id, {
    recent_economic_losses: economicLosses,
    recent_military_losses: militaryLosses,
    last_priority_shift_turn: modeChanged ? currentTurn : memory.last_priority_shift_turn,
    current_strategic_mode: newMode,
    mode_duration: modeChanged ? 0 : memory.mode_duration + 1
  });
};