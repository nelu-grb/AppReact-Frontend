import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';

export interface AuditEvent {
  id: string;
  timestamp: string;
  category: 'RESERVAS' | 'SISTEMA';
  reservationId: string;
  user: string;
  action: string;
  title: string;
  details: string;
  previousState: string;
  newState: string;
  reservationSummary: string;
  guestName: string;
  actorRole: string;
  status: string;
  ip: string;
  payload: Record<string, unknown>;
}

type ApiRecord = Record<string, unknown>;

const asRecord = (value: unknown): ApiRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as ApiRecord
    : {};

const parsePayload = (value: unknown): ApiRecord => {
  if (typeof value === 'string') {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return { raw: value };
    }
  }
  return asRecord(value);
};

const getText = (...values: unknown[]): string => {
  const value = values.find((candidate) =>
    (typeof candidate === 'string' && candidate.trim() !== '') ||
    (typeof candidate === 'number' && Number.isFinite(candidate))
  );
  return value === undefined ? '' : String(value);
};

const getActorLabel = (actor: string): string => {
  const normalizedActor = actor.trim().toUpperCase();
  if (normalizedActor === 'SYSTEM_WEBPAY') return 'Sistema · Webpay';
  if (normalizedActor.startsWith('SYSTEM_')) {
    return `Sistema · ${normalizedActor.slice('SYSTEM_'.length).replaceAll('_', ' ')}`;
  }
  if (normalizedActor === 'SYSTEM') return 'Sistema';
  return actor;
};

const getCategory = (record: ApiRecord, reservationId: string, action: string): AuditEvent['category'] => {
  const category = getText(record.category, record.eventCategory).normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toUpperCase();
  if (category === 'RESERVA' || category === 'RESERVAS') return 'RESERVAS';
  if (category === 'SISTEMA') return 'SISTEMA';

  const normalizedAction = action.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  return reservationId || /RESERV|CHECK.?IN|CHECK.?OUT|CANCEL/.test(normalizedAction)
    ? 'RESERVAS'
    : 'SISTEMA';
};

const getRecords = (data: unknown): ApiRecord[] => {
  if (Array.isArray(data)) return data.map(asRecord);
  if (data !== null && typeof data === 'object' && 'content' in data && Array.isArray(data.content)) {
    return data.content.map(asRecord);
  }
  throw new Error('La respuesta del servicio de auditoría no tiene un formato reconocido.');
};

const normalizeEvent = (record: ApiRecord): AuditEvent => {
  const payload = parsePayload(record.payload);
  const reservation = asRecord(record.reservation);
  const actor = asRecord(record.actor);
  const actorId = typeof record.actor === 'string' ? record.actor : '';
  const action = getText(
    record.action,
    record.eventType,
    record.type,
    record.operation,
    payload.action,
    payload.eventType,
    payload.type
  );
  const reservationId = getText(
    record.reservationId,
    record.reservationCode,
    record.res,
    reservation.code,
    reservation.id,
    record.aggregateId,
    payload.reservationId,
    payload.reservationCode,
    payload.aggregateId
  );
  const previousState = getText(
    record.previousState,
    record.oldStatus,
    record.fromStatus,
    payload.previousState,
    payload.oldStatus,
    payload.fromStatus
  );
  const newState = getText(
    record.newState,
    record.newStatus,
    record.toStatus,
    payload.newState,
    payload.newStatus,
    payload.toStatus,
    payload.status
  );
  const status = getText(record.status, record.resultStatus, record.newStatus, payload.status, payload.newStatus);
  const details = getText(
    record.details,
    record.description,
    record.message,
    payload.details,
    payload.description,
    payload.message
  );
  const eventType = action.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const user = getText(
    record.actorName,
    record.performedByName,
    record.userName,
    record.fullName,
    record.username,
    record.user,
    record.performedBy,
    record.processedBy,
    record.createdBy,
    actor.name,
    actor.fullName,
    actor.username,
    actor.email,
    payload.actorName,
    payload.performedByName,
    payload.userName,
    payload.fullName,
    payload.username,
    payload.user,
    payload.performedBy,
    payload.processedBy
  ) || (/^SYSTEM(?:_|$)/i.test(actorId) ? '' : actorId);

  return {
    id: getText(record.id, record.eventId, record.logId, payload.id, payload.eventId),
    timestamp: getText(
      record.timestamp,
      record.createdAt,
      record.time,
      record.eventTime,
      record.occurredAt,
      payload.timestamp,
      payload.createdAt
    ),
    category: getCategory(record, reservationId, action),
    reservationId,
    user,
    action,
    title: getText(record.title, record.eventTitle, record.displayName),
    details: details || (
      eventType === 'RESERVATION_STATUS_UPDATED' && status
        ? `Estado actualizado a ${status}`
        : previousState && newState
          ? `${previousState} → ${newState}`
          : ''
    ),
    previousState,
    newState,
    reservationSummary: getText(
      record.reservationSummary,
      record.summary,
      record.reservationDescription,
      payload.reservationSummary,
      payload.summary
    ),
    guestName: getText(record.guestName, reservation.guestName, payload.guestName),
    actorRole: getText(
      record.actorRole,
      record.userRole,
      record.sourceName,
      record.sourceService,
      payload.sourceService,
      actor.role,
      actor.source,
      getActorLabel(actorId)
    ),
    status,
    ip: getText(record.ip, record.sourceIp, record.remoteAddress, payload.ip, payload.sourceIp),
    payload: Object.keys(payload).length > 0 ? payload : record,
  };
};

export const fetchAuditEvents = async (): Promise<AuditEvent[]> => {
  const response = await apiClient.get<unknown>(API_ENDPOINTS.audit.list);
  return getRecords(response.data).map(normalizeEvent);
};
