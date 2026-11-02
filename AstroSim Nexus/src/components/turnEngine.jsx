import { base44 } from '../api/base44Client';
import { 
  updateDynamicPriorities, 
  determineStrategicMode, 
  selectOptimalResearch, 
  updateStrategicMemory 
} from './aiStrategy';
import { updateMarketPrices } from './marketEngine';

export const executeTurn = async () => {
  const startTime = Date.now();
  const events = [];

  try {
    const colonies = await base44.entities.Colony.list();
    const productionEvents = await executeProductionPhase(colonies);
    events.push(...productionEvents);

    const tradeEvents = await executeTradePhase();
    events.push(...tradeEvents);

    const marketEvents = await executeMarketPhase();
    events.push(...marketEvents);

    const economicEvents = await executeEconomicPhase();
    events.push(...economicEvents);

    const threatEvents = await executeThreatPhase();
    events.push(...threatEvents);

    const aiEvents = await executeAIPhase();
    events.push(...aiEvents);

    const maintenanceEvents = await executeMaintenancePhase();
    events.push(...maintenanceEvents);

    const duration = Date.now() - startTime;
    
    await base44.entities.EventLog.create({
      timestamp: new Date().toISOString(),
      event_type: 'Turn',
      source_entity: 'System',
      source_id: 'turn_engine',
      description: `Turn completed in ${duration}ms`,
      impact_score: 100
    });

    return { success: true, duration, events };
  } catch (error) {
    console.error('Turn execution failed:', error);
    return { success: false, error: error.message };
  }
};

const executeProductionPhase = async (colonies) => {
  const events = [];
  
  for (const colony of colonies) {
    const stabilityModifier = colony.stability_index / 100;
    const production = colony.energy_output * stabilityModifier;
    
    const resources = await base44.entities.Resource.filter({ category: 'Energy' });
    if (resources.length > 0) {
      const energyResource = resources[0];
      const inventory = await base44.entities.Inventory.filter({
        colony_id: colony.id,
        resource_id: energyResource.id
      });

      if (inventory.length > 0) {
        await base44.entities.Inventory.update(inventory[0].id, {
          quantity: inventory[0].quantity + production
        });
      } else {
        await base44.entities.Inventory.create({
          colony_id: colony.id,
          resource_id: energyResource.id,
          quantity: production
        });
      }

      events.push({
        type: 'Production',
        colony: colony.name,
        amount: production
      });
    }
  }

  return events;
};

const executeTradePhase = async () => {
  const events = [];
  const routes = await base44.entities.TradeRoute.filter({ active_status: true });

  for (const route of routes) {
    const ship = await base44.entities.Ship.filter({ id: route.assigned_ship_id });
    if (ship.length === 0 || ship[0].status !== 'Docked') continue;

    const shipData = ship[0];
    const fuelCost = route.distance * 0.1;

    if (shipData.fuel_level >= fuelCost) {
      await base44.entities.Ship.update(shipData.id, {
        fuel_level: shipData.fuel_level - fuelCost,
        status: 'In Transit'
      });

      const cargo = await base44.entities.CargoManifest.filter({ ship_id: shipData.id });
      for (const manifest of cargo) {
        const inventory = await base44.entities.Inventory.filter({
          colony_id: manifest.destination_colony_id,
          resource_id: manifest.resource_id
        });

        if (inventory.length > 0) {
          await base44.entities.Inventory.update(inventory[0].id, {
            quantity: inventory[0].quantity + manifest.quantity
          });
        } else {
          await base44.entities.Inventory.create({
            colony_id: manifest.destination_colony_id,
            resource_id: manifest.resource_id,
            quantity: manifest.quantity
          });
        }

        await base44.entities.CargoManifest.delete(manifest.id);
      }

      await base44.entities.Ship.update(shipData.id, {
        current_colony_id: route.destination_colony_id,
        status: 'Docked'
      });

      events.push({
        type: 'Trade',
        ship: shipData.name,
        route: route.id
      });
    }
  }

  return events;
};

const executeMarketPhase = async () => {
  const events = [];
  const resources = await base44.entities.Resource.list();

  for (const resource of resources) {
    const allInventory = await base44.entities.Inventory.filter({ resource_id: resource.id });
    const totalSupply = allInventory.reduce((sum, inv) => sum + inv.quantity, 0);
    
    const demandRatio = Math.random() * 2;
    const supplyDemandRatio = totalSupply > 0 ? demandRatio / (totalSupply / 1000) : 1;
    const newPrice = resource.base_value * (1 + resource.volatility_index * supplyDemandRatio);

    await base44.entities.Resource.update(resource.id, {
      base_value: Math.max(10, newPrice)
    });

    events.push({
      type: 'Market',
      resource: resource.name,
      price: newPrice
    });
  }

  return events;
};

const executeThreatPhase = async () => {
  const events = [];
  const threats = await base44.entities.Threat.filter({ active: true });

  for (const threat of threats) {
    const colony = await base44.entities.Colony.filter({ id: threat.colony_id });
    if (colony.length === 0) continue;

    const colonyData = colony[0];
    const stabilityImpact = threat.severity * 0.2;
    const newStability = Math.max(0, colonyData.stability_index - stabilityImpact);

    await base44.entities.Colony.update(colonyData.id, {
      stability_index: newStability,
      threat_level: threat.severity
    });

    const stageOrder = ['Detection', 'Escalation', 'Critical', 'Resolution'];
    const currentIndex = stageOrder.indexOf(threat.stage);
    
    if (threat.duration > 1) {
      const nextStage = currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : threat.stage;
      await base44.entities.Threat.update(threat.id, {
        duration: threat.duration - 1,
        stage: nextStage
      });
    } else {
      await base44.entities.Threat.update(threat.id, { active: false });
    }

    events.push({
      type: 'Threat',
      colony: colonyData.name,
      threat: threat.type
    });
  }

  return events;
};

const executeAIPhase = async () => {
  const events = [];
  const factions = await base44.entities.Faction.list();
  const aiFactions = factions.filter(f => !f.created_by);

  const [allColonies, allThreats, allInventory, allAgreements, recentEvents] = await Promise.all([
    base44.entities.Colony.list(),
    base44.entities.Threat.list(),
    base44.entities.Inventory.list(),
    base44.entities.DiplomacyAgreement.list(),
    base44.entities.EventLog.list('-created_date', 50)
  ]);

  const gameState = {
    colonies: allColonies,
    threats: allThreats,
    inventory: allInventory,
    agreements: allAgreements
  };

  const currentTurn = Math.floor(Date.now() / 1000);

  for (const faction of aiFactions) {
    const profile = await base44.entities.FactionStrategyProfile.filter({ faction_id: faction.id });
    if (profile.length === 0) continue;

    let memory = await base44.entities.FactionStrategicMemory.filter({ faction_id: faction.id });
    if (memory.length === 0) {
      memory = [await base44.entities.FactionStrategicMemory.create({ faction_id: faction.id })];
    }

    const strategyProfile = profile[0];
    const memoryData = memory[0];

    if (currentTurn - memoryData.last_priority_shift_turn < 2 && memoryData.mode_duration > 0) {
      continue;
    }

    const priorities = await updateDynamicPriorities(faction, strategyProfile, gameState);
    const newMode = determineStrategicMode(priorities);

    await updateStrategicMemory(faction, memoryData, currentTurn, recentEvents);

    const optimalResearch = await selectOptimalResearch(faction, priorities, currentTurn);
    if (optimalResearch && faction.credits > 500) {
      const investAmount = Math.min(500, faction.credits);
      await base44.entities.ResearchProject.update(optimalResearch.id, {
        progress: optimalResearch.progress + investAmount
      });
      await base44.entities.Faction.update(faction.id, {
        credits: faction.credits - investAmount
      });

      events.push({
        type: 'AI Decision',
        faction: faction.name,
        action: `Research: ${optimalResearch.category}`
      });
    }

    let action = 'None';
    const actionScore = priorities.economic * 100 + priorities.military * 50 + priorities.expansion * 75;

    if (newMode === 'Economic' && faction.credits > 3000) {
      action = 'Economic Consolidation';
      await base44.entities.Faction.update(faction.id, {
        credits: faction.credits - 2000
      });
    } else if (newMode === 'Defensive' && faction.credits > 2500) {
      action = 'Defensive Buildup';
      await base44.entities.Faction.update(faction.id, {
        credits: faction.credits - 2500
      });
    } else if (newMode === 'Expansion' && faction.credits > 5000) {
      action = 'Expansion Initiative';
      await base44.entities.Faction.update(faction.id, {
        credits: faction.credits - 4000
      });
    }

    await base44.entities.EventLog.create({
      timestamp: new Date().toISOString(),
      event_type: 'AI Decision',
      source_entity: 'Faction',
      source_id: faction.id,
      description: `${faction.name} [${newMode}]: ${action} (Econ: ${(priorities.economic*100).toFixed(0)}%, Mil: ${(priorities.military*100).toFixed(0)}%)`,
      impact_score: Math.floor(actionScore)
    });

    events.push({
      type: 'AI Decision',
      faction: faction.name,
      action,
      mode: newMode
    });
  }

  return events;
};

const executeMaintenancePhase = async () => {
  const events = [];
  const ships = await base44.entities.Ship.list();

  for (const ship of ships) {
    const maintenanceDecay = 2;
    const newMaintenance = Math.max(0, ship.maintenance_level - maintenanceDecay);

    await base44.entities.Ship.update(ship.id, {
      maintenance_level: newMaintenance
    });

    if (newMaintenance < 30 && ship.status !== 'Maintenance') {
      await base44.entities.Ship.update(ship.id, {
        status: 'Maintenance'
      });

      events.push({
        type: 'Maintenance',
        ship: ship.name,
        status: 'Critical'
      });
    }
  }

  return events;
};

const executeEconomicPhase = async () => {
  const events = [];
  
  try {
    await updateMarketPrices();
    
    events.push({
      type: 'Market',
      description: 'Market prices updated'
    });
  } catch (error) {
    console.error('Economic phase error:', error);
  }
  
  return events;
};

export const calculateKPIs = async () => {
  const [colonies, ships, factions, threats, inventory, tradeRoutes] = await Promise.all([
    base44.entities.Colony.list(),
    base44.entities.Ship.list(),
    base44.entities.Faction.list(),
    base44.entities.Threat.filter({ active: true }),
    base44.entities.Inventory.list(),
    base44.entities.TradeRoute.filter({ active_status: true })
  ]);

  const totalCredits = factions.reduce((sum, f) => sum + f.credits, 0);
  const activeShips = ships.filter(s => s.status !== 'Destroyed').length;
  const fleetUtilization = ships.length > 0 ? (activeShips / ships.length) * 100 : 0;
  
  const avgStability = colonies.length > 0 
    ? colonies.reduce((sum, c) => sum + c.stability_index, 0) / colonies.length 
    : 0;

  const totalResources = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const logisticsEfficiency = tradeRoutes.length > 0 
    ? (tradeRoutes.filter(r => r.active_status).length / tradeRoutes.length) * 100 
    : 0;

  const avgThreatLevel = threats.length > 0
    ? threats.reduce((sum, t) => sum + t.severity, 0) / threats.length
    : 0;

  return {
    totalCredits,
    fleetUtilization: fleetUtilization.toFixed(1),
    colonySustainability: avgStability.toFixed(1),
    logisticsEfficiency: logisticsEfficiency.toFixed(1),
    totalResources,
    activeThreats: threats.length,
    avgThreatLevel: avgThreatLevel.toFixed(1),
    totalColonies: colonies.length,
    totalShips: ships.length,
    activeRoutes: tradeRoutes.length
  };
};