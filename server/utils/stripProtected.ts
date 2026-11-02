const PROTECTED = ['_id', 'id', 'userId', 'createdAt', 'updatedAt', '__v'];

/** Removes server-managed fields from a request body before it is used in an update. */
export function stripProtected<T extends Record<string, any>>(body: T): Partial<T> {
  const copy: Record<string, any> = { ...(body || {}) };
  for (const key of PROTECTED) delete copy[key];
  return copy as Partial<T>;
}
