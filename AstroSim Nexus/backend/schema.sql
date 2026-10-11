-- AstroSim Nexus - MSSQL Schema
-- Generated from entity definitions



-- ─── Authentication ──────────────────────────────────────────────────────────

IF OBJECT_ID('Users', 'U') IS NULL
CREATE TABLE Users (
    UserID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    FullName NVARCHAR(255),
    Role NVARCHAR(50) DEFAULT 'user',
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- ─── Entities ────────────────────────────────────────────────────────────────

IF OBJECT_ID('AuditTrail', 'U') IS NULL
CREATE TABLE AuditTrail (
    AuditTrailID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EntityName NVARCHAR(100),
    EntityID NVARCHAR(100),
    ChangedField NVARCHAR(100),
    OldValue NVARCHAR(MAX),
    NewValue NVARCHAR(MAX),
    Timestamp DATETIME2,
    UserID NVARCHAR(100),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('CargoManifest', 'U') IS NULL
CREATE TABLE CargoManifest (
    CargoManifestID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ShipID NVARCHAR(100),
    ResourceID NVARCHAR(100),
    Quantity FLOAT DEFAULT 0,
    DestinationColonyID NVARCHAR(100),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Colony', 'U') IS NULL
CREATE TABLE Colony (
    ColonyID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255),
    PlanetType NVARCHAR(50),
    Population FLOAT DEFAULT 1000,
    StabilityIndex FLOAT DEFAULT 80,
    EnergyOutput FLOAT DEFAULT 100,
    StorageCapacity FLOAT DEFAULT 10000,
    DefenseRating FLOAT DEFAULT 50,
    ThreatLevel FLOAT DEFAULT 0,
    OwnerFactionID NVARCHAR(100),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('CombatEncounter', 'U') IS NULL
CREATE TABLE CombatEncounter (
    CombatEncounterID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    LocationColonyID NVARCHAR(100),
    AttackerFactionID NVARCHAR(100),
    DefenderFactionID NVARCHAR(100),
    Status NVARCHAR(50) DEFAULT 'Active',
    CurrentTurn INT DEFAULT 1,
    AttackerMorale FLOAT DEFAULT 100,
    DefenderMorale FLOAT DEFAULT 100,
    TotalAttackerDamage FLOAT DEFAULT 0,
    TotalDefenderDamage FLOAT DEFAULT 0,
    ThreatID NVARCHAR(100),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('CombatLog', 'U') IS NULL
CREATE TABLE CombatLog (
    CombatLogID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EncounterID NVARCHAR(100),
    TurnNumber INT,
    ActionType NVARCHAR(50),
    ActorShipID NVARCHAR(100),
    TargetShipID NVARCHAR(100),
    DamageAmount FLOAT DEFAULT 0,
    Description NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('CombatParticipant', 'U') IS NULL
CREATE TABLE CombatParticipant (
    CombatParticipantID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EncounterID NVARCHAR(100),
    ShipID NVARCHAR(100),
    Side NVARCHAR(50),
    CurrentHull FLOAT DEFAULT 100,
    CurrentShields FLOAT DEFAULT 100,
    Status NVARCHAR(50) DEFAULT 'Engaged',
    DamageDealt FLOAT DEFAULT 0,
    DamageTaken FLOAT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('CustomShipClass', 'U') IS NULL
CREATE TABLE CustomShipClass (
    CustomShipClassID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255),
    FactionID NVARCHAR(100),
    HullID NVARCHAR(100),
    ComponentIDs NVARCHAR(MAX), -- Stored as JSON array string
    TotalCargoCapacity FLOAT DEFAULT 0,
    TotalSpeed FLOAT DEFAULT 0,
    TotalDefense FLOAT DEFAULT 0,
    TotalMaintenanceCost FLOAT DEFAULT 0,
    ProductionCostCredits FLOAT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('DiplomacyAgreement', 'U') IS NULL
CREATE TABLE DiplomacyAgreement (
    DiplomacyAgreementID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    FactionAIDirectional NVARCHAR(100),
    FactionBIDirectional NVARCHAR(100),
    Type NVARCHAR(50),
    Duration INT DEFAULT 10,
    Status NVARCHAR(50) DEFAULT 'Active',
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('EconomicPolicy', 'U') IS NULL
CREATE TABLE EconomicPolicy (
    EconomicPolicyID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    FactionID NVARCHAR(100),
    PolicyType NVARCHAR(50) DEFAULT 'Free Market',
    ImportTariff FLOAT DEFAULT 10,
    ExportTax FLOAT DEFAULT 5,
    ProductionEfficiencyModifier FLOAT DEFAULT 1.0,
    MarketVolatilityModifier FLOAT DEFAULT 1.0,
    StabilityModifier FLOAT DEFAULT 0,
    InflationRate FLOAT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('EventLog', 'U') IS NULL
CREATE TABLE EventLog (
    EventLogID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Timestamp DATETIME2,
    EventType NVARCHAR(50),
    SourceEntity NVARCHAR(100),
    SourceID NVARCHAR(100),
    Description NVARCHAR(MAX),
    ImpactScore FLOAT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Faction', 'U') IS NULL
CREATE TABLE Faction (
    FactionID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255),
    AggressionLevel FLOAT DEFAULT 50,
    EconomicFocus FLOAT DEFAULT 50,
    TechnologyLevel INT DEFAULT 1,
    DiplomaticStance NVARCHAR(50) DEFAULT 'Neutral',
    Credits FLOAT DEFAULT 10000,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('FactionStrategicMemory', 'U') IS NULL
CREATE TABLE FactionStrategicMemory (
    FactionStrategicMemoryID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    FactionID NVARCHAR(100),
    RecentEconomicLosses FLOAT DEFAULT 0,
    RecentMilitaryLosses FLOAT DEFAULT 0,
    SuccessfulExpansionRate FLOAT DEFAULT 0.5,
    HistoricalThreatIndex FLOAT DEFAULT 0,
    LastPriorityShiftTurn INT DEFAULT 0,
    CurrentStrategicMode NVARCHAR(50) DEFAULT 'Economic',
    ModeDuration INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('FactionStrategyProfile', 'U') IS NULL
CREATE TABLE FactionStrategyProfile (
    FactionStrategyProfileID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    FactionID NVARCHAR(100),
    EconomicPriorityWeight FLOAT DEFAULT 0.33,
    MilitaryPriorityWeight FLOAT DEFAULT 0.33,
    ExpansionPriorityWeight FLOAT DEFAULT 0.34,
    RiskTolerance FLOAT DEFAULT 0.5,
    HistoricalSuccessRate FLOAT DEFAULT 0.5,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Fleet', 'U') IS NULL
CREATE TABLE Fleet (
    FleetID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255),
    FactionID NVARCHAR(100),
    Task NVARCHAR(50) DEFAULT 'Idle',
    Status NVARCHAR(50) DEFAULT 'Docked',
    TargetColonyID NVARCHAR(100),
    Formation NVARCHAR(50) DEFAULT 'Line',
    Morale FLOAT DEFAULT 100,
    CombatEffectiveness FLOAT DEFAULT 100,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('FleetAssignment', 'U') IS NULL
CREATE TABLE FleetAssignment (
    FleetAssignmentID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    FleetID NVARCHAR(100),
    ShipID NVARCHAR(100),
    Role NVARCHAR(50) DEFAULT 'Escort',
    PositionIndex INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('InfrastructureModule', 'U') IS NULL
CREATE TABLE InfrastructureModule (
    InfrastructureModuleID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ColonyID NVARCHAR(100),
    Type NVARCHAR(50),
    Level INT DEFAULT 1,
    EfficiencyBoost FLOAT DEFAULT 10,
    MaintenanceCost FLOAT DEFAULT 100,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Inventory', 'U') IS NULL
CREATE TABLE Inventory (
    InventoryID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ColonyID NVARCHAR(100),
    ResourceID NVARCHAR(100),
    Quantity FLOAT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('MarketData', 'U') IS NULL
CREATE TABLE MarketData (
    MarketDataID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ColonyID NVARCHAR(100),
    ResourceID NVARCHAR(100),
    LocalSupply FLOAT DEFAULT 0,
    LocalDemand FLOAT DEFAULT 100,
    CurrentPrice FLOAT DEFAULT 100,
    PriceTrend NVARCHAR(50) DEFAULT 'Stable',
    ScarcityMultiplier FLOAT DEFAULT 1.0,
    TransportCost FLOAT DEFAULT 5,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('MarketEvent', 'U') IS NULL
CREATE TABLE MarketEvent (
    MarketEventID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EventType NVARCHAR(50),
    AffectedResourceID NVARCHAR(100),
    AffectedColonyID NVARCHAR(100),
    AffectedFactionID NVARCHAR(100),
    PriceImpact FLOAT DEFAULT 0,
    DurationTurns INT DEFAULT 5,
    Active BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('MarketTransaction', 'U') IS NULL
CREATE TABLE MarketTransaction (
    MarketTransactionID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ColonyID NVARCHAR(100),
    ResourceID NVARCHAR(100),
    Quantity FLOAT,
    Price FLOAT,
    Timestamp DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('ResearchProject', 'U') IS NULL
CREATE TABLE ResearchProject (
    ResearchProjectID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    FactionID NVARCHAR(100),
    Category NVARCHAR(50),
    Progress FLOAT DEFAULT 0,
    CompletionThreshold FLOAT DEFAULT 1000,
    UnlockType NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Resource', 'U') IS NULL
CREATE TABLE Resource (
    ResourceID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255),
    Category NVARCHAR(50),
    BaseValue FLOAT DEFAULT 100,
    VolatilityIndex FLOAT DEFAULT 0.1,
    Weight FLOAT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Ship', 'U') IS NULL
CREATE TABLE Ship (
    ShipID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255),
    Class NVARCHAR(50) DEFAULT 'Freighter',
    CargoCapacity FLOAT DEFAULT 1000,
    FuelCapacity FLOAT DEFAULT 500,
    FuelLevel FLOAT DEFAULT 500,
    MaintenanceLevel FLOAT DEFAULT 100,
    CurrentColonyID NVARCHAR(100),
    OwnerFactionID NVARCHAR(100),
    Status NVARCHAR(50) DEFAULT 'Docked',
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('ShipComponent', 'U') IS NULL
CREATE TABLE ShipComponent (
    ShipComponentID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255),
    Category NVARCHAR(50) DEFAULT 'Utility',
    SpeedModifier FLOAT DEFAULT 0,
    CargoModifier FLOAT DEFAULT 0,
    FuelModifier FLOAT DEFAULT 0,
    DefenseModifier FLOAT DEFAULT 0,
    MaintenanceModifier FLOAT DEFAULT 0,
    PowerConsumption FLOAT DEFAULT 10,
    ResourceCost FLOAT DEFAULT 1000,
    RequiredTechID NVARCHAR(100),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('ShipConstructionOrder', 'U') IS NULL
CREATE TABLE ShipConstructionOrder (
    ShipConstructionOrderID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ColonyID NVARCHAR(100),
    ClassID NVARCHAR(100),
    ShipName NVARCHAR(255),
    Progress FLOAT DEFAULT 0,
    CompletionTurn INT DEFAULT 0,
    Status NVARCHAR(50) DEFAULT 'In Progress',
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('ShipHull', 'U') IS NULL
CREATE TABLE ShipHull (
    ShipHullID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255),
    BaseCargoCapacity FLOAT DEFAULT 500,
    BaseFuelCapacity FLOAT DEFAULT 300,
    BaseSpeed FLOAT DEFAULT 100,
    BaseDefense FLOAT DEFAULT 50,
    BaseWeaponSlots INT DEFAULT 2,
    BaseUtilitySlots INT DEFAULT 3,
    PowerCapacity FLOAT DEFAULT 100,
    BuildCostCredits FLOAT DEFAULT 5000,
    BuildTimeTurns INT DEFAULT 5,
    RequiredTechID NVARCHAR(100),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('ShipLoadout', 'U') IS NULL
CREATE TABLE ShipLoadout (
    ShipLoadoutID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ShipID NVARCHAR(100),
    ComponentID NVARCHAR(100),
    SlotType NVARCHAR(50) DEFAULT 'Utility',
    InstalledTurn INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Threat', 'U') IS NULL
CREATE TABLE Threat (
    ThreatID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ColonyID NVARCHAR(100),
    Type NVARCHAR(50),
    Severity FLOAT DEFAULT 30,
    Duration INT DEFAULT 5,
    Stage NVARCHAR(50) DEFAULT 'Detection',
    Active BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('TradeAgreement', 'U') IS NULL
CREATE TABLE TradeAgreement (
    TradeAgreementID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    FactionAIDirectional NVARCHAR(100),
    FactionBIDirectional NVARCHAR(100),
    AgreementType NVARCHAR(50) DEFAULT 'Free Trade',
    TariffReduction FLOAT DEFAULT 50,
    TradeVolume FLOAT DEFAULT 0,
    Status NVARCHAR(50) DEFAULT 'Active',
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('TradeRoute', 'U') IS NULL
CREATE TABLE TradeRoute (
    TradeRouteID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    OriginColonyID NVARCHAR(100),
    DestinationColonyID NVARCHAR(100),
    AssignedShipID NVARCHAR(100),
    RiskRating FLOAT DEFAULT 20,
    Distance FLOAT DEFAULT 100,
    ActiveStatus BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);
