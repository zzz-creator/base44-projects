-- Nuclear Launch Sim local MSSQL schema
-- Hand-written from ../entities/* plus the Users auth table, per the
-- base44-to-local workflow. Apply this to your local MSSQL instance before
-- starting the backend. Table names match backend/routes/api.js ALLOWED_TABLES.

IF OBJECT_ID('MissionScenario', 'U') IS NULL
CREATE TABLE MissionScenario (
    id                NVARCHAR(36)  NOT NULL PRIMARY KEY,
    name              NVARCHAR(255) NOT NULL,
    description       NVARCHAR(MAX) NULL,
    difficulty        NVARCHAR(50)  NOT NULL DEFAULT 'medium',
    category          NVARCHAR(50)  NOT NULL DEFAULT 'training',
    objectives        NVARCHAR(MAX) NULL,
    faultConfig       NVARCHAR(MAX) NULL,
    environmentConfig NVARCHAR(MAX) NULL,
    timeLimit         INT           NULL,
    targetCoords      NVARCHAR(MAX) NULL,
    trainingCodes     NVARCHAR(MAX) NULL,
    successCriteria   NVARCHAR(MAX) NULL,
    metadata          NVARCHAR(MAX) NULL,
    isPublic          BIT           NOT NULL DEFAULT 0,
    timesPlayed       INT           NOT NULL DEFAULT 0,
    avgScore          FLOAT         NOT NULL DEFAULT 0,
    version           INT           NOT NULL DEFAULT 1,
    parentScenarioId  NVARCHAR(36)  NULL,
    versionNotes      NVARCHAR(MAX) NULL,
    isLatestVersion   BIT           NOT NULL DEFAULT 1,
    created_date      DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date      DATETIME2     NULL
);

IF OBJECT_ID('MissionPerformance', 'U') IS NULL
CREATE TABLE MissionPerformance (
    id                    NVARCHAR(36)  NOT NULL PRIMARY KEY,
    scenarioId            NVARCHAR(36)  NOT NULL,
    scenarioName          NVARCHAR(255) NULL,
    difficulty            NVARCHAR(50)  NULL,
    category              NVARCHAR(50)  NULL,
    completionStatus      NVARCHAR(50)  NOT NULL,
    score                 FLOAT         NULL,
    completionTime        INT           NULL,
    phaseReached          INT           NULL,
    errorCount            INT           NOT NULL DEFAULT 0,
    warningCount          INT           NOT NULL DEFAULT 0,
    failurePoints         NVARCHAR(MAX) NULL,
    checklistCompletion   FLOAT         NULL,
    diagnosticResults     NVARCHAR(MAX) NULL,
    environmentConditions NVARCHAR(MAX) NULL,
    created_date          DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date          DATETIME2     NULL
);

IF OBJECT_ID('AdminAuditLog', 'U') IS NULL
CREATE TABLE AdminAuditLog (
    id           NVARCHAR(36)  NOT NULL PRIMARY KEY,
    action       NVARCHAR(50)  NOT NULL,
    targetUser   NVARCHAR(255) NULL,
    performedBy  NVARCHAR(255) NOT NULL,
    details      NVARCHAR(MAX) NULL,
    ipAddress    NVARCHAR(255) NULL,
    success      BIT           NOT NULL DEFAULT 1,
    errorMessage NVARCHAR(MAX) NULL,
    created_date DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date DATETIME2     NULL
);

IF OBJECT_ID('AdminAccessControl', 'U') IS NULL
CREATE TABLE AdminAccessControl (
    id                   NVARCHAR(36)  NOT NULL PRIMARY KEY,
    userEmail            NVARCHAR(255) NOT NULL,
    adminAccessEnabled   BIT           NOT NULL DEFAULT 0,
    isSuperAdmin         BIT           NOT NULL DEFAULT 0,
    accessDisabledReason NVARCHAR(MAX) NULL,
    accessDisabledUntil  DATETIME2     NULL,
    lastLoginTime        DATETIME2     NULL,
    lastActivityTime     DATETIME2     NULL,
    failedLoginAttempts  INT           NOT NULL DEFAULT 0,
    sessionToken         NVARCHAR(255) NULL,
    sessionExpiresAt     DATETIME2     NULL,
    created_date         DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date         DATETIME2     NULL
);

IF OBJECT_ID('Users', 'U') IS NULL
CREATE TABLE Users (
    id            NVARCHAR(36)  NOT NULL PRIMARY KEY,
    email         NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    full_name     NVARCHAR(255) NULL,
    role          NVARCHAR(50)  NOT NULL DEFAULT 'user',
    created_date  DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date  DATETIME2     NULL
);

-- Seed the local administrator. The existing backend compares this value in
-- plaintext (see routes/auth.js login), matching the prior project behaviour.
IF OBJECT_ID('Users', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM Users WHERE email = 'admin@centcom.com')
BEGIN
    INSERT INTO Users (id, email, password_hash, full_name, role)
    VALUES (CONVERT(NVARCHAR(36), NEWID()), 'admin@centcom.com', 'SUPERVISOR-OMEGA-1', 'CENTCOM Commander', 'admin');
END
