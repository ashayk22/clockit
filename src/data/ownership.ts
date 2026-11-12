/**
 * Ownership slot shared by every user-scoped record.
 *
 * Phase 11 only prepares the models for the authenticated backend — it never
 * fabricates an identity. Nothing populates this field today and the local
 * repositories leave it untouched, so existing payloads round-trip unchanged.
 * When real authentication arrives it becomes the foreign key to the user row.
 */
export interface OwnedEntity {
  userId?: string | null;
}
