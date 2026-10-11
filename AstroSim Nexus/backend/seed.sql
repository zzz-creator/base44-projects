-- AstroSim Nexus Seed Data
USE astrosim;
GO

-- Users
INSERT INTO Users (UserID, Email, PasswordHash, FullName, Role) VALUES
  (NEWID(), 'admin@astrosim.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Supreme Commander', 'admin'),
  (NEWID(), 'fleet@astrosim.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Admiral Voss', 'user');

-- Resources
DECLARE @RES1 UNIQUEIDENTIFIER = NEWID(), @RES2 UNIQUEIDENTIFIER = NEWID(), @RES3 UNIQUEIDENTIFIER = NEWID();
INSERT INTO Resource (ResourceID, Name, Category, BaseValue, VolatilityIndex, Weight) VALUES
  (@RES1, 'Dilithium Crystals', 'fuel', 850.00, 0.3, 2.5),
  (@RES2, 'Duranium Alloy', 'material', 420.00, 0.15, 8.0),
  (@RES3, 'Quantum Flux', 'energy', 1200.00, 0.5, 0.5);

-- Factions
DECLARE @FAC1 UNIQUEIDENTIFIER = NEWID(), @FAC2 UNIQUEIDENTIFIER = NEWID(), @FAC3 UNIQUEIDENTIFIER = NEWID();
INSERT INTO Faction (FactionID, Name, AggressionLevel, EconomicFocus, TechnologyLevel, DiplomaticStance, Credits) VALUES
  (@FAC1, 'Terran Hegemony', 45, 70, 5, 'Neutral', 250000),
  (@FAC2, 'Proxima Collective', 75, 40, 4, 'Aggressive', 180000),
  (@FAC3, 'Outer Rim Syndicate', 60, 85, 3, 'Opportunistic', 420000);

-- Colonies
DECLARE @COL1 UNIQUEIDENTIFIER = NEWID(), @COL2 UNIQUEIDENTIFIER = NEWID(), @COL3 UNIQUEIDENTIFIER = NEWID();
INSERT INTO Colony (ColonyID, Name, PlanetType, Population, StabilityIndex, EnergyOutput, StorageCapacity, DefenseRating, ThreatLevel, OwnerFactionID) VALUES
  (@COL1, 'New Eden Prime', 'Terrestrial', 850000, 88, 1200, 50000, 72, 15, CAST(@FAC1 AS NVARCHAR(100))),
  (@COL2, 'Proxima Station', 'Orbital', 45000, 71, 650, 20000, 55, 32, CAST(@FAC2 AS NVARCHAR(100))),
  (@COL3, 'Kepler Outpost', 'Desert', 12000, 58, 310, 8000, 40, 48, CAST(@FAC3 AS NVARCHAR(100)));

-- Ship Hulls
DECLARE @HULL1 UNIQUEIDENTIFIER = NEWID(), @HULL2 UNIQUEIDENTIFIER = NEWID();
INSERT INTO ShipHull (ShipHullID, Name, BaseCargoCapacity, BaseFuelCapacity, BaseSpeed, BaseDefense, BaseWeaponSlots, BaseUtilitySlots, PowerCapacity, BuildCostCredits, BuildTimeTurns) VALUES
  (@HULL1, 'Excelsior-Class Frigate', 600, 400, 140, 65, 4, 4, 120, 8000, 4),
  (@HULL2, 'Leviathan-Class Carrier', 2500, 1200, 85, 90, 8, 8, 350, 45000, 12);

-- Ships
DECLARE @SHIP1 UNIQUEIDENTIFIER = NEWID(), @SHIP2 UNIQUEIDENTIFIER = NEWID(), @SHIP3 UNIQUEIDENTIFIER = NEWID();
INSERT INTO Ship (ShipID, Name, Class, CargoCapacity, FuelCapacity, FuelLevel, MaintenanceLevel, CurrentColonyID, OwnerFactionID, Status) VALUES
  (@SHIP1, 'ISV Relentless', 'Frigate', 600, 400, 380, 95, CAST(@COL1 AS NVARCHAR(100)), CAST(@FAC1 AS NVARCHAR(100)), 'Docked'),
  (@SHIP2, 'ISV Nomad', 'Freighter', 1000, 500, 450, 82, CAST(@COL1 AS NVARCHAR(100)), CAST(@FAC1 AS NVARCHAR(100)), 'Transit'),
  (@SHIP3, 'PXS Ravager', 'Frigate', 600, 400, 200, 72, CAST(@COL2 AS NVARCHAR(100)), CAST(@FAC2 AS NVARCHAR(100)), 'Patrol');

-- Fleets
DECLARE @FL1 UNIQUEIDENTIFIER = NEWID();
INSERT INTO Fleet (FleetID, Name, FactionID, Task, Status, TargetColonyID, Formation, Morale, CombatEffectiveness) VALUES
  (@FL1, 'Hegemony First Fleet', CAST(@FAC1 AS NVARCHAR(100)), 'Patrol', 'Active', CAST(@COL1 AS NVARCHAR(100)), 'Line', 92, 88);

-- Fleet Assignments
INSERT INTO FleetAssignment (FleetAssignmentID, FleetID, ShipID, Role, PositionIndex) VALUES
  (NEWID(), CAST(@FL1 AS NVARCHAR(100)), CAST(@SHIP1 AS NVARCHAR(100)), 'Vanguard', 1),
  (NEWID(), CAST(@FL1 AS NVARCHAR(100)), CAST(@SHIP2 AS NVARCHAR(100)), 'Support', 2);

-- Inventory
INSERT INTO Inventory (InventoryID, ColonyID, ResourceID, Quantity) VALUES
  (NEWID(), CAST(@COL1 AS NVARCHAR(100)), CAST(@RES1 AS NVARCHAR(100)), 8500),
  (NEWID(), CAST(@COL1 AS NVARCHAR(100)), CAST(@RES2 AS NVARCHAR(100)), 22000),
  (NEWID(), CAST(@COL2 AS NVARCHAR(100)), CAST(@RES1 AS NVARCHAR(100)), 3200);

-- Market Data
INSERT INTO MarketData (MarketDataID, ColonyID, ResourceID, LocalSupply, LocalDemand, CurrentPrice, PriceTrend, ScarcityMultiplier, TransportCost) VALUES
  (NEWID(), CAST(@COL1 AS NVARCHAR(100)), CAST(@RES1 AS NVARCHAR(100)), 8500, 6000, 920, 'Rising', 1.08, 45),
  (NEWID(), CAST(@COL2 AS NVARCHAR(100)), CAST(@RES2 AS NVARCHAR(100)), 1200, 4500, 580, 'Rising', 1.35, 72),
  (NEWID(), CAST(@COL3 AS NVARCHAR(100)), CAST(@RES3 AS NVARCHAR(100)), 500, 800, 1450, 'Stable', 1.12, 90);

-- Trade Routes
INSERT INTO TradeRoute (TradeRouteID, OriginColonyID, DestinationColonyID, AssignedShipID, RiskRating, Distance, ActiveStatus) VALUES
  (NEWID(), CAST(@COL1 AS NVARCHAR(100)), CAST(@COL2 AS NVARCHAR(100)), CAST(@SHIP2 AS NVARCHAR(100)), 25, 220, 1),
  (NEWID(), CAST(@COL1 AS NVARCHAR(100)), CAST(@COL3 AS NVARCHAR(100)), NULL, 55, 480, 0);

-- Trade Agreements
INSERT INTO TradeAgreement (TradeAgreementID, FactionAIDirectional, FactionBIDirectional, AgreementType, TariffReduction, TradeVolume, Status) VALUES
  (NEWID(), CAST(@FAC1 AS NVARCHAR(100)), CAST(@FAC3 AS NVARCHAR(100)), 'Preferential', 35, 120000, 'Active');

-- Diplomacy Agreements
INSERT INTO DiplomacyAgreement (DiplomacyAgreementID, FactionAIDirectional, FactionBIDirectional, Type, Duration, Status) VALUES
  (NEWID(), CAST(@FAC1 AS NVARCHAR(100)), CAST(@FAC2 AS NVARCHAR(100)), 'Non-Aggression Pact', 20, 'Active');

-- Threats
INSERT INTO Threat (ThreatID, ColonyID, Type, Severity, Duration, Stage, Active) VALUES
  (NEWID(), CAST(@COL2 AS NVARCHAR(100)), 'Pirate Raid', 45, 3, 'Detection', 1),
  (NEWID(), CAST(@COL3 AS NVARCHAR(100)), 'Resource Shortage', 60, 8, 'Critical', 1);

-- Research Projects
INSERT INTO ResearchProject (ResearchProjectID, FactionID, Category, Progress, CompletionThreshold, UnlockType) VALUES
  (NEWID(), CAST(@FAC1 AS NVARCHAR(100)), 'Military', 650, 1000, 'Advanced Weapons Systems'),
  (NEWID(), CAST(@FAC1 AS NVARCHAR(100)), 'Economic', 320, 1000, 'Trade Route Optimization'),
  (NEWID(), CAST(@FAC2 AS NVARCHAR(100)), 'Military', 850, 1000, 'Stealth Frigate Hull');

-- Infrastructure Modules
INSERT INTO InfrastructureModule (InfrastructureModuleID, ColonyID, Type, Level, EfficiencyBoost, MaintenanceCost) VALUES
  (NEWID(), CAST(@COL1 AS NVARCHAR(100)), 'Power Plant', 3, 30, 450),
  (NEWID(), CAST(@COL1 AS NVARCHAR(100)), 'Shipyard', 2, 20, 800),
  (NEWID(), CAST(@COL2 AS NVARCHAR(100)), 'Defense Array', 2, 20, 600);

-- Event Log
INSERT INTO EventLog (EventLogID, Timestamp, EventType, SourceEntity, SourceID, Description, ImpactScore) VALUES
  (NEWID(), GETDATE(), 'Trade', 'TradeRoute', 'route-001', 'Dilithium shipment completed from New Eden Prime to Proxima Station.', 45),
  (NEWID(), GETDATE(), 'Combat', 'Fleet', 'fleet-001', 'Pirate skirmish near Kepler Outpost — Hegemony patrol repelled raiders.', 72),
  (NEWID(), GETDATE(), 'Diplomacy', 'Faction', 'fac-001', 'Non-Aggression Pact signed between Terran Hegemony and Proxima Collective.', 85);

-- Faction Strategy Profiles
INSERT INTO FactionStrategyProfile (FactionStrategyProfileID, FactionID, EconomicPriorityWeight, MilitaryPriorityWeight, ExpansionPriorityWeight, RiskTolerance, HistoricalSuccessRate) VALUES
  (NEWID(), CAST(@FAC1 AS NVARCHAR(100)), 0.55, 0.25, 0.20, 0.35, 0.72),
  (NEWID(), CAST(@FAC2 AS NVARCHAR(100)), 0.20, 0.60, 0.20, 0.70, 0.58),
  (NEWID(), CAST(@FAC3 AS NVARCHAR(100)), 0.65, 0.15, 0.20, 0.55, 0.65);

-- Economic Policies
INSERT INTO EconomicPolicy (EconomicPolicyID, FactionID, PolicyType, ImportTariff, ExportTax, ProductionEfficiencyModifier, MarketVolatilityModifier) VALUES
  (NEWID(), CAST(@FAC1 AS NVARCHAR(100)), 'Mixed Economy', 8, 4, 1.12, 0.9),
  (NEWID(), CAST(@FAC3 AS NVARCHAR(100)), 'Free Market', 2, 1, 1.05, 1.2);
