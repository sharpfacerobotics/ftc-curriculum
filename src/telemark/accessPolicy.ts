export const SIMULATOR_AUTH_REQUEST = 'telemark:simulator-auth-request';
export const SIMULATOR_AUTH_STATE = 'telemark:simulator-auth-state';

export interface SimulatorAuthRequestMessage {
  type: typeof SIMULATOR_AUTH_REQUEST;
  unit: number;
  destination?: string;
}

export interface SimulatorAuthStateMessage {
  type: typeof SIMULATOR_AUTH_STATE;
  authenticated: boolean;
}

/** The first unit number that needs an account. Everything below is open. */
export const FIRST_GATED_UNIT = 5;

export function isProtectedUnit(unitNumber: number): boolean {
  return Number.isInteger(unitNumber) && unitNumber >= FIRST_GATED_UNIT;
}

/**
 * Matches a software unit (unit-NN) or an engineering module (module-NN).
 * Both tracks gate on the same rule: units below FIRST_GATED_UNIT are open,
 * and the rest need an account. Opening the first five means a visitor can
 * work through real material before being asked for anything.
 */
const TRACK_SEGMENT = /(?:^|\/)(unit|module)-(\d{1,2})(?:\/|$)/i;

export function getUnitNumber(value: string | null | undefined): number | null {
  if (!value) return null;

  const match = value.match(TRACK_SEGMENT);
  if (!match) return null;

  const unitNumber = Number.parseInt(match[2], 10);
  return Number.isFinite(unitNumber) ? unitNumber : null;
}

/**
 * Returns the canonical unit slug for a path, for example 'unit-03' or
 * 'module-07'. Used so the lock screen can name the right unit in the right
 * track.
 */
export function getUnitSlug(value: string | null | undefined): string | null {
  if (!value) return null;

  const match = value.match(TRACK_SEGMENT);
  if (!match) return null;

  return `${match[1].toLowerCase()}-${match[2].padStart(2, '0')}`;
}

export function isProtectedUnitPath(value: string | null | undefined): boolean {
  const unitNumber = getUnitNumber(value);
  return unitNumber !== null && isProtectedUnit(unitNumber);
}

/**
 * Unit and module overview pages are public curriculum maps. They let a
 * student see what a later unit covers before an account is requested.
 */
export function isUnitOverviewPath(value: string | null | undefined): boolean {
  if (!value) return false;
  const pathname = value.split(/[?#]/, 1)[0].replace(/\/+$/, '');
  return /(?:^|\/)(?:unit|module)-\d{1,2}$/i.test(pathname);
}

/** Only lesson documents inside a gated unit should show the sign-in wall. */
export function isProtectedLessonPath(value: string | null | undefined): boolean {
  return isProtectedUnitPath(value) && !isUnitOverviewPath(value);
}

export function isSimulatorAuthRequest(
  value: unknown,
): value is SimulatorAuthRequestMessage {
  if (!value || typeof value !== 'object') return false;

  const message = value as Partial<SimulatorAuthRequestMessage>;
  return (
    message.type === SIMULATOR_AUTH_REQUEST
    && typeof message.unit === 'number'
    && Number.isFinite(message.unit)
  );
}
