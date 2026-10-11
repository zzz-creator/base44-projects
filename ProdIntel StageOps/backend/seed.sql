-- ProdIntel StageOps Seed Data
-- Run this after schema.sql has been executed

-- Venues
DECLARE @V1 UNIQUEIDENTIFIER = NEWID(), @V2 UNIQUEIDENTIFIER = NEWID();
INSERT INTO [dbo].[Venue] (VenueID, Name, Location, Capacity, ContactInfo) VALUES
  (@V1, 'Grand Theatre', '123 Main St, Los Angeles, CA 90001', 1200, 'contact@grandtheatre.com'),
  (@V2, 'Studio Black Box', '456 Arts Ave, Los Angeles, CA 90012', 250, 'studio@blackboxla.com');

-- Productions
DECLARE @P1 UNIQUEIDENTIFIER = NEWID(), @P2 UNIQUEIDENTIFIER = NEWID();
INSERT INTO [dbo].[Production] (ProductionID, Name, VenueID, StartDate, EndDate, Status, Description) VALUES
  (@P1, 'Hamlet: Redux 2026', @V1, '2026-04-01', '2026-05-31', 'rehearsal', 'A modern retelling of the classic Shakespeare tragedy with immersive lighting.'),
  (@P2, 'Echo Chamber', @V2, '2026-03-15', '2026-04-15', 'active', 'An experimental sound and light performance piece by the resident company.');

-- Asset Locations
DECLARE @L1 UNIQUEIDENTIFIER = NEWID(), @L2 UNIQUEIDENTIFIER = NEWID(), @L3 UNIQUEIDENTIFIER = NEWID();
INSERT INTO [dbo].[AssetLocation] (LocationID, LocationName, Description, VenueID) VALUES
  (@L1, 'Main Stage', 'Primary performance area', @V1),
  (@L2, 'Tech Booth', 'Lighting and sound control booth', @V1),
  (@L3, 'Storage Room B', 'Secondary equipment storage', @V2);

-- Equipment Assets
DECLARE @A1 UNIQUEIDENTIFIER = NEWID(), @A2 UNIQUEIDENTIFIER = NEWID(), @A3 UNIQUEIDENTIFIER = NEWID(), @A4 UNIQUEIDENTIFIER = NEWID();
INSERT INTO [dbo].[EquipmentAsset] (AssetID, AssetName, Category, SerialNumber, Status, LocationID, PurchaseDate) VALUES
  (@A1, 'ETC Source Four LED Series 2', 'lighting', 'ETC-SF4-00142', 'in_use', @L1, '2023-06-15'),
  (@A2, 'Shure SM58 Wireless System', 'sound', 'SHURE-SM58-9901', 'in_use', @L1, '2022-11-20'),
  (@A3, 'Grand MA 3 Console', 'lighting', 'GMA3-7742', 'in_use', @L2, '2024-01-10'),
  (@A4, 'Yamaha QL5 Mixer', 'sound', 'YAM-QL5-2891', 'in_use', @L2, '2023-09-05');

-- Crew Assignments
INSERT INTO [dbo].[CrewAssignment] (AssignmentID, ProductionID, CrewMemberName, Role, ContactInfo, Status) VALUES
  (NEWID(), @P1, 'Rachel Nguyen', 'stage_manager', 'rachel.n@crew.com', 'active'),
  (NEWID(), @P1, 'Tom Whitfield', 'lighting', 'tom.w@crew.com', 'active'),
  (NEWID(), @P1, 'Diane Okafor', 'sound', 'diane.o@crew.com', 'confirmed'),
  (NEWID(), @P2, 'Marcus Bell', 'technical_director', 'marcus.b@crew.com', 'active');

-- Task Checklists
INSERT INTO [dbo].[TaskChecklist] (TaskID, ProductionID, TaskName, AssignedTo, DueDate, CompletionStatus, Priority) VALUES
  (NEWID(), @P1, 'Finalize lighting plot', 'Tom Whitfield', '2026-03-20', 'in_progress', 'high'),
  (NEWID(), @P1, 'Complete sound check for Act 1', 'Diane Okafor', '2026-03-25', 'pending', 'high'),
  (NEWID(), @P1, 'Coordinate costume delivery with wardrobe', 'Rachel Nguyen', '2026-03-18', 'completed', 'medium'),
  (NEWID(), @P2, 'Rig speaker array for Echo Chamber', 'Marcus Bell', '2026-03-14', 'completed', 'critical');

-- Incident Logs
DECLARE @INC1 UNIQUEIDENTIFIER = NEWID();
INSERT INTO [dbo].[IncidentLog] (IncidentID, ProductionID, Description, Severity, ResolutionStatus, ReportedBy, AssignedTo) VALUES
  (@INC1, @P1, 'ETC fixture on position 14 dropped out mid-rehearsal. Unit is unresponsive to DMX commands.', 'high', 'investigating', 'Tom Whitfield', 'Tom Whitfield'),
  (NEWID(), @P2, 'Minor audio feedback during pre-show sound check. Resolved by adjusting gain structure.', 'low', 'resolved', 'Marcus Bell', 'Marcus Bell');

-- Maintenance Records
INSERT INTO [dbo].[MaintenanceRecord] (MaintenanceID, AssetID, MaintenanceType, PerformedBy, PerformedDate, Notes, NextScheduledDate) VALUES
  (NEWID(), @A1, 'routine', 'Tech Team', '2026-02-01', 'Cleaned lens assembly, checked all gobos. Unit operating within spec.', '2026-06-01'),
  (NEWID(), @A3, 'inspection', 'GrandMA Support', '2026-01-15', 'Firmware updated to 1.9.3. All nodes communicating correctly.', '2026-07-15');

-- Usage Metrics
INSERT INTO [dbo].[UsageMetrics] (UsageID, AssetID, UsageHours, UsageDate, ProductionID) VALUES
  (NEWID(), @A1, 4.5, '2026-03-07', @P1),
  (NEWID(), @A2, 3.0, '2026-03-07', @P1),
  (NEWID(), @A3, 4.5, '2026-03-07', @P1),
  (NEWID(), @A4, 3.0, '2026-03-07', @P2);

-- Cue Documentation
INSERT INTO [dbo].[CueDocumentation] (CueID, ProductionID, CueNumber, Description, Department, RevisionNumber) VALUES
  (NEWID(), @P1, 'LX 1', 'Pre-show state — house at 50%, stage dark', 'lighting', 1),
  (NEWID(), @P1, 'LX 2', 'House out — stage fade to black', 'lighting', 2),
  (NEWID(), @P1, 'SQ 1', 'Pre-show ambient music fade in at 30%', 'sound', 1),
  (NEWID(), @P1, 'SQ 2', 'Pre-show music fade out', 'sound', 1);

-- Knowledge Records
INSERT INTO [dbo].[KnowledgeRecord] (RecordID, ProductionID, Title, Category, Content, Tags) VALUES
  (NEWID(), @P1, 'Lighting Rig Safety Protocol', 'safety', 'Always use secondary safety cables on all fixtures above head height. Inspect cables before each hang.', 'safety,lighting,rigging'),
  (NEWID(), NULL, 'Pre-Show Sound Check Procedure', 'procedure', '1. Line check all inputs. 2. Check monitor mixes. 3. Walk the house with pink noise. 4. Confirm comms system.', 'sound,procedure,pre-show');

-- Automation Rules
DECLARE @AR1 UNIQUEIDENTIFIER = NEWID(), @AR2 UNIQUEIDENTIFIER = NEWID();
INSERT INTO [dbo].[AutomationRule] (RuleID, RuleName, TriggerEvent, ActionDefinition, IsActive) VALUES
  (@AR1, 'Incident Escalation', 'incident.severity.equals.critical', '{"action":"notify","target":"stage_manager","message":"CRITICAL INCIDENT REPORTED: Immediate attention required."}', 1),
  (@AR2, 'Asset Maintenance Due', 'asset.maintenance.overdue', '{"action":"create_task","assignTo":"technical_director","taskName":"Schedule overdue maintenance"}', 1);

-- Workflow Actions
INSERT INTO [dbo].[WorkflowAction] (ActionID, RuleID, ActionType, TargetEntity, Parameters) VALUES
  (NEWID(), @AR1, 'notify', 'StaffMember', '{"channel":"sms","urgency":"immediate"}'),
  (NEWID(), @AR2, 'create_task', 'TaskChecklist', '{"priority":"high","dueInDays":3}');

-- Procedure Library
INSERT INTO [dbo].[ProcedureLibrary] (ProcedureID, Title, Category, Description, LastReviewedDate) VALUES
  (NEWID(), 'Emergency Evacuation Procedure', 'emergency', 'In case of emergency: 1. Announce Evac via comms. 2. Kill power to stage rigs. 3. Open all house doors. 4. Guide audience to exits. 5. Account for all crew.', '2026-01-10'),
  (NEWID(), 'Nightly Close-Down Procedure', 'operational', '1. Power down all stage fixtures. 2. Save console show file. 3. Park all automated fixtures. 4. Disable intercom backbone.', '2026-02-05');
