/**
 * HotelOps Data Client
 * 
 * Routes all entity CRUD operations to either:
 *  - Base44 cloud (ONLINE mode) 
 *  - Local SQL Server bridge (OFFLINE mode)
 * 
 * Mode is determined by localStorage key 'hotelops_data_mode' ('ONLINE' | 'OFFLINE')
 * SQL bridge URL defaults to http://localhost:3001 but can be overridden via
 * localStorage key 'hotelops_sql_server_url'
 * 
 * OFFLINE SETUP:
 *   1. npm install
 *   2. Configure SQL Server (see server/README.md)
 *   3. node server/bridge.js   (starts the REST bridge on :3001)
 *   4. Switch mode to OFFLINE in Settings page
 */

import { base44 } from '../api/base44Client';

export const getMode = () => localStorage.getItem('hotelops_data_mode') || 'ONLINE';
export const getSqlUrl = () => localStorage.getItem('hotelops_sql_server_url') || 'http://localhost:3001';

// ---------- SQL Bridge helpers ----------

async function sqlRequest(method, path, body) {
  const url = `${getSqlUrl()}${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `SQL bridge error: ${res.status}`);
  }
  return res.json();
}

function buildSqlEntity(entityName) {
  const base = `/api/${entityName}`;
  return {
    list: (sort, limit) => {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      return sqlRequest('GET', `${base}?${params}`);
    },
    filter: (query, sort, limit) => sqlRequest('POST', `${base}/filter`, { query, sort, limit }),
    create: (data) => sqlRequest('POST', base, data),
    update: (id, data) => sqlRequest('PATCH', `${base}/${id}`, data),
    delete: (id) => sqlRequest('DELETE', `${base}/${id}`),
    bulkCreate: (items) => sqlRequest('POST', `${base}/bulk`, items),
    schema: () => sqlRequest('GET', `${base}/schema`),
    subscribe: () => () => {}, // no-op for offline
  };
}

// ---------- Entity proxy builder ----------

function buildEntity(entityName) {
  const b44 = base44.entities[entityName];
  const sql = buildSqlEntity(entityName);

  // Safe online wrappers — fall back to sql if b44 entity not available
  const onlineList       = b44 ? (...a) => b44.list(...a)       : sql.list;
  const onlineFilter     = b44 ? (...a) => b44.filter(...a)     : sql.filter;
  const onlineCreate     = b44 ? (...a) => b44.create(...a)     : sql.create;
  const onlineUpdate     = b44 ? (...a) => b44.update(...a)     : sql.update;
  const onlineDelete     = b44 ? (...a) => b44.delete(...a)     : sql.delete;
  const onlineBulkCreate = b44 ? (...a) => b44.bulkCreate(...a) : sql.bulkCreate;
  const onlineSchema     = b44 ? (...a) => b44.schema(...a)     : sql.schema;
  const onlineSubscribe  = b44 ? (...a) => b44.subscribe(...a)  : () => () => {};

  function pick(onlineFn, offlineFn) {
    return (...args) => getMode() === 'OFFLINE' ? offlineFn(...args) : onlineFn(...args);
  }

  return {
    list:       pick(onlineList,       sql.list),
    filter:     pick(onlineFilter,     sql.filter),
    create:     pick(onlineCreate,     sql.create),
    update:     pick(onlineUpdate,     sql.update),
    delete:     pick(onlineDelete,     sql.delete),
    bulkCreate: pick(onlineBulkCreate, sql.bulkCreate),
    schema:     pick(onlineSchema,     sql.schema),
    subscribe:  pick(onlineSubscribe,  sql.subscribe),
  };
}

// ---------- Exported unified client ----------
// Integrations, auth, analytics always use Base44 (they require internet anyway)
export const db = {
  entities: {
    Guest:                  buildEntity('Guest'),
    Reservation:            buildEntity('Reservation'),
    Room:                   buildEntity('Room'),
    Floor:                  buildEntity('Floor'),
    ParkingSpot:            buildEntity('ParkingSpot'),
    Vehicle:                buildEntity('Vehicle'),
    AccessPass:             buildEntity('AccessPass'),
    Elevator:               buildEntity('Elevator'),
    ElevatorRequest:        buildEntity('ElevatorRequest'),
    StaffMember:            buildEntity('StaffMember'),
    StaffTask:              buildEntity('StaffTask'),
    StaffAlert:             buildEntity('StaffAlert'),
    Invoice:                buildEntity('Invoice'),
    RoomServiceItem:        buildEntity('RoomServiceItem'),
    RoomServiceOrder:       buildEntity('RoomServiceOrder'),
    ServiceRequest:         buildEntity('ServiceRequest'),
    Feedback:               buildEntity('Feedback'),
    ConferenceRoom:         buildEntity('ConferenceRoom'),
    ConferenceRoomBooking:  buildEntity('ConferenceRoomBooking'),
    LoyaltyPoints:          buildEntity('LoyaltyPoints'),
    LoyaltyReward:          buildEntity('LoyaltyReward'),
    LoyaltyTransaction:     buildEntity('LoyaltyTransaction'),
    Campaign:               buildEntity('Campaign'),
    Notification:           buildEntity('Notification'),
    Offer:                  buildEntity('Offer'),
    GuestMessage:           buildEntity('GuestMessage'),
    RoomControl:            buildEntity('RoomControl'),
    AnalyticsData:          buildEntity('AnalyticsData'),
    PricingRecommendation:  buildEntity('PricingRecommendation'),
    MaintenanceAlert:       buildEntity('MaintenanceAlert'),
    User:                   buildEntity('User'),
  },
  integrations: base44.integrations,
  auth:         base44.auth,
  analytics:    base44.analytics,
  users:        base44.users,
  agents:       base44.agents,
};