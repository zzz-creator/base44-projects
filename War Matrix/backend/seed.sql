-- War Matrix Seed Data
USE WarMatrix;
GO

-- Users
INSERT INTO Users (id, email, full_name, role) VALUES
  ('usr-001', 'admin@warmatrix.com', 'System Administrator', 'admin'),
  ('usr-002', 'analyst@warmatrix.com', 'John Hawkins', 'analyst');

-- Wars
INSERT INTO War (id, name, countries_involved, start_date, end_date, status, type, casualties_military, casualties_civilian, casualties_total, description, economic_impact, era) VALUES
  ('war-001', 'The Northern Conflict', '["United Territories","Eastern Alliance"]', '1939-09-01', '1945-05-08', 'ended', 'territorial', 5500000, 6000000, 11500000, 'A devastating territorial conflict across the northern continent spanning six years.', 4200000000.0, 'past'),
  ('war-002', 'Operation Desert Storm', '["Coalition Forces","Southern Republic"]', '1990-08-02', '1991-02-28', 'ended', 'territorial', 25000, 100000, 125000, 'Coalition military operation to liberate occupied territories.', 820000000.0, 'past'),
  ('war-003', 'Pacific Territorial Dispute', '["Pacific Federation","Eastern Block"]', '2024-01-15', NULL, 'ongoing', 'territorial', 8500, 32000, 40500, 'Ongoing maritime and territorial dispute in the Pacific region.', 1500000000.0, 'current'),
  ('war-004', 'The Energy Wars', '["Western Alliance","Southern Coalition","Eastern Federation"]', '2031-03-20', NULL, 'predicted', 'economic', 0, 0, 0, 'AI-predicted conflict driven by energy resource scarcity and geopolitical shifts.', 5800000000.0, 'near_future'),
  ('war-005', 'Galactic Sovereignty War', '["Terran Federation","Proxima League","Centauri Empire"]', '2185-07-04', NULL, 'ongoing', 'galactic', 850000, 2400000, 3250000, 'Interstellar conflict over resource-rich systems beyond the Oort Cloud.', 0.0, 'galactic');

-- Alerts
INSERT INTO Alert (id, created_by, title, description, alert_type, severity, war_id, status, acknowledgment_status) VALUES
  ('alt-001', 'analyst@warmatrix.com', 'Troop Buildup Detected', 'Satellite imagery confirms significant troop movements near the eastern border.', 'intelligence', 'critical', 'war-003', 'active', 'unacknowledged'),
  ('alt-002', 'admin@warmatrix.com', 'Ceasefire Violation Reported', 'Three separate ceasefire violations reported in the last 24 hours.', 'ceasefire', 'high', 'war-003', 'active', 'acknowledged'),
  ('alt-003', 'analyst@warmatrix.com', 'Energy Policy Tension', 'New economic sanctions may accelerate timeline of predicted energy conflict.', 'diplomatic', 'medium', 'war-004', 'active', 'unacknowledged');

-- Alert Records
INSERT INTO AlertRecord (id, alert_id, event_type, event_description, timestamp, source, confidence_level) VALUES
  ('alr-001', 'alt-001', 'satellite_detection', 'Thermal signatures of 45,000 personnel and 800 armored vehicles detected.', GETDATE(), 'NRO Satellite Feed', 0.91),
  ('alr-002', 'alt-002', 'field_report', 'Confirmed artillery fire across the demilitarized zone at grid reference 47.2N 88.5E.', GETDATE(), 'Field Correspondent', 0.85);

-- Predictions
INSERT INTO Prediction (id, war_id, prediction_type, predicted_outcome, confidence_score, model_version) VALUES
  ('prd-001', 'war-003', 'duration', 'Conflict likely to de-escalate within 18 months if diplomatic channels remain open.', 0.67, 'v2.4'),
  ('prd-002', 'war-004', 'escalation', 'Energy sanctions will trigger kinetic conflict with 73% probability by 2033.', 0.73, 'v2.4'),
  ('prd-003', 'war-005', 'outcome', 'Terran Federation will secure 60% of contested systems within 5 years.', 0.58, 'v2.4');

-- Alert Rules
INSERT INTO AlertRule (id, created_by, rule_name, rule_description, enabled, trigger_count) VALUES
  ('rul-001', 'admin@warmatrix.com', 'High Casualty Threshold', 'Trigger alert when daily casualties exceed 1000.', 1, 3),
  ('rul-002', 'admin@warmatrix.com', 'Confidence Drop Monitor', 'Trigger when AI prediction confidence drops more than 15%.', 1, 1);
