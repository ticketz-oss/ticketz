# MergeContactsService

This document explains how `MergeContactsService` works and what guarantees it provides.

## File

- `backend/src/services/ContactServices/MergeContactsService.ts`

## Purpose

`MergeContactsService(contacts, options)` consolidates multiple contact records into one winner contact in a safe and reusable way.

It is designed to be used by multiple flows (for example `verifyContact` now, and `WabaVerifyContact` later), while enforcing system-wide consistency rules.

## Main guarantees

When at least two contacts are merged, the service guarantees:

- exactly one winner contact remains
- all loser contacts are destroyed
- key related records are moved to the winner
- tags are merged without duplicates
- WhatsApp LID maps are moved/deduplicated
- ticket consistency is enforced after merge:
  - for each connection (`whatsappId`), at most one `open`/`pending` ticket remains
  - the kept ticket is the most recent by activity

## Inputs

### `contacts: Contact[]`

Candidate contacts to consolidate.

Behavior details:

- null/undefined entries are ignored
- duplicate entries by `id` are removed
- if the final unique list is empty, it returns `null`
- if only one unique contact remains, it returns that contact without merge work

### `options: MergeContactsOptions`

- `companyId: number` (required)
- `preferredWinner?: Contact`
- `resolveWinner?: (contacts: Contact[]) => Promise<Contact> | Contact`
- `prepareLoser?: (winner: Contact, loser: Contact, transaction: Transaction) => Promise<void>`
- `mergeRelatedData?: (winner: Contact, loser: Contact, transaction: Transaction) => Promise<void>`

## Winner selection

Selection order:

1. `preferredWinner` if provided (and present in candidates)
2. `resolveWinner` if provided
3. oldest contact (`createdAt` asc, then `id` asc)

## Merge phases

## Phase 1: transactional pre-loser hook

If `prepareLoser` exists, it is called for each loser inside the merge transaction, before the built-in relation moves for that loser.

Use this for caller-specific preparation that must be atomic with the merge.

## Phase 2: transactional consolidation

All core data moves happen inside one DB transaction.

For each loser contact, the service moves:

- `Message.contactId`
- `Ticket.contactId`
- `TicketNote.contactId`
- `Schedule.contactId`
- `CampaignShipping.contactId`
- `ContactCustomField.contactId`

Then it handles:

- contact tags: union winner + loser tags, then remove loser tags
- `WhatsappLidMap`: reassign maps to winner, dedupe conflicting maps
- `mergeRelatedData` hook for caller-specific transactional logic

Finally, it destroys the loser contact.

## Phase 3: post-merge ticket rule (mandatory)

After transaction commit, the service enforces the system ticket rule for the winner contact.

Rule:

- only one `open` or `pending` ticket per `whatsappId`

Selection of the kept ticket per connection:

- compute latest message activity per ticket as `MAX(Message.createdAt)`
- fallback to `Ticket.updatedAt` when no message activity exists
- keep the ticket with the highest effective activity timestamp
- tie-breaker: higher `ticket.id`

All other open/pending tickets for that same connection are closed via:

- `UpdateTicketService({ status: "closed", justClose: true })`

This keeps websocket/event behavior aligned with normal ticket updates.

## Return value

- `Promise<Contact | null>`
- returns the merged winner contact (or single existing contact)
- returns `null` only when input has no valid contact

## Notes for new callers

If another flow (such as `WabaVerifyContact`) needs extra model moves not covered by the generic service, use:

- `mergeRelatedData` for transactional custom merges
- optionally `prepareLoser` for per-loser prep inside the same transaction

Do not reimplement ticket dedup logic in callers. It is already mandatory in this service.
