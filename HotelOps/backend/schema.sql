-- HotelOps - MSSQL Schema
-- Generated from entity definitions



-- ─── Authentication ───────────────────────────────────────────────────────────

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

-- ─── Entities ─────────────────────────────────────────────────────────────────

IF OBJECT_ID('Floor', 'U') IS NULL
CREATE TABLE Floor (
    FloorID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    FloorNumber INT,
    Name NVARCHAR(255),
    TotalRooms INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Room', 'U') IS NULL
CREATE TABLE Room (
    RoomID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RoomNumber NVARCHAR(50),
    FloorID NVARCHAR(100),
    RoomType NVARCHAR(50) DEFAULT 'standard',
    Status NVARCHAR(50) DEFAULT 'available',
    RatePerNight FLOAT DEFAULT 0,
    MaxOccupancy INT DEFAULT 2,
    Amenities NVARCHAR(MAX), -- JSON array
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Guest', 'U') IS NULL
CREATE TABLE Guest (
    GuestID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    FirstName NVARCHAR(255),
    LastName NVARCHAR(255),
    Email NVARCHAR(255),
    Phone NVARCHAR(50),
    VipStatus BIT DEFAULT 0,
    LoyaltyTier NVARCHAR(50) DEFAULT 'standard',
    Status NVARCHAR(50) DEFAULT 'reserved',
    MarketingOptIn BIT DEFAULT 1,
    PreferredContactMethod NVARCHAR(50) DEFAULT 'email',
    LastCampaignDate DATETIME2,
    TotalCampaignsReceived INT DEFAULT 0,
    CampaignEngagementScore FLOAT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Reservation', 'U') IS NULL
CREATE TABLE Reservation (
    ReservationID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GuestID NVARCHAR(100),
    RoomID NVARCHAR(100),
    CheckInDate DATETIME2,
    CheckOutDate DATETIME2,
    ActualCheckIn DATETIME2,
    ActualCheckOut DATETIME2,
    NumberOfGuests INT DEFAULT 1,
    Status NVARCHAR(50) DEFAULT 'pending',
    SpecialRequests NVARCHAR(MAX),
    CampaignID NVARCHAR(100),
    OfferID NVARCHAR(100),
    Source NVARCHAR(50) DEFAULT 'direct',
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('ServiceRequest', 'U') IS NULL
CREATE TABLE ServiceRequest (
    ServiceRequestID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GuestID NVARCHAR(100),
    RoomID NVARCHAR(100),
    RequestType NVARCHAR(100),
    Description NVARCHAR(MAX),
    Status NVARCHAR(50) DEFAULT 'pending',
    Priority NVARCHAR(50) DEFAULT 'normal',
    AssignedStaffID NVARCHAR(100),
    CompletedAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('StaffMember', 'U') IS NULL
CREATE TABLE StaffMember (
    StaffMemberID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserID NVARCHAR(100),
    StaffName NVARCHAR(255),
    Role NVARCHAR(50),
    EmployeeID NVARCHAR(100),
    Status NVARCHAR(50) DEFAULT 'off_duty',
    TasksCompletedToday INT DEFAULT 0,
    TotalTasksCompleted INT DEFAULT 0,
    AverageRating FLOAT DEFAULT 5,
    PerformanceScore FLOAT DEFAULT 100,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('StaffTask', 'U') IS NULL
CREATE TABLE StaffTask (
    StaffTaskID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    StaffMemberID NVARCHAR(100),
    TaskType NVARCHAR(100),
    RoomID NVARCHAR(100),
    GuestID NVARCHAR(100),
    Description NVARCHAR(MAX),
    Status NVARCHAR(50) DEFAULT 'pending',
    Priority NVARCHAR(50) DEFAULT 'normal',
    DueAt DATETIME2,
    CompletedAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('StaffAlert', 'U') IS NULL
CREATE TABLE StaffAlert (
    StaffAlertID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    StaffMemberID NVARCHAR(100),
    AlertType NVARCHAR(100),
    Message NVARCHAR(MAX),
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('RoomControl', 'U') IS NULL
CREATE TABLE RoomControl (
    RoomControlID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RoomID NVARCHAR(100),
    Temperature FLOAT DEFAULT 22,
    Lighting FLOAT DEFAULT 80,
    DndStatus BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('RoomServiceItem', 'U') IS NULL
CREATE TABLE RoomServiceItem (
    RoomServiceItemID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255),
    Category NVARCHAR(100),
    Price FLOAT DEFAULT 0,
    Available BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('RoomServiceOrder', 'U') IS NULL
CREATE TABLE RoomServiceOrder (
    RoomServiceOrderID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GuestID NVARCHAR(100),
    RoomID NVARCHAR(100),
    Items NVARCHAR(MAX), -- JSON array of items
    Status NVARCHAR(50) DEFAULT 'pending',
    TotalAmount FLOAT DEFAULT 0,
    DeliveredAt DATETIME2,
    SpecialInstructions NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('MaintenanceAlert', 'U') IS NULL
CREATE TABLE MaintenanceAlert (
    MaintenanceAlertID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RoomID NVARCHAR(100),
    IssueType NVARCHAR(100),
    Description NVARCHAR(MAX),
    Severity NVARCHAR(50) DEFAULT 'low',
    Status NVARCHAR(50) DEFAULT 'open',
    AssignedStaffID NVARCHAR(100),
    ResolvedAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Notification', 'U') IS NULL
CREATE TABLE Notification (
    NotificationID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RecipientType NVARCHAR(50),
    RecipientID NVARCHAR(100),
    Title NVARCHAR(255),
    Message NVARCHAR(MAX),
    Channel NVARCHAR(50) DEFAULT 'in_app',
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('GuestMessage', 'U') IS NULL
CREATE TABLE GuestMessage (
    GuestMessageID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GuestID NVARCHAR(100),
    StaffMemberID NVARCHAR(100),
    Direction NVARCHAR(50) DEFAULT 'inbound',
    Channel NVARCHAR(50) DEFAULT 'chat',
    Message NVARCHAR(MAX),
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Feedback', 'U') IS NULL
CREATE TABLE Feedback (
    FeedbackID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GuestID NVARCHAR(100),
    ReservationID NVARCHAR(100),
    Category NVARCHAR(100),
    Rating INT DEFAULT 5,
    Comment NVARCHAR(MAX),
    SentimentScore FLOAT DEFAULT 0,
    Status NVARCHAR(50) DEFAULT 'new',
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Invoice', 'U') IS NULL
CREATE TABLE Invoice (
    InvoiceID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GuestID NVARCHAR(100),
    ReservationID NVARCHAR(100),
    LineItems NVARCHAR(MAX), -- JSON array
    Subtotal FLOAT DEFAULT 0,
    TaxAmount FLOAT DEFAULT 0,
    TotalAmount FLOAT DEFAULT 0,
    Status NVARCHAR(50) DEFAULT 'draft',
    PaidAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('LoyaltyPoints', 'U') IS NULL
CREATE TABLE LoyaltyPoints (
    LoyaltyPointsID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GuestID NVARCHAR(100),
    TotalPoints INT DEFAULT 0,
    AvailablePoints INT DEFAULT 0,
    LifetimePoints INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('LoyaltyTransaction', 'U') IS NULL
CREATE TABLE LoyaltyTransaction (
    LoyaltyTransactionID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GuestID NVARCHAR(100),
    Points INT DEFAULT 0,
    TransactionType NVARCHAR(50) DEFAULT 'earn',
    Description NVARCHAR(MAX),
    ReservationID NVARCHAR(100),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('LoyaltyReward', 'U') IS NULL
CREATE TABLE LoyaltyReward (
    LoyaltyRewardID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255),
    Description NVARCHAR(MAX),
    PointsCost INT DEFAULT 0,
    Category NVARCHAR(100),
    Active BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('ConferenceRoom', 'U') IS NULL
CREATE TABLE ConferenceRoom (
    ConferenceRoomID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255),
    Capacity INT DEFAULT 10,
    Floor NVARCHAR(100),
    Amenities NVARCHAR(MAX), -- JSON array
    Status NVARCHAR(50) DEFAULT 'available',
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('ConferenceRoomBooking', 'U') IS NULL
CREATE TABLE ConferenceRoomBooking (
    ConferenceRoomBookingID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ConferenceRoomID NVARCHAR(100),
    GuestID NVARCHAR(100),
    StartTime DATETIME2,
    EndTime DATETIME2,
    AttendeeCount INT DEFAULT 1,
    Status NVARCHAR(50) DEFAULT 'confirmed',
    Notes NVARCHAR(MAX),
    TotalCost FLOAT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('ParkingSpot', 'U') IS NULL
CREATE TABLE ParkingSpot (
    ParkingSpotID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SpotNumber NVARCHAR(50),
    Level NVARCHAR(50),
    SpotType NVARCHAR(50) DEFAULT 'standard',
    Status NVARCHAR(50) DEFAULT 'available',
    VehicleID NVARCHAR(100),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Vehicle', 'U') IS NULL
CREATE TABLE Vehicle (
    VehicleID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GuestID NVARCHAR(100),
    LicensePlate NVARCHAR(50),
    Make NVARCHAR(100),
    Model NVARCHAR(100),
    Color NVARCHAR(50),
    ParkingSpotID NVARCHAR(100),
    ValetStatus NVARCHAR(50) DEFAULT 'self_parked',
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Elevator', 'U') IS NULL
CREATE TABLE Elevator (
    ElevatorID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ElevatorNumber NVARCHAR(50),
    CurrentFloor INT DEFAULT 1,
    Status NVARCHAR(50) DEFAULT 'operational',
    MaxCapacity INT DEFAULT 10,
    LastMaintenanceDate DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('ElevatorRequest', 'U') IS NULL
CREATE TABLE ElevatorRequest (
    ElevatorRequestID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ElevatorID NVARCHAR(100),
    GuestID NVARCHAR(100),
    FromFloor INT,
    ToFloor INT,
    Status NVARCHAR(50) DEFAULT 'waiting',
    RequestedAt DATETIME2,
    CompletedAt DATETIME2,
    IsAccessibilityRequest BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('AccessPass', 'U') IS NULL
CREATE TABLE AccessPass (
    AccessPassID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GuestID NVARCHAR(100),
    ReservationID NVARCHAR(100),
    PassType NVARCHAR(50) DEFAULT 'room_key',
    AccessLevel NVARCHAR(MAX), -- JSON array of accessible areas
    IsActive BIT DEFAULT 1,
    ExpiresAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Campaign', 'U') IS NULL
CREATE TABLE Campaign (
    CampaignID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255),
    Status NVARCHAR(50) DEFAULT 'draft',
    TargetTier NVARCHAR(50),
    Channel NVARCHAR(50) DEFAULT 'email',
    Subject NVARCHAR(255),
    Content NVARCHAR(MAX),
    ScheduledAt DATETIME2,
    SentAt DATETIME2,
    TotalTargeted INT DEFAULT 0,
    TotalSent INT DEFAULT 0,
    TotalOpened INT DEFAULT 0,
    TotalClicked INT DEFAULT 0,
    TotalConverted INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('Offer', 'U') IS NULL
CREATE TABLE Offer (
    OfferID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255),
    Description NVARCHAR(MAX),
    DiscountType NVARCHAR(50) DEFAULT 'percentage',
    DiscountValue FLOAT DEFAULT 0,
    MinimumStayNights INT DEFAULT 1,
    ValidFrom DATETIME2,
    ValidTo DATETIME2,
    TargetTier NVARCHAR(50),
    Status NVARCHAR(50) DEFAULT 'active',
    TimesRedeemed INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('PricingRecommendation', 'U') IS NULL
CREATE TABLE PricingRecommendation (
    PricingRecommendationID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RoomType NVARCHAR(50),
    RecommendedRate FLOAT DEFAULT 0,
    CurrentRate FLOAT DEFAULT 0,
    OccupancyRate FLOAT DEFAULT 0,
    SeasonalFactor FLOAT DEFAULT 1.0,
    CompetitorRate FLOAT DEFAULT 0,
    Rationale NVARCHAR(MAX),
    Status NVARCHAR(50) DEFAULT 'pending',
    AppliedAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);

IF OBJECT_ID('AnalyticsData', 'U') IS NULL
CREATE TABLE AnalyticsData (
    AnalyticsDataID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    MetricType NVARCHAR(100),
    MetricValue FLOAT DEFAULT 0,
    Dimension NVARCHAR(100),
    DimensionValue NVARCHAR(255),
    RecordedAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255)
);
