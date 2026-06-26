/** Generates a client-only id for staged child records before they have a
 *  real server id. Never sent to the API — stripped out at save time. */
export function localId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
