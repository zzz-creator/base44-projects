-- SQL Server Schema for Strategic Command Simulator
-- Run this script to create the database structure for offline mode

-- Create Database (run separately if needed)
-- CREATE DATABASE StrategicCommandSimulator;
-- GO
-- USE StrategicCommandSimulator;
-- GO

-- =============================================
-- MissionScenario Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MissionScenario')
BEGIN
    CREATE TABLE MissionScenario (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        created_date DATETIME2 DEFAULT GETUTCDATE(),
        updated_date DATETIME2 DEFAULT GETUTCDATE(),
        created_by NVARCHAR(255),
        
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        difficulty NVARCHAR(50) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
        category NVARCHAR(50) DEFAULT 'training' CHECK (category IN ('training', 'assessment', 'emergency', 'custom')),
        objectives NVARCHAR(MAX), -- JSON array of strings
        faultConfig NVARCHAR(MAX), -- JSON object
        environmentConfig NVARCHAR(MAX), -- JSON object
        timeLimit INT,
        targetCoords NVARCHAR(MAX), -- JSON object
        trainingCodes NVARCHAR(MAX), -- JSON array of strings
        successCriteria NVARCHAR(MAX), -- JSON object
        metadata NVARCHAR(MAX), -- JSON object
        isPublic BIT DEFAULT 0,
        timesPlayed INT DEFAULT 0,
        avgScore DECIMAL(5,2) DEFAULT 0,
        version INT DEFAULT 1,
        parentScenarioId UNIQUEIDENTIFIER,
        versionNotes NVARCHAR(MAX),
        isLatestVersion BIT DEFAULT 1
    );
    
    CREATE INDEX IX_MissionScenario_Name ON MissionScenario(name);
    CREATE INDEX IX_MissionScenario_Difficulty ON MissionScenario(difficulty);
    CREATE INDEX IX_MissionScenario_ParentId ON MissionScenario(parentScenarioId);
    CREATE INDEX IX_MissionScenario_CreatedDate ON MissionScenario(created_date DESC);
END
GO

-- =============================================
-- MissionPerformance Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MissionPerformance')
BEGIN
    CREATE TABLE MissionPerformance (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        created_date DATETIME2 DEFAULT GETUTCDATE(),
        updated_date DATETIME2 DEFAULT GETUTCDATE(),
        created_by NVARCHAR(255),
        
        scenarioId NVARCHAR(255) NOT NULL,
        scenarioName NVARCHAR(255),
        difficulty NVARCHAR(50) CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
        category NVARCHAR(50) CHECK (category IN ('training', 'assessment', 'emergency', 'custom')),
        completionStatus NVARCHAR(50) NOT NULL CHECK (completionStatus IN ('completed', 'aborted', 'failed', 'timeout')),
        score DECIMAL(5,2),
        completionTime INT, -- milliseconds
        phaseReached INT,
        errorCount INT DEFAULT 0,
        warningCount INT DEFAULT 0,
        failurePoints NVARCHAR(MAX), -- JSON array of strings
        checklistCompletion DECIMAL(5,2),
        diagnosticResults NVARCHAR(MAX), -- JSON object
        environmentConditions NVARCHAR(MAX) -- JSON object
    );
    
    CREATE INDEX IX_MissionPerformance_ScenarioId ON MissionPerformance(scenarioId);
    CREATE INDEX IX_MissionPerformance_Status ON MissionPerformance(completionStatus);
    CREATE INDEX IX_MissionPerformance_CreatedDate ON MissionPerformance(created_date DESC);
    CREATE INDEX IX_MissionPerformance_Difficulty ON MissionPerformance(difficulty);
END
GO

-- =============================================
-- AdminAuditLog Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AdminAuditLog')
BEGIN
    CREATE TABLE AdminAuditLog (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        created_date DATETIME2 DEFAULT GETUTCDATE(),
        updated_date DATETIME2 DEFAULT GETUTCDATE(),
        created_by NVARCHAR(255),
        
        action NVARCHAR(50) NOT NULL CHECK (action IN (
            'LOGIN', 'LOGOUT', 'ROLE_CHANGE', 'ACCESS_REVOKED', 'ACCESS_GRANTED',
            'SCENARIO_CREATED', 'FAULT_INJECTED', 'SYSTEM_LOCK', 'PASSWORD_RESET',
            'ADMIN_DISABLED', 'ADMIN_ENABLED'
        )),
        targetUser NVARCHAR(255),
        performedBy NVARCHAR(255) NOT NULL,
        details NVARCHAR(MAX), -- JSON object
        ipAddress NVARCHAR(50),
        success BIT DEFAULT 1,
        errorMessage NVARCHAR(MAX)
    );
    
    CREATE INDEX IX_AdminAuditLog_Action ON AdminAuditLog(action);
    CREATE INDEX IX_AdminAuditLog_PerformedBy ON AdminAuditLog(performedBy);
    CREATE INDEX IX_AdminAuditLog_CreatedDate ON AdminAuditLog(created_date DESC);
END
GO

-- =============================================
-- AdminAccessControl Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AdminAccessControl')
BEGIN
    CREATE TABLE AdminAccessControl (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        created_date DATETIME2 DEFAULT GETUTCDATE(),
        updated_date DATETIME2 DEFAULT GETUTCDATE(),
        created_by NVARCHAR(255),
        
        userEmail NVARCHAR(255) NOT NULL,
        adminAccessEnabled BIT DEFAULT 0,
        isSuperAdmin BIT DEFAULT 0,
        accessDisabledReason NVARCHAR(MAX),
        accessDisabledUntil DATETIME2,
        lastLoginTime DATETIME2,
        lastActivityTime DATETIME2,
        failedLoginAttempts INT DEFAULT 0,
        sessionToken NVARCHAR(500),
        sessionExpiresAt DATETIME2
    );
    
    CREATE UNIQUE INDEX IX_AdminAccessControl_UserEmail ON AdminAccessControl(userEmail);
    CREATE INDEX IX_AdminAccessControl_SessionToken ON AdminAccessControl(sessionToken);
END
GO

-- =============================================
-- Users Table (mirrors Base44 User entity)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        created_date DATETIME2 DEFAULT GETUTCDATE(),
        updated_date DATETIME2 DEFAULT GETUTCDATE(),
        
        email NVARCHAR(255) NOT NULL,
        full_name NVARCHAR(255),
        email NVARCHAR(255) NOT NULL,
        full_name NVARCHAR(255),
        password NVARCHAR(255), -- Plaintext as requested
        role NVARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user'))
    );
    
    CREATE UNIQUE INDEX IX_Users_Email ON Users(email);

    -- Seed Default Admin
    IF NOT EXISTS (SELECT * FROM Users WHERE email = 'admin@centcom.com')
    BEGIN
        INSERT INTO Users (email, full_name, password, role)
        VALUES ('admin@centcom.com', 'CENTCOM Commander', 'SUPERVISOR-OMEGA-1', 'admin');
    END
END
GO

-- =============================================
-- Triggers for updated_date
-- =============================================
CREATE OR ALTER TRIGGER TR_MissionScenario_UpdateDate ON MissionScenario
AFTER UPDATE AS
BEGIN
    UPDATE MissionScenario SET updated_date = GETUTCDATE()
    WHERE id IN (SELECT id FROM inserted);
END
GO

CREATE OR ALTER TRIGGER TR_MissionPerformance_UpdateDate ON MissionPerformance
AFTER UPDATE AS
BEGIN
    UPDATE MissionPerformance SET updated_date = GETUTCDATE()
    WHERE id IN (SELECT id FROM inserted);
END
GO

CREATE OR ALTER TRIGGER TR_AdminAuditLog_UpdateDate ON AdminAuditLog
AFTER UPDATE AS
BEGIN
    UPDATE AdminAuditLog SET updated_date = GETUTCDATE()
    WHERE id IN (SELECT id FROM inserted);
END
GO

CREATE OR ALTER TRIGGER TR_AdminAccessControl_UpdateDate ON AdminAccessControl
AFTER UPDATE AS
BEGIN
    UPDATE AdminAccessControl SET updated_date = GETUTCDATE()
    WHERE id IN (SELECT id FROM inserted);
END
GO

CREATE OR ALTER TRIGGER TR_Users_UpdateDate ON Users
AFTER UPDATE AS
BEGIN
    UPDATE Users SET updated_date = GETUTCDATE()
    WHERE id IN (SELECT id FROM inserted);
END
GO

PRINT 'Schema creation complete.';