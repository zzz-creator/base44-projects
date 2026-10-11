import { base44 } from '../../api/base44Client';

/**
 * Audit Log Service - Utility functions for creating audit trail entries
 */

// Entities that should be audited
const AUDITED_ENTITIES = [
  'Production',
  'EquipmentAsset',
  'User',
  'CrewMember',
  'CrewAssignment',
  'IncidentLog',
  'Budget',
  'BudgetExpense',
  'AutomationRule'
];

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  action,
  entityType,
  entityId,
  entityName,
  changes = null,
  previousValues = null
}) {
  try {
    const user = await base44.auth.me();
    
    await base44.entities.AuditLog.create({
      user_email: user?.email || 'system',
      user_name: user?.full_name || 'System',
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName || entityId,
      changes: changes ? JSON.stringify(changes) : null,
      previous_values: previousValues ? JSON.stringify(previousValues) : null
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Log a create action
 */
export async function logCreate(entityType, entityId, entityName, data) {
  if (!AUDITED_ENTITIES.includes(entityType)) return;
  
  await createAuditLog({
    action: 'create',
    entityType,
    entityId,
    entityName,
    changes: data
  });
}

/**
 * Log an update action
 */
export async function logUpdate(entityType, entityId, entityName, newData, previousData) {
  if (!AUDITED_ENTITIES.includes(entityType)) return;
  
  // Calculate only changed fields
  const changes = {};
  for (const key of Object.keys(newData)) {
    if (JSON.stringify(newData[key]) !== JSON.stringify(previousData?.[key])) {
      changes[key] = newData[key];
    }
  }
  
  if (Object.keys(changes).length === 0) return;
  
  await createAuditLog({
    action: 'update',
    entityType,
    entityId,
    entityName,
    changes,
    previousValues: previousData
  });
}

/**
 * Log a delete action
 */
export async function logDelete(entityType, entityId, entityName, previousData) {
  if (!AUDITED_ENTITIES.includes(entityType)) return;
  
  await createAuditLog({
    action: 'delete',
    entityType,
    entityId,
    entityName,
    previousValues: previousData
  });
}

export default {
  createAuditLog,
  logCreate,
  logUpdate,
  logDelete,
  AUDITED_ENTITIES
};