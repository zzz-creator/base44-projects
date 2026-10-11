-- Stored Procedures for Strategic Command Simulator
-- These provide optimized queries for common operations

USE StrategicCommandSimulator;
GO

-- =============================================
-- Get Mission Analytics Summary
-- =============================================
CREATE OR ALTER PROCEDURE sp_GetMissionAnalytics
    @TimeRangeDays INT = NULL,
    @Difficulty NVARCHAR(50) = NULL,
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @StartDate DATETIME2 = CASE 
        WHEN @TimeRangeDays IS NOT NULL THEN DATEADD(DAY, -@TimeRangeDays, GETUTCDATE())
        ELSE '1900-01-01'
    END;

    -- Summary metrics
    SELECT
        COUNT(*) AS TotalMissions,
        COUNT(CASE WHEN completionStatus = 'completed' THEN 1 END) AS CompletedMissions,
        CAST(COUNT(CASE WHEN completionStatus = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) AS CompletionRate,
        AVG(score) AS AvgScore,
        AVG(completionTime) AS AvgCompletionTime,
        SUM(errorCount) AS TotalErrors,
        SUM(warningCount) AS TotalWarnings
    FROM MissionPerformance
    WHERE created_date >= @StartDate
        AND (@Difficulty IS NULL OR difficulty = @Difficulty)
        AND (@Category IS NULL OR category = @Category);

    -- By difficulty
    SELECT
        difficulty,
        COUNT(*) AS Count,
        AVG(score) AS AvgScore,
        AVG(completionTime) AS AvgTime
    FROM MissionPerformance
    WHERE created_date >= @StartDate
        AND (@Difficulty IS NULL OR difficulty = @Difficulty)
        AND (@Category IS NULL OR category = @Category)
    GROUP BY difficulty;

    -- By status
    SELECT
        completionStatus,
        COUNT(*) AS Count
    FROM MissionPerformance
    WHERE created_date >= @StartDate
        AND (@Difficulty IS NULL OR difficulty = @Difficulty)
        AND (@Category IS NULL OR category = @Category)
    GROUP BY completionStatus;

    -- Daily trend (last 14 days)
    SELECT
        CAST(created_date AS DATE) AS Date,
        COUNT(*) AS Missions,
        AVG(score) AS AvgScore
    FROM MissionPerformance
    WHERE created_date >= DATEADD(DAY, -14, GETUTCDATE())
        AND (@Difficulty IS NULL OR difficulty = @Difficulty)
        AND (@Category IS NULL OR category = @Category)
    GROUP BY CAST(created_date AS DATE)
    ORDER BY Date;
END
GO

-- =============================================
-- Get Common Failure Points
-- =============================================
CREATE OR ALTER PROCEDURE sp_GetFailurePoints
    @TopN INT = 10,
    @TimeRangeDays INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @StartDate DATETIME2 = CASE 
        WHEN @TimeRangeDays IS NOT NULL THEN DATEADD(DAY, -@TimeRangeDays, GETUTCDATE())
        ELSE '1900-01-01'
    END;

    -- Parse JSON array and count failure points
    SELECT TOP (@TopN)
        fp.value AS FailurePoint,
        COUNT(*) AS Count
    FROM MissionPerformance mp
    CROSS APPLY OPENJSON(mp.failurePoints) AS fp
    WHERE mp.created_date >= @StartDate
        AND mp.failurePoints IS NOT NULL
    GROUP BY fp.value
    ORDER BY COUNT(*) DESC;
END
GO

-- =============================================
-- Get Scenario Version History
-- =============================================
CREATE OR ALTER PROCEDURE sp_GetScenarioVersionHistory
    @ScenarioId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ParentId UNIQUEIDENTIFIER;
    
    -- Get the parent ID (or use current if it's the parent)
    SELECT @ParentId = COALESCE(parentScenarioId, id)
    FROM MissionScenario
    WHERE id = @ScenarioId;

    -- Get all versions
    SELECT *
    FROM MissionScenario
    WHERE id = @ParentId OR parentScenarioId = @ParentId
    ORDER BY version DESC;
END
GO

-- =============================================
-- Create New Scenario Version
-- =============================================
CREATE OR ALTER PROCEDURE sp_CreateScenarioVersion
    @SourceScenarioId UNIQUEIDENTIFIER,
    @VersionNotes NVARCHAR(MAX) = NULL,
    @CreatedBy NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    DECLARE @ParentId UNIQUEIDENTIFIER;
    DECLARE @NewVersion INT;
    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

    -- Get parent and current max version
    SELECT 
        @ParentId = COALESCE(parentScenarioId, id),
        @NewVersion = ISNULL(MAX(version), 0) + 1
    FROM MissionScenario
    WHERE id = @SourceScenarioId OR parentScenarioId = (
        SELECT COALESCE(parentScenarioId, id) FROM MissionScenario WHERE id = @SourceScenarioId
    )
    GROUP BY COALESCE(parentScenarioId, id);

    -- Mark current latest as not latest
    UPDATE MissionScenario
    SET isLatestVersion = 0
    WHERE (id = @ParentId OR parentScenarioId = @ParentId)
        AND isLatestVersion = 1;

    -- Insert new version
    INSERT INTO MissionScenario (
        id, name, description, difficulty, category, objectives, faultConfig,
        environmentConfig, timeLimit, targetCoords, trainingCodes, successCriteria,
        metadata, isPublic, version, parentScenarioId, versionNotes, isLatestVersion, created_by
    )
    SELECT
        @NewId, name, description, difficulty, category, objectives, faultConfig,
        environmentConfig, timeLimit, targetCoords, trainingCodes, successCriteria,
        metadata, isPublic, @NewVersion, @ParentId, @VersionNotes, 1, @CreatedBy
    FROM MissionScenario
    WHERE id = @SourceScenarioId;

    COMMIT;

    SELECT * FROM MissionScenario WHERE id = @NewId;
END
GO

-- =============================================
-- Revert to Scenario Version
-- =============================================
CREATE OR ALTER PROCEDURE sp_RevertScenarioVersion
    @VersionId UNIQUEIDENTIFIER,
    @CreatedBy NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @VersionNotes NVARCHAR(MAX);
    SELECT @VersionNotes = CONCAT('Reverted to version ', version)
    FROM MissionScenario WHERE id = @VersionId;

    EXEC sp_CreateScenarioVersion @VersionId, @VersionNotes, @CreatedBy;
END
GO

-- =============================================
-- Get Top Performing Scenarios
-- =============================================
CREATE OR ALTER PROCEDURE sp_GetTopScenarios
    @TopN INT = 10,
    @OrderBy NVARCHAR(50) = 'plays' -- 'plays', 'score', 'completion'
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@TopN)
        scenarioName,
        COUNT(*) AS Plays,
        AVG(score) AS AvgScore,
        CAST(COUNT(CASE WHEN completionStatus = 'completed' THEN 1 END) * 100.0 / COUNT(*) AS DECIMAL(5,2)) AS CompletionRate
    FROM MissionPerformance
    WHERE scenarioName IS NOT NULL
    GROUP BY scenarioName
    ORDER BY 
        CASE @OrderBy
            WHEN 'plays' THEN COUNT(*)
            WHEN 'score' THEN AVG(score)
            WHEN 'completion' THEN COUNT(CASE WHEN completionStatus = 'completed' THEN 1 END) * 100.0 / COUNT(*)
        END DESC;
END
GO

-- =============================================
-- Record Admin Audit Log
-- =============================================
CREATE OR ALTER PROCEDURE sp_LogAdminAction
    @Action NVARCHAR(50),
    @PerformedBy NVARCHAR(255),
    @TargetUser NVARCHAR(255) = NULL,
    @Details NVARCHAR(MAX) = NULL,
    @IpAddress NVARCHAR(50) = NULL,
    @Success BIT = 1,
    @ErrorMessage NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AdminAuditLog (action, performedBy, targetUser, details, ipAddress, success, errorMessage)
    VALUES (@Action, @PerformedBy, @TargetUser, @Details, @IpAddress, @Success, @ErrorMessage);

    SELECT SCOPE_IDENTITY() AS LogId;
END
GO

-- =============================================
-- Check Admin Session Validity
-- =============================================
CREATE OR ALTER PROCEDURE sp_ValidateAdminSession
    @SessionToken NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ac.*,
        u.full_name,
        u.role
    FROM AdminAccessControl ac
    INNER JOIN Users u ON ac.userEmail = u.email
    WHERE ac.sessionToken = @SessionToken
        AND ac.adminAccessEnabled = 1
        AND (ac.sessionExpiresAt IS NULL OR ac.sessionExpiresAt > GETUTCDATE())
        AND (ac.accessDisabledUntil IS NULL OR ac.accessDisabledUntil < GETUTCDATE());

    -- Update last activity if valid
    UPDATE AdminAccessControl
    SET lastActivityTime = GETUTCDATE()
    WHERE sessionToken = @SessionToken
        AND adminAccessEnabled = 1
        AND (sessionExpiresAt IS NULL OR sessionExpiresAt > GETUTCDATE());
END
GO

PRINT 'Stored procedures created successfully.';