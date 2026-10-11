-- SAS (Strategic Authentication System) Codes Table
CREATE TABLE SASCodes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code1 VARCHAR(6) NOT NULL,
    Code2 VARCHAR(6) NOT NULL,
    GeneratedAt DATETIME2 DEFAULT GETDATE(),
    ExpiresAt DATETIME2 NOT NULL,
    Used BIT DEFAULT 0,
    UsedAt DATETIME2 NULL
);

-- Index for faster lookups
CREATE INDEX IX_SASCodes_ExpiresAt ON SASCodes(ExpiresAt);
CREATE INDEX IX_SASCodes_Used ON SASCodes(Used);
