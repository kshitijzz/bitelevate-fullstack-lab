# FS-BUG-02: Ghost Status Rollbacks

## Incident Description

When users rapidly drag a task between columns under slow network conditions, an older request can overwrite a newer status update.

## Reproduction Steps

1. Send a PATCH request to update the task to IN_PROGRESS.
2. Delay the first request before its database commit.
3. Immediately send another PATCH request to update the task to DONE.
4. Allow the second request to commit first.
5. Allow the first request to commit afterward.

## Actual Result

The final database status becomes IN_PROGRESS.

## Expected Result

The final database status should remain DONE because it represents the latest user action.

## Root Cause

Concurrent status updates are not protected by optimistic locking or version checks.

An older request can overwrite a newer update when it commits later.

## Suggested Solution

- Implement optimistic concurrency control.
- Add a version field to task records.
- Reject stale updates when the version has changed.
- Ensure the latest valid user action is preserved.

## Integration Test

test_rapid_status_updates_concurrency()

## Validation

Both tests passed.

The concurrency test successfully reproduced the stale-write issue:

- First response: IN_PROGRESS
- Second response: DONE
- Final database status: IN_PROGRESS
