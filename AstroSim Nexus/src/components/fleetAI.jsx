import { base44 } from '../api/base44Client';

// Ship role behaviors and tactical priorities
const roleProfiles = {
  'Flagship': {
    preferredTargets: ['Flagship', 'Vanguard', 'Support'],
    aggressiveness: 0.7,
    retreatThreshold: 40,
    formationPosition: 'center'
  },
  'Vanguard': {
    preferredTargets: ['Vanguard', 'Escort', 'Flanker'],
    aggressiveness: 0.9,
    retreatThreshold: 25,
    formationPosition: 'front'
  },
  'Flanker': {
    preferredTargets: ['Support', 'Escort', 'Reserve'],
    aggressiveness: 0.8,
    retreatThreshold: 30,
    formationPosition: 'side'
  },
  'Escort': {
    preferredTargets: ['Flanker', 'Vanguard', 'Escort'],
    aggressiveness: 0.6,
    retreatThreshold: 35,
    formationPosition: 'midline'
  },
  'Support': {
    preferredTargets: ['Escort', 'Reserve', 'Support'],
    aggressiveness: 0.4,
    retreatThreshold: 50,
    formationPosition: 'rear'
  },
  'Reserve': {
    preferredTargets: ['Reserve', 'Support', 'Escort'],
    aggressiveness: 0.5,
    retreatThreshold: 45,
    formationPosition: 'rear'
  }
};

// Formation modifiers
const formationBonuses = {
  'Line': { offense: 1.1, defense: 0.9, speed: 1.0 },
  'Wedge': { offense: 1.2, defense: 0.8, speed: 1.1 },
  'Screen': { offense: 0.9, defense: 1.2, speed: 0.9 },
  'Box': { offense: 1.0, defense: 1.1, speed: 0.9 },
  'Sphere': { offense: 0.95, defense: 1.15, speed: 0.85 }
};

export const getFleetComposition = async (fleetId) => {
  const assignments = await base44.entities.FleetAssignment.filter({ fleet_id: fleetId });
  const shipIds = assignments.map(a => a.ship_id);
  
  const ships = [];
  for (const shipId of shipIds) {
    const ship = await base44.entities.Ship.filter({ id: shipId });
    if (ship && ship.length > 0) {
      const assignment = assignments.find(a => a.ship_id === shipId);
      ships.push({ ...ship[0], role: assignment.role, position: assignment.position_index });
    }
  }
  
  return ships.sort((a, b) => a.position - b.position);
};

export const selectTargetWithRole = (attackingShip, potentialTargets, attackerRole, fleetMorale) => {
  if (!potentialTargets || potentialTargets.length === 0) return null;
  
  const roleProfile = roleProfiles[attackerRole] || roleProfiles['Escort'];
  
  const scoredTargets = potentialTargets.map(target => {
    let score = 0;
    
    // Role preference
    const targetRole = target.role || 'Escort';
    if (roleProfile.preferredTargets.includes(targetRole)) {
      score += 50;
    }
    
    // Target weakened ships
    const hullPercent = target.current_hull / 100;
    score += (1 - hullPercent) * 30;
    
    // Prioritize low morale targets
    if (fleetMorale > 70 && hullPercent < 0.5) {
      score += 20;
    }
    
    // Threat assessment - favor high-damage ships
    score += (target.damage_dealt || 0) / 10;
    
    // Aggressiveness modifier
    score *= roleProfile.aggressiveness;
    
    return { target, score };
  });
  
  scoredTargets.sort((a, b) => b.score - a.score);
  return scoredTargets[0]?.target;
};

export const shouldRetreat = (ship, role, fleetMorale, enemyFleetStrength) => {
  const roleProfile = roleProfiles[role] || roleProfiles['Escort'];
  const hullPercent = (ship.current_hull / 100) * 100;
  
  // Role-based retreat threshold
  if (hullPercent < roleProfile.retreatThreshold) {
    return true;
  }
  
  // Fleet morale affects retreat decision
  if (fleetMorale < 30 && hullPercent < 60) {
    return true;
  }
  
  // Overwhelming enemy force
  if (enemyFleetStrength > 2.0 && fleetMorale < 50) {
    return true;
  }
  
  return false;
};

export const calculateFleetStrength = (ships) => {
  return ships.reduce((total, ship) => {
    const hullFactor = (ship.current_hull || 100) / 100;
    const basePower = 100;
    return total + (basePower * hullFactor);
  }, 0);
};

export const getFormationModifiers = (formation) => {
  return formationBonuses[formation] || formationBonuses['Line'];
};

export const coordinateFleetAttack = async (fleet, attackerShips, defenderShips) => {
  const formationMods = getFormationModifiers(fleet.formation);
  const actions = [];
  
  // Group ships by role
  const roleGroups = {};
  for (const ship of attackerShips) {
    const role = ship.role || 'Escort';
    if (!roleGroups[role]) roleGroups[role] = [];
    roleGroups[role].push(ship);
  }
  
  // Vanguard attacks first
  if (roleGroups['Vanguard']) {
    for (const ship of roleGroups['Vanguard']) {
      const target = selectTargetWithRole(ship, defenderShips, 'Vanguard', fleet.morale);
      if (target) {
        actions.push({
          ship,
          target,
          damageModifier: formationMods.offense * 1.1,
          priority: 1
        });
      }
    }
  }
  
  // Flankers target sides
  if (roleGroups['Flanker']) {
    const supportTargets = defenderShips.filter(s => 
      s.role === 'Support' || s.role === 'Reserve'
    );
    for (const ship of roleGroups['Flanker']) {
      const target = selectTargetWithRole(ship, supportTargets.length > 0 ? supportTargets : defenderShips, 'Flanker', fleet.morale);
      if (target) {
        actions.push({
          ship,
          target,
          damageModifier: formationMods.offense * 1.15,
          priority: 2
        });
      }
    }
  }
  
  // Main line engagement
  if (roleGroups['Escort'] || roleGroups['Flagship']) {
    const mainShips = [...(roleGroups['Escort'] || []), ...(roleGroups['Flagship'] || [])];
    for (const ship of mainShips) {
      const target = selectTargetWithRole(ship, defenderShips, ship.role, fleet.morale);
      if (target) {
        actions.push({
          ship,
          target,
          damageModifier: formationMods.offense,
          priority: 3
        });
      }
    }
  }
  
  // Support provides covering fire
  if (roleGroups['Support']) {
    for (const ship of roleGroups['Support']) {
      const weakestTarget = defenderShips.reduce((weakest, current) => 
        (current.current_hull < weakest.current_hull) ? current : weakest
      );
      if (weakestTarget) {
        actions.push({
          ship,
          target: weakestTarget,
          damageModifier: formationMods.offense * 0.8,
          priority: 4
        });
      }
    }
  }
  
  return actions.sort((a, b) => a.priority - b.priority);
};

export const updateFleetMorale = async (fleet, combatResult) => {
  let moraleChange = 0;
  
  if (combatResult.shipsLost > 0) {
    moraleChange -= combatResult.shipsLost * 10;
  }
  
  if (combatResult.enemyShipsDestroyed > 0) {
    moraleChange += combatResult.enemyShipsDestroyed * 5;
  }
  
  if (combatResult.damageDealt > combatResult.damageTaken * 1.5) {
    moraleChange += 10;
  } else if (combatResult.damageTaken > combatResult.damageDealt * 1.5) {
    moraleChange -= 10;
  }
  
  const newMorale = Math.max(0, Math.min(100, fleet.morale + moraleChange));
  
  await base44.entities.Fleet.update(fleet.id, { morale: newMorale });
  
  return newMorale;
};

export const requestReinforcements = async (fleet, nearbyFleets) => {
  if (fleet.morale < 40) {
    const availableFleets = nearbyFleets.filter(f => 
      f.faction_id === fleet.faction_id && 
      f.status === 'Active' && 
      f.id !== fleet.id
    );
    
    if (availableFleets.length > 0) {
      const closestFleet = availableFleets[0];
      await base44.entities.Fleet.update(closestFleet.id, {
        task: 'Defense',
        target_colony_id: fleet.target_colony_id,
        status: 'In Transit'
      });
      
      return closestFleet;
    }
  }
  
  return null;
};