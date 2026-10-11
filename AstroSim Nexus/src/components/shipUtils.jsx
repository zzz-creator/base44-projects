import { base44 } from '../api/base44Client';

export const calculateShipStats = async (shipId) => {
  const ship = await base44.entities.Ship.filter({ id: shipId });
  if (ship.length === 0) return null;

  const shipData = ship[0];
  const loadouts = await base44.entities.ShipLoadout.filter({ ship_id: shipId });
  
  if (loadouts.length === 0) {
    return {
      cargo_capacity: shipData.cargo_capacity,
      fuel_capacity: shipData.fuel_capacity,
      speed: 100,
      defense: 50,
      maintenance_cost: 100
    };
  }

  const componentIds = loadouts.map(l => l.component_id);
  const components = await Promise.all(
    componentIds.map(id => base44.entities.ShipComponent.filter({ id }))
  );

  const installedComponents = components.map(c => c[0]).filter(Boolean);

  const stats = installedComponents.reduce((acc, comp) => ({
    speed: acc.speed + comp.speed_modifier,
    cargo: acc.cargo + comp.cargo_modifier,
    fuel: acc.fuel + comp.fuel_modifier,
    defense: acc.defense + comp.defense_modifier,
    maintenance: acc.maintenance + comp.maintenance_modifier,
    power: acc.power + comp.power_consumption
  }), {
    speed: 100,
    cargo: shipData.cargo_capacity,
    fuel: shipData.fuel_capacity,
    defense: 50,
    maintenance: 100,
    power: 0
  });

  return {
    cargo_capacity: stats.cargo,
    fuel_capacity: stats.fuel,
    speed: stats.speed,
    defense: stats.defense,
    maintenance_cost: stats.maintenance,
    power_consumption: stats.power
  };
};

export const calculateCustomClassStats = async (hullId, componentIds) => {
  const hulls = await base44.entities.ShipHull.filter({ id: hullId });
  if (hulls.length === 0) return null;

  const hull = hulls[0];
  
  if (!componentIds || componentIds.length === 0) {
    return {
      cargo_capacity: hull.base_cargo_capacity,
      fuel_capacity: hull.base_fuel_capacity,
      speed: hull.base_speed,
      defense: hull.base_defense,
      maintenance_cost: 100,
      power_consumption: 0,
      production_cost: hull.build_cost_credits
    };
  }

  const components = await Promise.all(
    componentIds.map(id => base44.entities.ShipComponent.filter({ id }))
  );

  const installedComponents = components.map(c => c[0]).filter(Boolean);

  const stats = installedComponents.reduce((acc, comp) => ({
    speed: acc.speed + comp.speed_modifier,
    cargo: acc.cargo + comp.cargo_modifier,
    fuel: acc.fuel + comp.fuel_modifier,
    defense: acc.defense + comp.defense_modifier,
    maintenance: acc.maintenance + comp.maintenance_modifier,
    power: acc.power + comp.power_consumption,
    cost: acc.cost + comp.resource_cost
  }), {
    speed: hull.base_speed,
    cargo: hull.base_cargo_capacity,
    fuel: hull.base_fuel_capacity,
    defense: hull.base_defense,
    maintenance: 100,
    power: 0,
    cost: hull.build_cost_credits
  });

  return {
    cargo_capacity: stats.cargo,
    fuel_capacity: stats.fuel,
    speed: stats.speed,
    defense: stats.defense,
    maintenance_cost: stats.maintenance,
    power_consumption: stats.power,
    production_cost: stats.cost
  };
};

export const validateLoadout = async (hullId, componentIds) => {
  const hulls = await base44.entities.ShipHull.filter({ id: hullId });
  if (hulls.length === 0) return { valid: false, error: 'Hull not found' };

  const hull = hulls[0];
  const components = await Promise.all(
    componentIds.map(id => base44.entities.ShipComponent.filter({ id }))
  );

  const installedComponents = components.map(c => c[0]).filter(Boolean);

  const weaponSlots = installedComponents.filter(c => c.category === 'Weapon').length;
  const utilitySlots = installedComponents.filter(c => c.category !== 'Weapon').length;
  const totalPower = installedComponents.reduce((sum, c) => sum + c.power_consumption, 0);

  if (weaponSlots > hull.base_weapon_slots) {
    return { valid: false, error: `Too many weapons (${weaponSlots}/${hull.base_weapon_slots})` };
  }

  if (utilitySlots > hull.base_utility_slots) {
    return { valid: false, error: `Too many utilities (${utilitySlots}/${hull.base_utility_slots})` };
  }

  if (totalPower > hull.power_capacity) {
    return { valid: false, error: `Power exceeded (${totalPower}/${hull.power_capacity})` };
  }

  return { valid: true };
};