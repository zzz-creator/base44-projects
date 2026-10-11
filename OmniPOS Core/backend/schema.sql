-- OmniPOS Core local MSSQL schema
-- Written by hand from ../entities/* per the base44-to-local workflow.
-- Apply this to your local MSSQL instance before starting the backend.

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

IF OBJECT_ID('Coupon', 'U') IS NULL
CREATE TABLE Coupon (
    id           NVARCHAR(36)  NOT NULL PRIMARY KEY,
    code         NVARCHAR(255) NULL,
    type         NVARCHAR(255) NULL DEFAULT 'percent',
    value        FLOAT         NULL,
    category     NVARCHAR(255) NULL,
    min_purchase FLOAT         NULL DEFAULT 0,
    max_uses     FLOAT         NULL,
    uses         FLOAT         NULL DEFAULT 0,
    active       BIT           NULL DEFAULT 1,
    expires      NVARCHAR(255) NULL,
    description  NVARCHAR(MAX) NULL,
    created_date DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date DATETIME2     NULL
);

IF OBJECT_ID('Customer', 'U') IS NULL
CREATE TABLE Customer (
    id             NVARCHAR(36)  NOT NULL PRIMARY KEY,
    first_name     NVARCHAR(255) NULL,
    last_name      NVARCHAR(255) NULL,
    email          NVARCHAR(255) NULL,
    phone          NVARCHAR(255) NULL,
    address        NVARCHAR(255) NULL,
    loyalty_points FLOAT         NULL DEFAULT 0,
    total_spent    FLOAT         NULL DEFAULT 0,
    visit_count    FLOAT         NULL DEFAULT 0,
    notes          NVARCHAR(MAX) NULL,
    active         BIT           NULL DEFAULT 1,
    created_date   DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date   DATETIME2     NULL
);

IF OBJECT_ID('GiftCard', 'U') IS NULL
CREATE TABLE GiftCard (
    id               NVARCHAR(36)  NOT NULL PRIMARY KEY,
    code             NVARCHAR(255) NULL,
    balance          FLOAT         NULL,
    original_balance FLOAT         NULL,
    status           NVARCHAR(255) NULL DEFAULT 'active',
    issued_by        NVARCHAR(255) NULL,
    notes            NVARCHAR(MAX) NULL,
    created_date     DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date     DATETIME2     NULL
);

IF OBJECT_ID('Product', 'U') IS NULL
CREATE TABLE Product (
    id             NVARCHAR(36)  NOT NULL PRIMARY KEY,
    name           NVARCHAR(255) NULL,
    barcode        NVARCHAR(255) NULL,
    price          FLOAT         NULL,
    category       NVARCHAR(255) NULL,
    stock          FLOAT         NULL DEFAULT 0,
    age_restricted BIT           NULL DEFAULT 0,
    created_date   DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date   DATETIME2     NULL
);

IF OBJECT_ID('PurchaseOrder', 'U') IS NULL
CREATE TABLE PurchaseOrder (
    id            NVARCHAR(36)  NOT NULL PRIMARY KEY,
    po_number     NVARCHAR(255) NULL,
    supplier_id   NVARCHAR(255) NULL,
    supplier_name NVARCHAR(255) NULL,
    items         NVARCHAR(MAX) NULL,
    status        NVARCHAR(255) NULL DEFAULT 'draft',
    total         FLOAT         NULL,
    notes         NVARCHAR(MAX) NULL,
    ordered_date  NVARCHAR(255) NULL,
    received_date NVARCHAR(255) NULL,
    created_date  DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date  DATETIME2     NULL
);

IF OBJECT_ID('ScheduledShift', 'U') IS NULL
CREATE TABLE ScheduledShift (
    id              NVARCHAR(36)  NOT NULL PRIMARY KEY,
    staff_id        NVARCHAR(255) NULL,
    staff_name      NVARCHAR(255) NULL,
    date            DATETIME2     NULL,
    start_time      NVARCHAR(255) NULL,
    end_time        NVARCHAR(255) NULL,
    scheduled_hours FLOAT         NULL,
    hourly_rate     FLOAT         NULL DEFAULT 0,
    role            NVARCHAR(255) NULL,
    notes           NVARCHAR(MAX) NULL,
    status          NVARCHAR(255) NULL DEFAULT 'scheduled',
    created_date    DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date    DATETIME2     NULL
);

IF OBJECT_ID('SecurityLog', 'U') IS NULL
CREATE TABLE SecurityLog (
    id           NVARCHAR(36)  NOT NULL PRIMARY KEY,
    event_type   NVARCHAR(255) NULL,
    staff_id     NVARCHAR(255) NULL,
    terminal_id  NVARCHAR(255) NULL,
    description  NVARCHAR(MAX) NULL,
    metadata     NVARCHAR(MAX) NULL,
    timestamp    NVARCHAR(255) NULL,
    created_date DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date DATETIME2     NULL
);

IF OBJECT_ID('ShiftSession', 'U') IS NULL
CREATE TABLE ShiftSession (
    id                 NVARCHAR(36)  NOT NULL PRIMARY KEY,
    staff_id           NVARCHAR(255) NULL,
    terminal_id        NVARCHAR(255) NULL,
    login_time         NVARCHAR(255) NULL,
    logout_time        NVARCHAR(255) NULL,
    opening_float      FLOAT         NULL,
    transactions_count FLOAT         NULL DEFAULT 0,
    discount_count     FLOAT         NULL DEFAULT 0,
    void_count         FLOAT         NULL DEFAULT 0,
    status             NVARCHAR(255) NULL DEFAULT 'active',
    created_date       DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date       DATETIME2     NULL
);

IF OBJECT_ID('Staff', 'U') IS NULL
CREATE TABLE Staff (
    id           NVARCHAR(36)  NOT NULL PRIMARY KEY,
    staff_id     NVARCHAR(255) NULL,
    name         NVARCHAR(255) NULL,
    role         NVARCHAR(255) NULL DEFAULT 'cashier',
    pin          NVARCHAR(255) NULL,
    badge_code   NVARCHAR(255) NULL,
    active       BIT           NULL DEFAULT 1,
    last_login   NVARCHAR(255) NULL,
    created_date DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date DATETIME2     NULL
);

IF OBJECT_ID('StoreSettings', 'U') IS NULL
CREATE TABLE StoreSettings (
    id              NVARCHAR(36)  NOT NULL PRIMARY KEY,
    store_name      NVARCHAR(255) NULL,
    store_id        NVARCHAR(255) NULL,
    terminal_id     NVARCHAR(255) NULL,
    address         NVARCHAR(255) NULL,
    city            NVARCHAR(255) NULL,
    phone           NVARCHAR(255) NULL,
    website         NVARCHAR(255) NULL,
    taxes           NVARCHAR(MAX) NULL,
    tips_enabled    BIT           NULL DEFAULT 0,
    tip_options     NVARCHAR(MAX) NULL,
    footer_message  NVARCHAR(255) NULL,
    return_policy   NVARCHAR(255) NULL,
    currency_symbol NVARCHAR(255) NULL DEFAULT '$',
    created_date    DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date    DATETIME2     NULL
);

IF OBJECT_ID('Supplier', 'U') IS NULL
CREATE TABLE Supplier (
    id           NVARCHAR(36)  NOT NULL PRIMARY KEY,
    name         NVARCHAR(255) NULL,
    contact_name NVARCHAR(255) NULL,
    email        NVARCHAR(255) NULL,
    phone        NVARCHAR(255) NULL,
    address      NVARCHAR(255) NULL,
    notes        NVARCHAR(MAX) NULL,
    active       BIT           NULL DEFAULT 1,
    created_date DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date DATETIME2     NULL
);

IF OBJECT_ID('Transaction', 'U') IS NULL
CREATE TABLE [Transaction] (
    id             NVARCHAR(36)  NOT NULL PRIMARY KEY,
    transaction_id NVARCHAR(255) NULL,
    staff_id       NVARCHAR(255) NULL,
    terminal_id    NVARCHAR(255) NULL,
    items          NVARCHAR(MAX) NULL,
    subtotal       FLOAT         NULL,
    tax            FLOAT         NULL,
    discount       FLOAT         NULL DEFAULT 0,
    total          FLOAT         NULL,
    payment_method NVARCHAR(255) NULL,
    status         NVARCHAR(255) NULL DEFAULT 'pending',
    mode           NVARCHAR(255) NULL DEFAULT 'staff',
    timestamp      NVARCHAR(255) NULL,
    created_date   DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_date   DATETIME2     NULL
);
