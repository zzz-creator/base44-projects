import { base44 } from '../../api/base44Client';

// Helper to create notifications
export async function createNotification({ userEmail, type, message, link, entityType, entityId }) {
  // Check user preferences first
  const prefs = await base44.entities.NotificationPreference.filter({ user_email: userEmail });
  const userPref = prefs[0];
  
  // If user has preferences set, check if this notification type is enabled
  if (userPref) {
    const prefMap = {
      mention: 'mention_enabled',
      incident_created: 'incident_enabled',
      task_overdue: 'task_overdue_enabled',
      task_assigned: 'task_assigned_enabled',
      production_status_change: 'production_status_enabled',
      new_message: 'message_enabled'
    };
    
    if (userPref[prefMap[type]] === false) {
      return null; // User has disabled this notification type
    }
  }
  
  return base44.entities.Notification.create({
    user_email: userEmail,
    type,
    message,
    link,
    entity_type: entityType,
    entity_id: entityId,
    is_read: false
  });
}

// Notify on @mention
export async function notifyMention({ mentionedEmail, authorName, entityType, entityId, entityName }) {
  const linkMap = {
    production: `ProductionDetail?id=${entityId}`,
    task: `Tasks`,
    incident: `Incidents`
  };
  
  return createNotification({
    userEmail: mentionedEmail,
    type: 'mention',
    message: `${authorName} mentioned you in a ${entityType}: "${entityName}"`,
    link: linkMap[entityType] || '',
    entityType,
    entityId
  });
}

// Notify on new incident
export async function notifyIncidentCreated({ incident, production, notifyEmails }) {
  const notifications = notifyEmails.map(email => 
    createNotification({
      userEmail: email,
      type: 'incident_created',
      message: `New ${incident.severity} incident in "${production.name}": ${incident.description.substring(0, 50)}...`,
      link: `ProductionDetail?id=${production.id}`,
      entityType: 'incident',
      entityId: incident.id
    })
  );
  
  return Promise.all(notifications);
}

// Notify on task assigned
export async function notifyTaskAssigned({ task, production, assigneeEmail, assignerName }) {
  return createNotification({
    userEmail: assigneeEmail,
    type: 'task_assigned',
    message: `${assignerName} assigned you a task in "${production.name}": ${task.task_name}`,
    link: `ProductionDetail?id=${production.id}`,
    entityType: 'task',
    entityId: task.id
  });
}

// Notify on task overdue
export async function notifyTaskOverdue({ task, production, assigneeEmail }) {
  return createNotification({
    userEmail: assigneeEmail,
    type: 'task_overdue',
    message: `Task overdue in "${production.name}": ${task.task_name}`,
    link: `ProductionDetail?id=${production.id}`,
    entityType: 'task',
    entityId: task.id
  });
}

// Notify on production status change
export async function notifyProductionStatusChange({ production, oldStatus, newStatus, notifyEmails }) {
  const notifications = notifyEmails.map(email =>
    createNotification({
      userEmail: email,
      type: 'production_status_change',
      message: `"${production.name}" status changed from ${oldStatus} to ${newStatus}`,
      link: `ProductionDetail?id=${production.id}`,
      entityType: 'production',
      entityId: production.id
    })
  );
  
  return Promise.all(notifications);
}

// Notify on new message
export async function notifyNewMessage({ conversation, message, senderName, recipientEmails }) {
  const notifications = recipientEmails.map(email =>
    createNotification({
      userEmail: email,
      type: 'new_message',
      message: `${senderName}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
      link: `Messages?conversation=${conversation.id}`,
      entityType: 'message',
      entityId: message.id
    })
  );
  
  return Promise.all(notifications);
}