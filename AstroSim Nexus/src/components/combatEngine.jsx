import { base44 } from '../api/base44Client';
import { calculateShipStats } from './shipUtils';
import { 
  getFleetComposition, 
  selectTargetWithRole, 
  shouldRetreat as shouldRoleRetreat,
  calculateFleetStrength,
  coordinateFleetAttack,
  getFormationModifiers
} from './fleetAI';

export const initiateCombat = async (attackerFactionId, defenderFactionId, locationColonyId, threatId = null) => {
  const encounter = await base44.entities.CombatEncounter.create({
    attacker_faction_id: attackerFactionId,
    defender_faction_id: defenderFactionId,
    location_colony_id: locationColonyId,
    threat_id: threatId,
    status: 'Active'
  });

  const attackerShips = await base44.entities.Ship.filter({ 
    owner_faction_id: attackerFactionId,
    status: 'Docked',
    current_colony_id: locationColonyId
  });

  const defenderShips = await base44.entities.Ship.filter({ 
    owner_faction_id: defenderFactionId,
    current_colony_id: locationColonyId
  });

  for (const ship of attackerShips.slice(0, 5)) {
    await base44.entities.CombatParticipant.create({
      encounter_id: encounter.id,
      ship_id: ship.id,
      side: 'Attacker',
      current_hull: 100,
      current_shields: ship.defense || 50
    });
  }

  for (const ship of defenderShips.slice(0, 5)) {
    await base44.entities.CombatParticipant.create({
      encounter_id: encounter.id,
      ship_id: ship.id,
      side: 'Defender',
      current_hull: 100,
      current_shields: ship.defense || 50
    });
  }

  return encounter;
};

export const selectTarget = async (attacker, participants, ships, attackerRole = null, fleetMorale = 70) => {
  const enemies = participants.filter(p => 
    p.side !== attacker.side && 
    p.status === 'Engaged'
  );

  if (enemies.length === 0) return null;

  // If role-based targeting is enabled
  if (attackerRole) {
    const attackerShip = ships.find(s => s.id === attacker.ship_id);
    const enemyTargets = enemies.map(e => ({
      ...e,
      ...ships.find(s => s.id === e.ship_id)
    }));
    
    const roleTarget = selectTargetWithRole(attackerShip, enemyTargets, attackerRole, fleetMorale);
    if (roleTarget) {
      return enemies.find(e => e.ship_id === roleTarget.id || e.ship_id === roleTarget.ship_id);
    }
  }

  // Fallback to standard targeting
  let target = null;
  let highestPriority = -1;

  for (const enemy of enemies) {
    const enemyShip = ships.find(s => s.id === enemy.ship_id);
    if (!enemyShip) continue;

    const lowHealthPriority = (100 - enemy.current_hull) / 100;
    const lowShieldPriority = (100 - enemy.current_shields) / 100;
    const speedThreat = (enemyShip.speed || 100) / 200;
    const damageThreat = (enemy.damage_dealt || 0) / 500;
    
    const priority = lowHealthPriority * 0.3 + lowShieldPriority * 0.2 + speedThreat * 0.2 + damageThreat * 0.3;

    if (priority > highestPriority) {
      highestPriority = priority;
      target = enemy;
    }
  }

  return target;
};

export const calculateDamage = (attackerShip, defenderShip, attackerParticipant) => {
  const baseAttack = 15 + (attackerShip.cargo_capacity || 1000) / 100;
  const speedBonus = (attackerShip.speed || 100) / 100;
  const defenseReduction = (defenderShip.defense || 50) / 200;
  
  const rawDamage = baseAttack * speedBonus * (1 - defenseReduction);
  const variance = 0.8 + Math.random() * 0.4;
  
  return Math.floor(rawDamage * variance);
};

export const applyDamage = async (participant, damage) => {
  let remainingDamage = damage;
  let newShields = participant.current_shields;
  let newHull = participant.current_hull;

  if (newShields > 0) {
    const shieldAbsorb = Math.min(newShields, remainingDamage);
    newShields -= shieldAbsorb;
    remainingDamage -= shieldAbsorb;
  }

  if (remainingDamage > 0) {
    newHull -= remainingDamage;
  }

  const newStatus = newHull <= 0 ? 'Destroyed' : participant.status;

  await base44.entities.CombatParticipant.update(participant.id, {
    current_shields: Math.max(0, newShields),
    current_hull: Math.max(0, newHull),
    damage_taken: participant.damage_taken + damage,
    status: newStatus
  });

  return { shields: newShields, hull: newHull, destroyed: newHull <= 0 };
};

export const checkMoraleAndRetreat = (participants, side, fleet = null) => {
  const sideTroops = participants.filter(p => p.side === side);
  const activeCount = sideTroops.filter(p => p.status === 'Engaged').length;
  const destroyedCount = sideTroops.filter(p => p.status === 'Destroyed').length;
  
  const lossRatio = destroyedCount / Math.max(sideTroops.length, 1);
  const avgHull = sideTroops.reduce((sum, p) => sum + p.current_hull, 0) / Math.max(sideTroops.length, 1);
  
  let morale = 100 - (lossRatio * 50 + (100 - avgHull) * 0.3);
  
  // Apply fleet morale bonus if available
  if (fleet && fleet.morale) {
    morale = (morale * 0.7) + (fleet.morale * 0.3);
  }
  
  // Role-based retreat checks
  let shouldRetreat = morale < 30 || activeCount === 0;
  
  if (fleet) {
    // Formation affects retreat threshold
    const formationMods = getFormationModifiers(fleet.formation);
    const retreatThreshold = 30 * (2 - formationMods.defense);
    shouldRetreat = morale < retreatThreshold || activeCount === 0;
  }
  
  return {
    morale: Math.max(0, Math.min(100, morale)),
    shouldRetreat
  };
};

export const executeCombatTurn = async (encounterId) => {
  const encounter = await base44.entities.CombatEncounter.filter({ id: encounterId });
  if (encounter.length === 0 || encounter[0].status !== 'Active') return null;

  const encounterData = encounter[0];
  const participants = await base44.entities.CombatParticipant.filter({ encounter_id: encounterId });
  const shipIds = participants.map(p => p.ship_id);
  const ships = await Promise.all(shipIds.map(id => base44.entities.Ship.filter({ id })));
  const flatShips = ships.flat();

  const activeParticipants = participants.filter(p => p.status === 'Engaged');
  const turnLogs = [];
  let attackerDamage = 0;
  let defenderDamage = 0;

  for (const participant of activeParticipants) {
    const ship = flatShips.find(s => s.id === participant.ship_id);
    if (!ship) continue;

    const target = await selectTarget(participant, participants, flatShips);
    if (!target) continue;

    const targetShip = flatShips.find(s => s.id === target.ship_id);
    const damage = calculateDamage(ship, targetShip, participant);

    const result = await applyDamage(target, damage);
    
    await base44.entities.CombatParticipant.update(participant.id, {
      damage_dealt: participant.damage_dealt + damage
    });

    if (participant.side === 'Attacker') attackerDamage += damage;
    else defenderDamage += damage;

    const logDesc = result.destroyed 
      ? `${ship.name} destroyed ${targetShip.name}!`
      : `${ship.name} dealt ${damage} damage to ${targetShip.name} (Hull: ${Math.floor(result.hull)}%, Shields: ${Math.floor(result.shields)}%)`;

    await base44.entities.CombatLog.create({
      encounter_id: encounterId,
      turn_number: encounterData.current_turn,
      action_type: result.destroyed ? 'Destroyed' : 'Attack',
      actor_ship_id: participant.ship_id,
      target_ship_id: target.ship_id,
      damage_amount: damage,
      description: logDesc
    });

    turnLogs.push(logDesc);
  }

  const updatedParticipants = await base44.entities.CombatParticipant.filter({ encounter_id: encounterId });
  
  const attackerMoraleCheck = checkMoraleAndRetreat(updatedParticipants, 'Attacker');
  const defenderMoraleCheck = checkMoraleAndRetreat(updatedParticipants, 'Defender');

  let newStatus = 'Active';
  if (attackerMoraleCheck.shouldRetreat && defenderMoraleCheck.shouldRetreat) {
    newStatus = 'Stalemate';
  } else if (attackerMoraleCheck.shouldRetreat) {
    newStatus = 'Defender Victory';
  } else if (defenderMoraleCheck.shouldRetreat) {
    newStatus = 'Attacker Victory';
  }

  await base44.entities.CombatEncounter.update(encounterId, {
    current_turn: encounterData.current_turn + 1,
    attacker_morale: attackerMoraleCheck.morale,
    defender_morale: defenderMoraleCheck.morale,
    total_attacker_damage: encounterData.total_attacker_damage + attackerDamage,
    total_defender_damage: encounterData.total_defender_damage + defenderDamage,
    status: newStatus
  });

  if (newStatus !== 'Active') {
    for (const p of updatedParticipants) {
      if (p.status === 'Engaged') {
        await base44.entities.CombatParticipant.update(p.id, { status: 'Victorious' });
      }
      if (p.status === 'Destroyed') {
        await base44.entities.Ship.update(p.ship_id, { status: 'Destroyed' });
      }
    }
  }

  await base44.entities.EventLog.create({
    timestamp: new Date().toISOString(),
    event_type: 'Turn',
    source_entity: 'CombatEncounter',
    source_id: encounterId,
    description: `Turn ${encounterData.current_turn}: Attacker dealt ${attackerDamage} dmg, Defender dealt ${defenderDamage} dmg. Status: ${newStatus}`,
    impact_score: attackerDamage + defenderDamage
  });

  return {
    turn: encounterData.current_turn,
    attackerDamage,
    defenderDamage,
    attackerMorale: attackerMoraleCheck.morale,
    defenderMorale: defenderMoraleCheck.morale,
    status: newStatus,
    logs: turnLogs
  };
};