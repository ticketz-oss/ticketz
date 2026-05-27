# verifyContact

This document describes how [verifyContact.ts](/home/allgood/Projetos/ticketz/backend/src/services/WbotServices/verifyContact.ts) behaves in every relevant branch of execution.

## Purpose

`verifyContact(msgContact, wbot, companyId)` resolves the incoming WhatsApp identity to a single `Contact` record for the given company.

It is responsible for:

- loading profile pictures when possible
- deciding whether the contact is a group, a phone-based contact, or an `@lid` contact
- normalizing phone numbers before lookup
- merging duplicated contact records when multiple candidates represent the same person
- linking a phone contact to a `WhatsappLidMap` when a LID is known
- closing open tickets of loser contacts only in the flows where the merge is correcting phone/LID duplication
- creating the contact when no reusable record exists

## Inputs

- `msgContact.name`: display name coming from WhatsApp, when available
- `msgContact.id`: WhatsApp identifier, such as phone JID, group JID, or `@lid`
- `msgContact.lid`: optional LID already supplied by the caller
- `msgContact.jid`: optional canonical JID for the contact
- `wbot`: active WhatsApp session, used to fetch profile pictures and resolve a LID when needed
- `companyId`: tenant scope for all lookups

## High-level flow

1. Resolve low-resolution and high-resolution profile pictures.
2. Detect whether the incoming identity is a group or an `@lid`.
3. Derive the raw contact number/id.
4. For non-group, non-`@lid` contacts, normalize the phone using `normalizePhone`.
5. Build the contact payload.
6. If it is a group, create or update immediately.
7. Otherwise, run the rest inside a mutex so LID map updates and merges do not race.
8. Search and merge duplicate phone contacts first when the input is phone-based.
9. Follow the branch for `@lid`, phone with existing contact, or phone without existing contact.
10. If no reusable contact is found, create a new one.

## Profile picture handling

The function tries to fetch two profile picture variants:

- preview image
- full image

If either fetch fails:

- preview falls back to `FRONTEND_URL/nopicture.png`
- hires picture falls back to `null`

Picture failures do not stop contact resolution.

## Identity classification

The function derives three flags:

- `isGroup`: `msgContact.id` contains `@g.us`
- `isLid`: there is no `jidNumber` and `msgContact.id` contains `@lid`
- phone-based contact: neither of the above

It also derives:

- `jidNumber`: the numeric part of `msgContact.jid`, when present
- `rawNumber`: priority is `jidNumber`, then full `@lid`, then numeric part of `msgContact.id`

## Phone normalization

Phone normalization is only applied when the incoming contact is neither a group nor an `@lid`.

`normalizePhone(rawNumber)` returns:

- `phone`: the normalized storage form
- `wphone`: the alternative WhatsApp dialing form used in some Brazilian cases

The function then builds `phoneCandidates` using all distinct values from:

- `rawNumber`
- `normalized.phone`
- `normalized.wphone`

This is what enables duplicate detection when the database contains different variants of the same phone number.

## Group branch

If the contact is a group:

- no mutex-only dedupe logic is used
- no LID logic is used
- the function calls `CreateOrUpdateContactService(contactData)` and returns

This is the simplest path.

## Mutex-protected branch

All non-group resolution runs inside `lidUpdateMutex.runExclusive(...)`.

This prevents concurrent executions from:

- creating duplicate `WhatsappLidMap` rows
- merging the same contacts at the same time
- replacing/removing LID mappings inconsistently

## Preliminary phone-contact merge

Before the main branch decision, phone-based contacts do an initial lookup by `phoneCandidates`.

This step does not run for `@lid` input.

Behavior:

- fetch all contacts whose `number` matches any phone candidate for the company
- choose a preferred winner using this order:
  - exact normalized storage number
  - raw incoming number
  - normalized `wphone`
  - oldest contact if none of the above matches directly
- merge all matches through `MergeContactsService`

Important detail:

- this first phone merge does **not** close open tickets from loser contacts
- it is meant to consolidate same-phone duplicates before continuing

The result is stored as `foundContact`.

## `@lid` input branch

This branch runs when the incoming identity itself is a LID.

### Step 1: derive LID candidates

The function considers:

- full LID, for example `12345@lid`
- partial LID without suffix, for example `12345`

### Step 2: search possible existing contacts

It searches two sources:

- `Contact.number` matching full or partial LID
- `WhatsappLidMap` where `lid` matches the full incoming LID

### Step 3: choose winner and merge

Winner preference is:

- exact/full or partial LID match from `Contact`
- mapped contact from `WhatsappLidMap`
- oldest contact if needed

Then all candidates are merged through `MergeContactsService`.

In this branch:

- loser tickets are **not** closed before merge
- the winner's `number` is **not** changed here
- only profile picture fields are refreshed on the winner

### Outcome when a match exists

If any LID candidate exists:

- the merged winner is updated with latest pictures
- that contact is returned

### Outcome when no match exists

If no LID-based contact or mapping exists:

- this branch falls through to the final create path
- a new contact is created with `number = full LID`

## Phone input with existing contact branch

This branch runs when the incoming identity is phone-based and `foundContact` already exists after the preliminary phone merge.

### Step 1: resolve the current LID

The function calls `getLid(msgContact, wbot)`.

`getLid` works as follows:

- if `msgContact.lid` is already present, use it
- else if `msgContact.id` already contains `@lid`, use it
- else ask WhatsApp via `wbot.onWhatsApp(msgContact.id)`
- if WhatsApp says the contact does not exist, throw `ERR_WAPP_CONTACT_NOT_FOUND`

### Step 2: collect all LID-related duplicates

If a LID is available, the function searches:

- contacts whose `number` is the full LID or the partial LID
- `WhatsappLidMap` rows for that LID, including their linked contacts

### Step 3: merge all representations into the phone winner

It merges:

- `foundContact`
- all LID-number contacts
- all contacts reachable through `WhatsappLidMap`

The preferred winner is always `foundContact`.

In this branch, `closeLoserTickets = true`, so before each loser is merged:

- every non-closed ticket of the loser contact is closed via `UpdateTicketService`

This means the surviving contact keeps the relationship after merge, but duplicate open/pending tickets from loser contacts are force-closed first.

### Step 4: repair or create the LID map

After merge:

- if the winner already has a `WhatsappLidMap` but with a different LID, the old map is removed
- if the winner has no map and the current LID exists, a new `WhatsappLidMap` is created

### Step 5: update canonical data

The winner is updated with:

- `number = normalized phone number`
- latest profile pictures

This makes the phone-based contact the canonical record for that person.

## Phone input with no existing phone contact branch

This branch runs when the input is phone-based but the preliminary phone merge found nothing.

The function still tries to rescue an existing LID-based record before creating a new contact.

### Step 1: resolve the current LID

It calls `getLid(msgContact, wbot)`.

### Step 2: search LID-number contacts

If a LID exists, it looks for contacts whose `number` matches:

- full LID
- partial LID

### Step 3: merge LID duplicates

If multiple such contacts exist, they are merged.

In this branch, `closeLoserTickets = true`, so loser open tickets are closed before merge.

### Step 4: create missing LID map

If the winning LID contact exists and does not already have the exact `WhatsappLidMap` row:

- create `WhatsappLidMap(companyId, lid, contactId)`

### Step 5: convert the LID contact into the phone canonical record

The winner is updated with:

- `number = normalized phone number`
- latest profile pictures

So an existing LID-only contact can be reused and converted into the canonical phone contact.

## Final create path

If none of the previous branches returns a contact, the function creates one through `CreateOrUpdateContactService(contactData)`.

This happens in cases such as:

- completely new phone contact
- completely new `@lid` contact
- phone contact for which WhatsApp did not resolve to any reusable LID-based record

## Merge behavior details

`verifyContact` delegates merging to `MergeContactsService`.

That helper currently:

- deduplicates the input list by contact id
- selects the preferred winner or falls back to the oldest contact
- reassigns `Message.contactId`
- reassigns `Ticket.contactId`
- reassigns `TicketNote.contactId`
- reassigns `Schedule.contactId`
- reassigns `CampaignShipping.contactId`
- reassigns `ContactCustomField.contactId`
- merges tags without duplicating contact-tag relations
- moves `WhatsappLidMap` rows to the winner when needed
- destroys loser contacts at the end

`verifyContact` adds one extra behavior on top of that helper for some flows:

- optionally close all non-closed tickets from loser contacts before merge

## Exact case matrix

### Case: group JID

- create/update group contact
- return immediately

### Case: phone input, exactly one matching phone record, no LID issues

- normalize phone
- refresh pictures
- optionally resolve and ensure LID map
- update canonical number
- return existing contact

### Case: phone input, multiple phone-number variants already stored

- normalize phone
- merge all phone candidates first
- continue with the merged winner

### Case: phone input, phone contact exists and separate LID contact also exists

- resolve current LID
- merge phone contact, LID-number contact, and mapped contact into the phone contact
- close loser open tickets before merge
- ensure winner LID map is correct
- update canonical phone number and pictures

### Case: phone input, no phone contact exists, but a LID contact exists

- resolve current LID
- find LID-number contacts
- merge them if duplicated
- close loser open tickets before merge
- create LID map if missing
- convert winner to canonical phone number
- return reused contact

### Case: `@lid` input, matching full-LID contact exists

- update pictures on that contact
- return it

### Case: `@lid` input, only partial-LID contact exists

- merge/select that candidate
- update pictures
- return it

### Case: `@lid` input, only `WhatsappLidMap` match exists

- use mapped contact
- update pictures
- return it

### Case: `@lid` input, full/partial/map candidates all exist as duplicates

- merge them into one contact
- keep preferred LID winner
- update pictures
- return merged contact

### Case: `@lid` input, no candidate exists

- create a new contact with the LID as its number
- return it

## Important behavior notes

- `@lid` input does not normalize into a phone number.
- Phone input does normalize and may merge multiple stored variants of the same number.
- Phone-driven LID reconciliation closes loser open tickets before merge.
- Pure `@lid` reconciliation does not close loser tickets before merge.
- The mutex only protects the non-group flow.
- Profile picture updates are best-effort and never block contact resolution.
- If WhatsApp says the phone contact does not exist during LID resolution, the function throws `ERR_WAPP_CONTACT_NOT_FOUND`.

## Why the canonical number changes in some branches

When the input is phone-based, the function prefers storing the canonical normalized phone number in `Contact.number`.

This is why existing LID-based contacts can be converted into phone-based contacts when a phone identity is later resolved for the same person.

## Why some merges close tickets and others do not

The current rule is practical rather than universal:

- phone/LID consolidation that turns one person back into a single phone contact closes loser open tickets first
- pure LID-side consolidation only merges records and keeps ticket state untouched

That difference reflects how the current wbot flow uses phone contacts as the canonical operational identity.