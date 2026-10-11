-- HotelOps Seed Data
USE HotelOps;
GO

-- Users
INSERT INTO Users (UserID, Email, PasswordHash, FullName, Role) VALUES
  (NEWID(), 'admin@hotelops.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Hotel Admin', 'admin'),
  (NEWID(), 'manager@hotelops.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Sarah Mitchell', 'manager');

-- Floors
DECLARE @F1 UNIQUEIDENTIFIER = NEWID(), @F2 UNIQUEIDENTIFIER = NEWID(), @F3 UNIQUEIDENTIFIER = NEWID();
INSERT INTO Floor (FloorID, FloorNumber, Name, TotalRooms) VALUES
  (@F1, 1, 'Ground Floor', 10),
  (@F2, 2, 'Second Floor', 12),
  (@F3, 3, 'Third Floor', 12);

-- Rooms
DECLARE @R101 UNIQUEIDENTIFIER = NEWID(), @R102 UNIQUEIDENTIFIER = NEWID(), @R201 UNIQUEIDENTIFIER = NEWID(), @R301 UNIQUEIDENTIFIER = NEWID();
INSERT INTO Room (RoomID, RoomNumber, FloorID, RoomType, Status, RatePerNight, MaxOccupancy, Amenities) VALUES
  (@R101, '101', @F1, 'standard', 'available', 99.00, 2, '["WiFi","TV","Mini Bar"]'),
  (@R102, '102', @F1, 'deluxe', 'occupied', 149.00, 2, '["WiFi","TV","Mini Bar","Jacuzzi"]'),
  (@R201, '201', @F2, 'suite', 'available', 249.00, 4, '["WiFi","TV","Mini Bar","Jacuzzi","Kitchenette"]'),
  (@R301, '301', @F3, 'penthouse', 'reserved', 499.00, 6, '["WiFi","TV","Mini Bar","Jacuzzi","Kitchenette","Ocean View"]');

-- Guests
DECLARE @G1 UNIQUEIDENTIFIER = NEWID(), @G2 UNIQUEIDENTIFIER = NEWID(), @G3 UNIQUEIDENTIFIER = NEWID();
INSERT INTO Guest (GuestID, FirstName, LastName, Email, Phone, VipStatus, LoyaltyTier, Status) VALUES
  (@G1, 'James', 'Carter', 'james.carter@email.com', '+1-555-0101', 0, 'gold', 'checked_in'),
  (@G2, 'Emily', 'Rodriguez', 'emily.r@email.com', '+1-555-0202', 1, 'platinum', 'reserved'),
  (@G3, 'Liam', 'Chen', 'liam.chen@email.com', '+1-555-0303', 0, 'standard', 'checked_out');

-- Reservations
INSERT INTO Reservation (ReservationID, GuestID, RoomID, CheckInDate, CheckOutDate, NumberOfGuests, Status, Source) VALUES
  (NEWID(), @G1, @R102, '2026-03-07', '2026-03-10', 2, 'checked_in', 'direct'),
  (NEWID(), @G2, @R301, '2026-03-09', '2026-03-14', 3, 'confirmed', 'campaign'),
  (NEWID(), @G3, @R101, '2026-03-01', '2026-03-05', 1, 'checked_out', 'organic');

-- Staff Members
DECLARE @S1 UNIQUEIDENTIFIER = NEWID(), @S2 UNIQUEIDENTIFIER = NEWID(), @S3 UNIQUEIDENTIFIER = NEWID();
INSERT INTO StaffMember (StaffMemberID, StaffName, Role, EmployeeID, Status, TasksCompletedToday, AverageRating) VALUES
  (@S1, 'Marco Torres', 'concierge', 'EMP-001', 'on_duty', 8, 4.9),
  (@S2, 'Aisha Patel', 'housekeeping', 'EMP-002', 'on_duty', 12, 4.7),
  (@S3, 'David Kim', 'maintenance', 'EMP-003', 'off_duty', 5, 4.8);

-- Service Requests
INSERT INTO ServiceRequest (ServiceRequestID, GuestID, RoomID, RequestType, Description, Status, Priority, AssignedStaffID) VALUES
  (NEWID(), @G1, @R102, 'housekeeping', 'Room cleaning requested', 'pending', 'normal', @S2),
  (NEWID(), @G1, @R102, 'room_service', 'Extra towels needed', 'completed', 'normal', @S1);

-- Staff Tasks
INSERT INTO StaffTask (StaffTaskID, StaffMemberID, TaskType, RoomID, Description, Status, Priority) VALUES
  (NEWID(), @S2, 'cleaning', @R102, 'Scheduled cleaning for room 102', 'pending', 'normal'),
  (NEWID(), @S3, 'maintenance', @R201, 'AC unit checkup in room 201', 'in_progress', 'high');

-- Elevators
DECLARE @E1 UNIQUEIDENTIFIER = NEWID(), @E2 UNIQUEIDENTIFIER = NEWID();
INSERT INTO Elevator (ElevatorID, ElevatorNumber, CurrentFloor, Status, MaxCapacity) VALUES
  (@E1, 'ELV-A', 1, 'operational', 10),
  (@E2, 'ELV-B', 2, 'operational', 10);

-- Elevator Requests
INSERT INTO ElevatorRequest (ElevatorRequestID, ElevatorID, GuestID, FromFloor, ToFloor, Status) VALUES
  (NEWID(), @E1, @G1, 1, 2, 'completed'),
  (NEWID(), @E2, @G2, 3, 1, 'waiting');

-- Parking Spots
DECLARE @P1 UNIQUEIDENTIFIER = NEWID(), @P2 UNIQUEIDENTIFIER = NEWID();
INSERT INTO ParkingSpot (ParkingSpotID, SpotNumber, Level, SpotType, Status) VALUES
  (@P1, 'A-01', 'Ground', 'standard', 'available'),
  (@P2, 'A-02', 'Ground', 'vip', 'occupied');

-- Vehicles
INSERT INTO Vehicle (VehicleID, GuestID, LicensePlate, Make, Model, Color, ParkingSpotID, ValetStatus) VALUES
  (NEWID(), @G1, 'ABC-1234', 'Tesla', 'Model S', 'White', @P2, 'valet_parked');

-- Conference Rooms
DECLARE @CR1 UNIQUEIDENTIFIER = NEWID();
INSERT INTO ConferenceRoom (ConferenceRoomID, Name, Capacity, Floor, Amenities, Status) VALUES
  (@CR1, 'Boardroom Alpha', 20, '2nd Floor', '["Projector","Whiteboard","Video Conferencing"]', 'available');

-- Conference Bookings
INSERT INTO ConferenceRoomBooking (ConferenceRoomBookingID, ConferenceRoomID, GuestID, StartTime, EndTime, AttendeeCount, Status, TotalCost) VALUES
  (NEWID(), @CR1, @G2, '2026-03-10 09:00:00', '2026-03-10 12:00:00', 15, 'confirmed', 300.00);

-- Room Service Items
INSERT INTO RoomServiceItem (RoomServiceItemID, Name, Category, Price, Available) VALUES
  (NEWID(), 'Club Sandwich', 'food', 18.00, 1),
  (NEWID(), 'Caesar Salad', 'food', 14.00, 1),
  (NEWID(), 'Bottle of Water', 'beverage', 5.00, 1),
  (NEWID(), 'Glass of Wine', 'beverage', 12.00, 1);

-- Room Service Orders
INSERT INTO RoomServiceOrder (RoomServiceOrderID, GuestID, RoomID, Items, Status, TotalAmount) VALUES
  (NEWID(), @G1, @R102, '[{"name":"Club Sandwich","qty":2,"price":18},{"name":"Bottle of Water","qty":2,"price":5}]', 'delivered', 46.00);

-- Maintenance Alerts
INSERT INTO MaintenanceAlert (MaintenanceAlertID, RoomID, IssueType, Description, Severity, Status, AssignedStaffID) VALUES
  (NEWID(), @R201, 'HVAC', 'AC unit making unusual noise', 'medium', 'open', @S3);

-- Feedback
INSERT INTO Feedback (FeedbackID, GuestID, Category, Rating, Comment, SentimentScore, Status) VALUES
  (NEWID(), @G3, 'service', 5, 'Excellent stay! Staff were incredibly helpful.', 0.95, 'reviewed'),
  (NEWID(), @G3, 'room', 4, 'Room was clean and comfortable. Would return!', 0.82, 'new');

-- Loyalty Points
INSERT INTO LoyaltyPoints (LoyaltyPointsID, GuestID, TotalPoints, AvailablePoints, LifetimePoints) VALUES
  (NEWID(), @G1, 1200, 1200, 3400),
  (NEWID(), @G2, 8500, 6200, 42000),
  (NEWID(), @G3, 450, 450, 450);

-- Loyalty Rewards  
INSERT INTO LoyaltyReward (LoyaltyRewardID, Name, Description, PointsCost, Category, Active) VALUES
  (NEWID(), 'Free Night Stay', 'Redeem for one complimentary night in a standard room', 5000, 'accommodation', 1),
  (NEWID(), 'Room Upgrade', 'Upgrade to the next room category', 2000, 'upgrade', 1),
  (NEWID(), 'Spa Treatment', '60-minute spa treatment', 3000, 'wellness', 1);

-- Campaigns
INSERT INTO Campaign (CampaignID, Name, Status, TargetTier, Channel, Subject, TotalTargeted, TotalSent, TotalOpened) VALUES
  (NEWID(), 'Spring Getaway 2026', 'sent', 'gold', 'email', 'Exclusive Spring Offer Just For You', 450, 448, 312),
  (NEWID(), 'Platinum Exclusive', 'active', 'platinum', 'sms', 'VIP Weekend Package Available', 85, 85, 75);

-- Offers
INSERT INTO Offer (OfferID, Name, Description, DiscountType, DiscountValue, MinimumStayNights, ValidFrom, ValidTo, TargetTier, Status) VALUES
  (NEWID(), 'Spring 15% Off', '15% discount on all rooms this spring', 'percentage', 15, 2, '2026-03-01', '2026-05-31', 'standard', 'active'),
  (NEWID(), 'Platinum Weekend', 'Free breakfast + room upgrade for platinum members', 'fixed', 50, 1, '2026-03-01', '2026-12-31', 'platinum', 'active');

-- Pricing Recommendations
INSERT INTO PricingRecommendation (PricingRecommendationID, RoomType, RecommendedRate, CurrentRate, OccupancyRate, SeasonalFactor, Rationale, Status) VALUES
  (NEWID(), 'standard', 115.00, 99.00, 0.87, 1.15, 'High occupancy warrants 16% rate increase for standard rooms this weekend', 'pending'),
  (NEWID(), 'suite', 275.00, 249.00, 0.65, 1.10, 'Moderate occupancy with strong demand forecast; recommended 10% increase', 'pending');

-- Notifications
INSERT INTO Notification (NotificationID, RecipientType, RecipientID, Title, Message, Channel, IsRead) VALUES
  (NEWID(), 'guest', CAST(@G1 AS NVARCHAR(100)), 'Welcome Back!', 'We are delighted to have you at HotelOps. Your room 102 is ready.', 'in_app', 0),
  (NEWID(), 'staff', CAST(@S2 AS NVARCHAR(100)), 'Housekeeping Request', 'Room 102 requires cleaning service at guest request.', 'in_app', 0);

-- Analytics Data
INSERT INTO AnalyticsData (AnalyticsDataID, MetricType, MetricValue, Dimension, DimensionValue, RecordedAt) VALUES
  (NEWID(), 'occupancy_rate', 78.5, 'date', '2026-03-07', GETDATE()),
  (NEWID(), 'revenue', 4250.00, 'date', '2026-03-07', GETDATE()),
  (NEWID(), 'average_rating', 4.6, 'week', '2026-W10', GETDATE());
