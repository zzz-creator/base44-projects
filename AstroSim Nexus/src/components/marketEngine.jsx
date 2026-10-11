import { base44 } from '../api/base44Client';

export const calculateLocalPrice = async (resource, colony, marketData, policy) => {
  const basePrice = resource.base_value;
  
  const demandFactor = (marketData.local_demand + 10) / (marketData.local_supply + 1);
  
  const scarcityMultiplier = marketData.scarcity_multiplier;
  
  const stabilityModifier = colony.stability_index / 100;
  
  const transportCost = marketData.transport_cost;
  
  const policyModifier = policy ? policy.production_efficiency_modifier : 1.0;
  
  const localPrice = (basePrice * demandFactor * scarcityMultiplier * stabilityModifier * policyModifier) + transportCost;
  
  return Math.max(10, localPrice);
};

export const calculateGlobalScarcity = async (resource, allInventory, allMarketData) => {
  const totalSupply = allInventory
    .filter(inv => inv.resource_id === resource.id)
    .reduce((sum, inv) => sum + inv.quantity, 0);
  
  const totalDemand = allMarketData
    .filter(md => md.resource_id === resource.id)
    .reduce((sum, md) => sum + md.local_demand, 0);
  
  const scarcityMultiplier = totalDemand > totalSupply 
    ? 1 + ((totalDemand - totalSupply) / Math.max(totalSupply, 1)) * 0.5
    : 1 - ((totalSupply - totalDemand) / Math.max(totalDemand, 1)) * 0.3;
  
  return Math.max(0.5, Math.min(3.0, scarcityMultiplier));
};

export const calculateTransportCost = (originColony, destColony, resource, riskMultiplier = 1.0) => {
  const distance = Math.abs((originColony.population || 1000) - (destColony.population || 1000)) / 100;
  const baseFuelCost = 2;
  const weightFactor = resource.weight || 1;
  
  return distance * baseFuelCost * weightFactor * riskMultiplier;
};

export const applyShortageEffects = async (colony, resource, shortage) => {
  const effects = {
    'Food': { population: -5, stability: -10 },
    'Energy': { energy_output: -0.2, stability: -5 },
    'Materials': { storage_capacity: -0.1 },
    'Technology': {},
    'Luxury': { stability: -3 }
  };
  
  const effect = effects[resource.category] || {};
  
  if (shortage > 50) {
    const updates = {};
    
    if (effect.population) {
      updates.population = Math.max(100, colony.population + effect.population * (shortage / 100));
    }
    if (effect.stability) {
      updates.stability_index = Math.max(0, colony.stability_index + effect.stability * (shortage / 100));
    }
    if (effect.energy_output) {
      updates.energy_output = Math.max(10, colony.energy_output * (1 + effect.energy_output));
    }
    
    if (Object.keys(updates).length > 0) {
      await base44.entities.Colony.update(colony.id, updates);
    }
  }
};

export const calculateDemand = (colony, resource) => {
  const baseDemand = {
    'Energy': 100 + (colony.population / 10),
    'Food': 50 + (colony.population / 20),
    'Materials': 75 + (colony.defense_rating / 2),
    'Technology': 30,
    'Luxury': 20 + (colony.stability_index / 5)
  };
  
  return baseDemand[resource.category] || 50;
};

export const updateMarketPrices = async () => {
  const [resources, colonies, inventory, policies] = await Promise.all([
    base44.entities.Resource.list(),
    base44.entities.Colony.list(),
    base44.entities.Inventory.list(),
    base44.entities.EconomicPolicy.list()
  ]);
  
  let allMarketData = await base44.entities.MarketData.list();
  
  for (const colony of colonies) {
    const colonyInventory = inventory.filter(inv => inv.colony_id === colony.id);
    const faction = await base44.entities.Faction.filter({ id: colony.owner_faction_id });
    const policy = policies.find(p => p.faction_id === colony.owner_faction_id);
    
    for (const resource of resources) {
      const inv = colonyInventory.find(i => i.resource_id === resource.id);
      const supply = inv ? inv.quantity : 0;
      const demand = calculateDemand(colony, resource);
      
      let marketData = allMarketData.find(md => 
        md.colony_id === colony.id && md.resource_id === resource.id
      );
      
      const scarcity = await calculateGlobalScarcity(resource, inventory, allMarketData);
      
      if (!marketData) {
        marketData = await base44.entities.MarketData.create({
          colony_id: colony.id,
          resource_id: resource.id,
          local_supply: supply,
          local_demand: demand,
          scarcity_multiplier: scarcity
        });
        allMarketData.push(marketData);
      }
      
      const newPrice = await calculateLocalPrice(resource, colony, {
        ...marketData,
        local_supply: supply,
        local_demand: demand,
        scarcity_multiplier: scarcity
      }, policy);
      
      const oldPrice = marketData.current_price || resource.base_value;
      const priceDiff = newPrice - oldPrice;
      const trend = priceDiff > 5 ? 'Rising' : priceDiff < -5 ? 'Falling' : 'Stable';
      
      await base44.entities.MarketData.update(marketData.id, {
        local_supply: supply,
        local_demand: demand,
        current_price: newPrice,
        price_trend: trend,
        scarcity_multiplier: scarcity
      });
      
      const shortage = Math.max(0, demand - supply);
      if (shortage > 50) {
        await applyShortageEffects(colony, resource, shortage);
      }
    }
  }
};

export const calculateEconomicHealthScore = async (faction, colonies, inventory, policy) => {
  const factionColonies = colonies.filter(c => c.owner_faction_id === faction.id);
  
  const avgStability = factionColonies.length > 0
    ? factionColonies.reduce((sum, c) => sum + c.stability_index, 0) / factionColonies.length
    : 50;
  
  const treasury = faction.credits / 10000;
  
  const factionInventory = inventory.filter(inv =>
    factionColonies.some(c => c.id === inv.colony_id)
  );
  const resourceSecurity = factionInventory.length > 0
    ? Math.min(100, factionInventory.reduce((sum, inv) => sum + inv.quantity, 0) / 100)
    : 0;
  
  const inflation = policy ? policy.inflation_rate : 0;
  
  return avgStability + treasury + resourceSecurity - inflation;
};

export const getPolicyModifiers = (policyType) => {
  const modifiers = {
    'Free Market': {
      production_efficiency_modifier: 1.1,
      market_volatility_modifier: 1.3,
      stability_modifier: -5,
      import_tariff: 5,
      export_tax: 2
    },
    'State Controlled': {
      production_efficiency_modifier: 0.9,
      market_volatility_modifier: 0.6,
      stability_modifier: 10,
      import_tariff: 25,
      export_tax: 15
    },
    'Militarized': {
      production_efficiency_modifier: 1.2,
      market_volatility_modifier: 1.0,
      stability_modifier: -10,
      import_tariff: 30,
      export_tax: 5
    },
    'Mercantile': {
      production_efficiency_modifier: 1.0,
      market_volatility_modifier: 0.8,
      stability_modifier: 5,
      import_tariff: 0,
      export_tax: 0
    },
    'Isolationist': {
      production_efficiency_modifier: 1.3,
      market_volatility_modifier: 0.5,
      stability_modifier: 0,
      import_tariff: 75,
      export_tax: 50
    }
  };
  
  return modifiers[policyType] || modifiers['Free Market'];
};