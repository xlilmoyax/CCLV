# Security Specifications & Hardened Firestore Rules Spec

This specification document outlines the security rules validation strategy, data invariants, and the test payload suite ("The Dirty Dozen") to verify Zero-Trust security and prevent Updates-Gaps, Orphaned Writes, or Privilege Escalation.

## 1. Data Invariants

1. **User Profiling and Registration**:
   - No user should be able to create, write, or update another user's profile (`approved_workers` or `pending_workers`).
   - Standard registered users cannot promote themselves to `isAdmin: true`.

2. **Incidents Management**:
   - Any registered user (approved or pending) can read incidents.
   - Any approved worker/admin can create/edit incidents.
   - Updates to fields like `cost` and `actionsTaken` should only be modifiable if certain conditions are met, or restricted by role (e.g. only administrators/mantenimiento can define cost).

3. **Eddie Memories and Dialogues**:
   - Only administrators or approved maintenance personnel should be able to write or update custom memories.
   - Conversations under `chats` are accessible and manageable only by their owner (`userEmail`).

## 2. The "Dirty Dozen" Payloads (Adversarial Tests)

Here are the 12 payloads engineered to try to bypass security, which our security rules must synchronously deny:

1. **Unauthenticated Incident Injection**: Creating an incident with a spoofed/empty user credentials.
2. **Ghost Field Mutation**: Writing an incident with unapproved custom properties (e.g., `isVerifiedBySystem: true`).
3. **Privilege Escalation**: Registering/modifying a profile directly with `isAdmin: true` without admin verification.
4. **Foreign Profile Modification**: Overwriting another user's approved worker profile.
5. **Self-Approve Worker**: Moving oneself from `pending_workers` to `approved_workers` without administrative rights.
6. **Task Status Bypass**: Modifying a completed task's date or frequency after completion.
7. **Adversarial ID Poisoning**: Trying to create an incident with a massive path-injection string ID (e.g., `<script>alert(1)</script>`).
8. **Malicious Cost Spoof**: Setting negative costs or extremely massive numeric values (e.g., `$999,999,999`) to exhaust systems.
9. **Fake AI memory insertion**: Creating custom responses for Eddie to feed fake/unsafe dialogues.
10. **Chat Session Hijack**: Reading/fetching a private chat history belonging to another user's email.
11. **Timestamp Forgery**: Modifying `createdAt` or `updatedAt` using client-side clocks rather than `request.time`.
12. **Activity Spoofing**: Injecting unauthorized system log messages under `/activities`.

---

## 3. Test Runner Skeleton (`firestore.rules.test.ts`)

```typescript
// Test suites for verification of all 12 adversarial conditions
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

describe('Zero-Trust Firestore Security Rules Test Suite', () => {
  it('should deny unauthenticated incident injection', async () => {
    // Test code here...
  });

  it('should deny ghost fields in updates', async () => {
    // Test code here...
  });

  it('should block self-assignment to isAdmin role', async () => {
    // Test code here...
  });
});
```
