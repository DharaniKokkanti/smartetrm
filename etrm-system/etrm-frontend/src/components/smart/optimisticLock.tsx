import { Button } from 'antd';
import type { NotificationInstance } from 'antd/es/notification/interface';
import type { ProblemDetail } from '@services/api';

/**
 * V127 — shared handling for a concurrent-edit lost-update conflict: two
 * users open the same record, both save, whoever saves second used to
 * silently overwrite the first user's change with no warning. The backend
 * now detects this via JPA optimistic locking (@Version) and returns a 409
 * tagged with this errorCode — distinct from ConflictException's ordinary
 * business-rule 409s, which need the generic error toast, not this prompt.
 */
export const OPTIMISTIC_LOCK_ERROR_CODE = 'OPTIMISTIC_LOCK_CONFLICT';

export function isOptimisticLockConflict(err: ProblemDetail): boolean {
  return err.errorCode === OPTIMISTIC_LOCK_ERROR_CODE;
}

/**
 * Persistent (not auto-dismissing) conflict notification — a transient
 * toast that vanishes in a few seconds defeats the purpose here, since the
 * user's in-progress edit was NOT saved and silently missing this message
 * would be exactly the kind of silent data loss it exists to prevent.
 *
 * V1 scope: "Reload" does a full page reload rather than a bespoke per-form
 * discard-and-refetch flow — guarantees no stale state anywhere (form
 * fields, React Query cache, minimized drafts) with no per-entity plumbing.
 * A richer field-level merge UI (show what changed, let the user pick) is
 * real future work, not this pass's scope — this rollout covers 5 of ~153
 * entities to prove the pattern; see the handoff doc for the rest.
 */
export function showOptimisticLockConflict(notificationApi: NotificationInstance) {
  notificationApi.error({
    key: 'optimistic-lock-conflict',
    message: 'This record was changed by someone else',
    description: 'Someone else saved changes to this record after you opened it, so your changes were not saved. Reload to see the latest version before trying again.',
    duration: 0,
    actions: (
      <Button type="primary" size="small" onClick={() => window.location.reload()}>
        Reload
      </Button>
    ),
  });
}
