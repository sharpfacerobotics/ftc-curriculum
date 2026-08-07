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

export function isProtectedUnit(unitNumber: number): boolean {
  return Number.isInteger(unitNumber) && unitNumber >= 1;
}

export function getUnitNumber(value: string | null | undefined): number | null {
  if (!value) return null;

  const match = value.match(/(?:^|\/)unit-(\d{1,2})(?:\/|$)/i);
  if (!match) return null;

  const unitNumber = Number.parseInt(match[1], 10);
  return Number.isFinite(unitNumber) ? unitNumber : null;
}

export function isProtectedUnitPath(value: string | null | undefined): boolean {
  const unitNumber = getUnitNumber(value);
  return unitNumber !== null && isProtectedUnit(unitNumber);
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
