-- =============================================
-- prodIntel StageOps - Microsoft SQL Server Schema
-- Generated for local standalone execution
-- =============================================

-- =============================================
-- PRODUCTION DOMAIN
-- =============================================

CREATE TABLE [dbo].[Venue] (
    [VenueID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Name] NVARCHAR(255) NOT NULL,
    [Location] NVARCHAR(500) NULL,
    [Capacity] INT NULL,
    [ContactInfo] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1
);

CREATE TABLE [dbo].[Production] (
    [ProductionID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Name] NVARCHAR(255) NOT NULL,
    [VenueID] UNIQUEIDENTIFIER NULL,
    [StartDate] DATE NULL,
    [EndDate] DATE NULL,
    [Status] NVARCHAR(50) DEFAULT 'planning' CHECK ([Status] IN ('planning', 'rehearsal', 'active', 'completed', 'cancelled')),
    [Description] NVARCHAR(MAX) NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1,
    CONSTRAINT [FK_Production_Venue] FOREIGN KEY ([VenueID]) REFERENCES [dbo].[Venue]([VenueID])
);

CREATE TABLE [dbo].[CrewAssignment] (
    [AssignmentID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [ProductionID] UNIQUEIDENTIFIER NOT NULL,
    [CrewMemberName] NVARCHAR(255) NOT NULL,
    [Role] NVARCHAR(50) NOT NULL CHECK ([Role] IN ('stage_manager', 'lighting', 'sound', 'props', 'wardrobe', 'set', 'technical_director', 'other')),
    [ContactInfo] NVARCHAR(500) NULL,
    [Status] NVARCHAR(50) DEFAULT 'assigned' CHECK ([Status] IN ('assigned', 'confirmed', 'active', 'completed', 'cancelled')),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1,
    CONSTRAINT [FK_CrewAssignment_Production] FOREIGN KEY ([ProductionID]) REFERENCES [dbo].[Production]([ProductionID])
);

CREATE TABLE [dbo].[TaskChecklist] (
    [TaskID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [ProductionID] UNIQUEIDENTIFIER NOT NULL,
    [TaskName] NVARCHAR(255) NOT NULL,
    [AssignedTo] NVARCHAR(255) NULL,
    [DueDate] DATE NULL,
    [CompletionStatus] NVARCHAR(50) DEFAULT 'pending' CHECK ([CompletionStatus] IN ('pending', 'in_progress', 'completed', 'blocked')),
    [Priority] NVARCHAR(50) DEFAULT 'medium' CHECK ([Priority] IN ('low', 'medium', 'high', 'critical')),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1,
    CONSTRAINT [FK_TaskChecklist_Production] FOREIGN KEY ([ProductionID]) REFERENCES [dbo].[Production]([ProductionID])
);

CREATE TABLE [dbo].[IncidentLog] (
    [IncidentID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [ProductionID] UNIQUEIDENTIFIER NULL,
    [Description] NVARCHAR(MAX) NOT NULL,
    [Severity] NVARCHAR(50) DEFAULT 'medium' CHECK ([Severity] IN ('low', 'medium', 'high', 'critical')),
    [ResolutionStatus] NVARCHAR(50) DEFAULT 'open' CHECK ([ResolutionStatus] IN ('open', 'investigating', 'resolved', 'closed')),
    [ReportedBy] NVARCHAR(255) NULL,
    [AssignedTo] NVARCHAR(255) NULL,
    [ResolutionNotes] NVARCHAR(MAX) NULL,
    [ReportedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [ClosedAt] DATETIME2 NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1,
    CONSTRAINT [FK_IncidentLog_Production] FOREIGN KEY ([ProductionID]) REFERENCES [dbo].[Production]([ProductionID])
);

-- =============================================
-- EQUIPMENT INTELLIGENCE DOMAIN
-- =============================================

CREATE TABLE [dbo].[AssetLocation] (
    [LocationID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [LocationName] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [VenueID] UNIQUEIDENTIFIER NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1,
    CONSTRAINT [FK_AssetLocation_Venue] FOREIGN KEY ([VenueID]) REFERENCES [dbo].[Venue]([VenueID])
);

CREATE TABLE [dbo].[EquipmentAsset] (
    [AssetID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [AssetName] NVARCHAR(255) NOT NULL,
    [Category] NVARCHAR(50) NOT NULL CHECK ([Category] IN ('lighting', 'sound', 'rigging', 'staging', 'video', 'props', 'tools', 'safety', 'other')),
    [SerialNumber] NVARCHAR(100) NULL,
    [Status] NVARCHAR(50) DEFAULT 'available' CHECK ([Status] IN ('available', 'in_use', 'maintenance', 'retired')),
    [LocationID] UNIQUEIDENTIFIER NULL,
    [PurchaseDate] DATE NULL,
    [Notes] NVARCHAR(MAX) NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1,
    CONSTRAINT [FK_EquipmentAsset_Location] FOREIGN KEY ([LocationID]) REFERENCES [dbo].[AssetLocation]([LocationID])
);

CREATE TABLE [dbo].[MaintenanceRecord] (
    [MaintenanceID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [AssetID] UNIQUEIDENTIFIER NOT NULL,
    [MaintenanceType] NVARCHAR(50) NOT NULL CHECK ([MaintenanceType] IN ('routine', 'repair', 'inspection', 'calibration', 'emergency')),
    [PerformedBy] NVARCHAR(255) NULL,
    [PerformedDate] DATE NOT NULL,
    [Notes] NVARCHAR(MAX) NULL,
    [NextScheduledDate] DATE NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1,
    CONSTRAINT [FK_MaintenanceRecord_Asset] FOREIGN KEY ([AssetID]) REFERENCES [dbo].[EquipmentAsset]([AssetID])
);

CREATE TABLE [dbo].[UsageMetrics] (
    [UsageID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [AssetID] UNIQUEIDENTIFIER NOT NULL,
    [UsageHours] DECIMAL(10,2) NOT NULL,
    [UsageDate] DATE NOT NULL,
    [ProductionID] UNIQUEIDENTIFIER NULL,
    [Notes] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1,
    CONSTRAINT [FK_UsageMetrics_Asset] FOREIGN KEY ([AssetID]) REFERENCES [dbo].[EquipmentAsset]([AssetID]),
    CONSTRAINT [FK_UsageMetrics_Production] FOREIGN KEY ([ProductionID]) REFERENCES [dbo].[Production]([ProductionID])
);

-- =============================================
-- KNOWLEDGE AND DOCUMENTATION DOMAIN
-- =============================================

CREATE TABLE [dbo].[KnowledgeRecord] (
    [RecordID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [ProductionID] UNIQUEIDENTIFIER NULL,
    [Title] NVARCHAR(255) NOT NULL,
    [Category] NVARCHAR(50) NOT NULL CHECK ([Category] IN ('procedure', 'technical', 'safety', 'reference', 'lesson_learned', 'other')),
    [Content] NVARCHAR(MAX) NULL,
    [Tags] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1,
    CONSTRAINT [FK_KnowledgeRecord_Production] FOREIGN KEY ([ProductionID]) REFERENCES [dbo].[Production]([ProductionID])
);

CREATE TABLE [dbo].[CueDocumentation] (
    [CueID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [ProductionID] UNIQUEIDENTIFIER NOT NULL,
    [CueNumber] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [Department] NVARCHAR(50) NULL CHECK ([Department] IN ('lighting', 'sound', 'staging', 'video', 'fly', 'props', 'special_effects')),
    [RevisionNumber] INT DEFAULT 1,
    [Notes] NVARCHAR(MAX) NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1,
    CONSTRAINT [FK_CueDocumentation_Production] FOREIGN KEY ([ProductionID]) REFERENCES [dbo].[Production]([ProductionID])
);

CREATE TABLE [dbo].[ProcedureLibrary] (
    [ProcedureID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Title] NVARCHAR(255) NOT NULL,
    [Category] NVARCHAR(50) NOT NULL CHECK ([Category] IN ('safety', 'technical', 'operational', 'emergency', 'maintenance', 'setup', 'teardown')),
    [Description] NVARCHAR(MAX) NULL,
    [LastReviewedDate] DATE NULL,
    [Version] INT DEFAULT 1,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL
);

CREATE TABLE [dbo].[HistoricalIncidentAnalysis] (
    [AnalysisID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [IncidentID] UNIQUEIDENTIFIER NOT NULL,
    [RootCause] NVARCHAR(MAX) NOT NULL,
    [CorrectiveAction] NVARCHAR(MAX) NULL,
    [PreventativeAction] NVARCHAR(MAX) NULL,
    [AnalyzedBy] NVARCHAR(255) NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1,
    CONSTRAINT [FK_HistoricalIncidentAnalysis_Incident] FOREIGN KEY ([IncidentID]) REFERENCES [dbo].[IncidentLog]([IncidentID])
);

-- =============================================
-- AUTOMATION DOMAIN
-- =============================================

CREATE TABLE [dbo].[AutomationRule] (
    [RuleID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [RuleName] NVARCHAR(255) NOT NULL,
    [TriggerEvent] NVARCHAR(255) NOT NULL,
    [ConditionLogic] NVARCHAR(MAX) NULL,
    [ActionDefinition] NVARCHAR(MAX) NOT NULL,
    [IsActive] BIT DEFAULT 1,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1
);

CREATE TABLE [dbo].[TriggerCondition] (
    [TriggerID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [RuleID] UNIQUEIDENTIFIER NOT NULL,
    [EntityType] NVARCHAR(100) NOT NULL,
    [FieldName] NVARCHAR(100) NOT NULL,
    [ComparisonOperator] NVARCHAR(50) NOT NULL CHECK ([ComparisonOperator] IN ('equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'is_empty', 'is_not_empty')),
    [Value] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1,
    CONSTRAINT [FK_TriggerCondition_Rule] FOREIGN KEY ([RuleID]) REFERENCES [dbo].[AutomationRule]([RuleID])
);

CREATE TABLE [dbo].[WorkflowAction] (
    [ActionID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [RuleID] UNIQUEIDENTIFIER NOT NULL,
    [ActionType] NVARCHAR(50) NOT NULL CHECK ([ActionType] IN ('notify', 'create_task', 'update_status', 'send_email', 'log_event')),
    [TargetEntity] NVARCHAR(100) NULL,
    [Parameters] NVARCHAR(MAX) NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1,
    CONSTRAINT [FK_WorkflowAction_Rule] FOREIGN KEY ([RuleID]) REFERENCES [dbo].[AutomationRule]([RuleID])
);

CREATE TABLE [dbo].[ExecutionLog] (
    [ExecutionID] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [RuleID] UNIQUEIDENTIFIER NOT NULL,
    [ExecutionDate] DATETIME2 DEFAULT GETUTCDATE(),
    [Status] NVARCHAR(50) NOT NULL CHECK ([Status] IN ('success', 'failed', 'partial')),
    [ResultMessage] NVARCHAR(MAX) NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255) NULL,
    [Version] INT DEFAULT 1,
    CONSTRAINT [FK_ExecutionLog_Rule] FOREIGN KEY ([RuleID]) REFERENCES [dbo].[AutomationRule]([RuleID])
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX [IX_Production_Status] ON [dbo].[Production]([Status]);
CREATE INDEX [IX_Production_VenueID] ON [dbo].[Production]([VenueID]);
CREATE INDEX [IX_CrewAssignment_ProductionID] ON [dbo].[CrewAssignment]([ProductionID]);
CREATE INDEX [IX_TaskChecklist_ProductionID] ON [dbo].[TaskChecklist]([ProductionID]);
CREATE INDEX [IX_TaskChecklist_Status] ON [dbo].[TaskChecklist]([CompletionStatus]);
CREATE INDEX [IX_IncidentLog_ProductionID] ON [dbo].[IncidentLog]([ProductionID]);
CREATE INDEX [IX_IncidentLog_Status] ON [dbo].[IncidentLog]([ResolutionStatus]);
CREATE INDEX [IX_EquipmentAsset_Status] ON [dbo].[EquipmentAsset]([Status]);
CREATE INDEX [IX_EquipmentAsset_LocationID] ON [dbo].[EquipmentAsset]([LocationID]);
CREATE INDEX [IX_MaintenanceRecord_AssetID] ON [dbo].[MaintenanceRecord]([AssetID]);
CREATE INDEX [IX_UsageMetrics_AssetID] ON [dbo].[UsageMetrics]([AssetID]);
CREATE INDEX [IX_CueDocumentation_ProductionID] ON [dbo].[CueDocumentation]([ProductionID]);
CREATE INDEX [IX_AutomationRule_IsActive] ON [dbo].[AutomationRule]([IsActive]);
CREATE INDEX [IX_ExecutionLog_RuleID] ON [dbo].[ExecutionLog]([RuleID]);