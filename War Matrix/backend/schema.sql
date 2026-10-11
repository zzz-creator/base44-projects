-- War Matrix local MSSQL schema
-- Hand-written from ../entities/* plus the Users auth table, per the
-- base44-to-local workflow. Apply this to your local MSSQL instance before
-- starting the backend. Table names match backend/routes/api.js ALLOWED_TABLES.

IF OBJECT_ID('Alert', 'U') IS NULL
CREATE TABLE Alert (
    id                    NVARCHAR(36)  NOT NULL PRIMARY KEY,
    created_by            NVARCHAR(255) NULL,
    alert_name            NVARCHAR(255) NOT NULL,
    regions               NVARCHAR(MAX) NULL,
    conflict_types        NVARCHAR(MAX) NULL,
    keywords              NVARCHAR(MAX) NULL,
    probability_threshold FLOAT         NULL,
    severity_threshold    NVARCHAR(255) NULL,
    notification_methods  NVARCHAR(MAX) NULL,
    is_active             BIT           NOT NULL DEFAULT 0,
    last_triggered        DATETIME2     NULL,
    trigger_count         FLOAT         NULL,
    created_date          DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date          DATETIME2     NULL
);

IF OBJECT_ID('AlertRecord', 'U') IS NULL
CREATE TABLE AlertRecord (
    id                   NVARCHAR(36)  NOT NULL PRIMARY KEY,
    alert_type           NVARCHAR(255) NOT NULL,
    severity             NVARCHAR(255) NOT NULL,
    title                NVARCHAR(255) NOT NULL,
    message              NVARCHAR(MAX) NULL,
    ai_summary           NVARCHAR(MAX) NULL,
    ai_priority_score    FLOAT         NULL,
    historical_context   NVARCHAR(MAX) NULL,
    related_events       NVARCHAR(MAX) NULL,
    geographical_context NVARCHAR(MAX) NULL,
    impact_analysis      NVARCHAR(MAX) NULL,
    status               NVARCHAR(255) NULL DEFAULT 'new',
    assigned_to          NVARCHAR(255) NULL,
    notes                NVARCHAR(MAX) NULL,
    actions_taken        NVARCHAR(MAX) NULL,
    read                 BIT           NOT NULL DEFAULT 0,
    source               NVARCHAR(255) NULL,
    created_date         DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date         DATETIME2     NULL
);

IF OBJECT_ID('AlertRule', 'U') IS NULL
CREATE TABLE AlertRule (
    id                   NVARCHAR(36)  NOT NULL PRIMARY KEY,
    created_by           NVARCHAR(255) NULL,
    rule_name            NVARCHAR(255) NOT NULL,
    rule_logic           NVARCHAR(255) NULL DEFAULT 'AND',
    conditions           NVARCHAR(MAX) NULL,
    total_score          FLOAT         NULL,
    notification_methods NVARCHAR(MAX) NULL,
    is_active            BIT           NOT NULL DEFAULT 0,
    last_triggered       DATETIME2     NULL,
    trigger_count        FLOAT         NULL,
    created_date         DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date         DATETIME2     NULL
);

IF OBJECT_ID('AppConfig', 'U') IS NULL
CREATE TABLE AppConfig (
    id                   NVARCHAR(36)  NOT NULL PRIMARY KEY,
    config_key           NVARCHAR(255) NOT NULL,
    background_music_url NVARCHAR(255) NULL,
    background_video_url NVARCHAR(255) NULL,
    sound_effects        NVARCHAR(MAX) NULL,
    theme_settings       NVARCHAR(MAX) NULL,
    created_date         DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date         DATETIME2     NULL
);

IF OBJECT_ID('Prediction', 'U') IS NULL
CREATE TABLE Prediction (
    id                     NVARCHAR(36)  NOT NULL PRIMARY KEY,
    created_by             NVARCHAR(255) NULL,
    year                   FLOAT         NOT NULL,
    type                   NVARCHAR(255) NOT NULL,
    scenario               NVARCHAR(MAX) NOT NULL,
    probability            FLOAT         NOT NULL,
    factors                NVARCHAR(MAX) NULL,
    affected_regions       NVARCHAR(MAX) NULL,
    potential_wars         NVARCHAR(MAX) NULL,
    economic_indicators    NVARCHAR(MAX) NULL,
    is_galactic            BIT           NOT NULL DEFAULT 0,
    alien_species_involved NVARCHAR(255) NULL,
    created_date           DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date           DATETIME2     NULL
);

IF OBJECT_ID('UserProfile', 'U') IS NULL
CREATE TABLE UserProfile (
    id                            NVARCHAR(36)  NOT NULL PRIMARY KEY,
    created_by                    NVARCHAR(255) NULL,
    dashboard_layout              NVARCHAR(MAX) NULL,
    default_regions               NVARCHAR(MAX) NULL,
    preferred_visualization_types NVARCHAR(MAX) NULL,
    saved_analysis_templates      NVARCHAR(MAX) NULL,
    external_data_feeds           NVARCHAR(MAX) NULL,
    alert_preferences             NVARCHAR(MAX) NULL,
    dashboard_alert_thresholds    NVARCHAR(MAX) NULL,
    future_wars_alert_thresholds  NVARCHAR(MAX) NULL,
    selected_theme                NVARCHAR(255) NULL,
    saved_policy_simulations      NVARCHAR(MAX) NULL,
    created_date                  DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date                  DATETIME2     NULL
);

IF OBJECT_ID('War', 'U') IS NULL
CREATE TABLE War (
    id                 NVARCHAR(36)  NOT NULL PRIMARY KEY,
    name               NVARCHAR(255) NOT NULL,
    countries_involved NVARCHAR(MAX) NULL,
    start_date         DATETIME2     NULL,
    end_date           DATETIME2     NULL,
    status             NVARCHAR(255) NOT NULL,
    type               NVARCHAR(255) NULL,
    casualties         NVARCHAR(MAX) NULL,
    countries_data     NVARCHAR(MAX) NULL,
    description        NVARCHAR(MAX) NULL,
    economic_impact    FLOAT         NULL,
    probability        FLOAT         NULL,
    year               FLOAT         NULL,
    era                NVARCHAR(255) NOT NULL,
    created_date       DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date       DATETIME2     NULL
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
