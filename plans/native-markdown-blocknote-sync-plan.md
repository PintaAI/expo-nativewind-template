# Native Markdown Notes With BlockNote-Compatible Sync

## Goal

Implement entry-attached rich notes in `ethos` using `react-native-enriched-markdown` for native editing while keeping data compatible with the existing `cashflow-notion` BlockNote note model.

The mobile app should feel native, work offline with SQLite, and sync notes to the web app so they can be opened in BlockNote.

## Non-Goals

- Do not embed BlockNote in `ethos` through WebView/Expo DOM for the first version.
- Do not build a full Notion/BlockNote clone natively.
- Do not support every BlockNote block type in the native editor.
- Do not add collaboration, note sharing, comments, or Yjs/Hocuspocus in this phase.
- Do not add a standalone Notes tab until entry-attached notes are stable.

## Current State

### `ethos`

- Cashflow entries are stored locally in SQLite.
- `entries` already has a `notion_id TEXT` column in `src/data/cashflow/schema.ts`.
- `CashflowEntry` does not currently expose `notionId`.
- `repository.mapEntry` does not map `notion_id`.
- Entry create/update flows do not accept or persist `notionId`.
- API sync types for entries do not include `notionId`.
- The entry form currently uses `entry.name` as the quick title/note field.

### `cashflow-notion`

- Prisma `Entry` has `notionId String? @unique`.
- Prisma `Note` stores:
  - `title`
  - `icon`
  - `iconType`
  - `iconColor`
  - `contentJson`
  - `contentHtml`
  - `contentMarkdown`
  - `pinned`
- The web BlockNote editor stores `contentJson`, `contentHtml`, and `contentMarkdown` on each save.
- `/api/v1/notes` endpoints already exist for note CRUD/content updates.
- Entry API responses and create/update paths currently do not expose or persist `notionId`.

## Architecture Decision

Use Markdown as the native editing format, but store and sync all note content in the same shape as `cashflow-notion`.

```ts
type SyncedNoteContent = {
  contentJson: string;      // BlockNote-compatible JSON for web compatibility
  contentHtml: string;      // generated HTML compatibility/export field
  contentMarkdown: string;  // native editor source
};
```

### Source Of Truth Rules

- On mobile, `contentMarkdown` is the editable source of truth.
- On mobile save, generate `contentJson`, `contentHtml`, and plaintext preview from Markdown.
- On web, BlockNote edits `contentJson` and generates `contentMarkdown`/`contentHtml`.
- On mobile pull, prefer server `contentMarkdown` for editing if present.
- Always preserve server `contentJson`, even if native editor only supports a subset.

## Data Model

### Local SQLite Table

Add a local `notes` table to `ethos`.

```sql
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY NOT NULL,
  remote_id TEXT,
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'BookEditIcon',
  icon_type TEXT NOT NULL DEFAULT 'hugeicon',
  icon_color TEXT NOT NULL DEFAULT 'default',
  content_json TEXT,
  content_html TEXT,
  content_markdown TEXT,
  content_plaintext TEXT,
  pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  last_synced_at TEXT
);
```

### Entry Link

Continue using the existing `entries.notion_id` column.

Local behavior:

- `entries.notion_id` stores the local `notes.id`.
- When the note is synced, `notes.remote_id` stores the server `Note.id`.
- During entry sync, send the note server ID as `notionId` when available.

## Type Changes In `ethos`

### `CashflowEntry`

Add:

```ts
notionId: string | null;
```

### `CreateEntryInput`

Add optional:

```ts
notionId?: string | null;
```

### API Types

Extend `ServerEntry`:

```ts
notionId: string | null;
```

Extend `CreateEntryBody`:

```ts
notionId?: string | null;
```

Add `ServerNote` and note API body types:

```ts
type ServerNote = {
  id: string;
  title: string;
  icon: string;
  iconType: 'hugeicon' | 'emoji';
  iconColor: string;
  contentJson: string | null;
  contentHtml: string | null;
  contentMarkdown: string | null;
  pinned: boolean;
  updatedAt: string;
};
```

## Markdown To BlockNote Compatibility

### Supported Mobile Subset

The first version should support content that maps cleanly to BlockNote:

- Paragraphs
- Headings
- Bullet list items
- Numbered list items
- Task list items
- Blockquotes
- Inline bold
- Inline italic
- Inline strikethrough
- Inline code
- Links

### BlockNote Block Shape

BlockNote blocks have this basic structure:

```ts
type BlockNoteBlock = {
  id: string;
  type: string;
  props: Record<string, boolean | number | string>;
  content: InlineContent[] | undefined;
  children: BlockNoteBlock[];
};
```

Example paragraph:

```json
{
  "id": "block-abc",
  "type": "paragraph",
  "props": {},
  "content": [
    { "type": "text", "text": "Coffee receipt", "styles": {} }
  ],
  "children": []
}
```

Example heading:

```json
{
  "id": "block-def",
  "type": "heading",
  "props": { "level": 2 },
  "content": [
    { "type": "text", "text": "Trip expenses", "styles": {} }
  ],
  "children": []
}
```

Example checklist item:

```json
{
  "id": "block-ghi",
  "type": "checkListItem",
  "props": { "checked": false },
  "content": [
    { "type": "text", "text": "Ask for reimbursement", "styles": {} }
  ],
  "children": []
}
```

### Conversion Strategy

Create a small adapter module in `ethos`, for example:

```txt
src/lib/notes/blocknoteMarkdown.ts
```

Functions:

```ts
markdownToBlockNoteJson(markdown: string): string;
blockNoteJsonToMarkdown(contentJson: string): string;
markdownToPlaintext(markdown: string): string;
markdownToBasicHtml(markdown: string): string;
```

Initial parser can be intentionally conservative:

- Split Markdown by lines.
- Group consecutive plain lines into paragraphs.
- Detect heading prefixes: `#`, `##`, `###`.
- Detect bullets: `- `, `* `.
- Detect numbered list items: `1. `.
- Detect task list items: `- [ ] ` and `- [x] `.
- Detect blockquotes: `> `.
- Parse simple inline marks with regex or a small tokenizer.

The adapter must prefer preserving user text over perfect formatting.

### Unsupported Blocks

When converting BlockNote JSON to Markdown:

- Known blocks should convert to Markdown.
- Unknown blocks should become a readable placeholder.
- Do not mutate or discard the original `contentJson` unless the user edits and saves from mobile.

Placeholder example:

```md
[Unsupported BlockNote block: table]
```

## `react-native-enriched-markdown` Integration

Install:

```sh
npx expo install react-native-enriched-markdown
```

Notes:

- Requires React Native New Architecture/Fabric.
- Requires native rebuild, so it will not work in Expo Go.
- `ethos` already uses dev-client workflows, so this is acceptable.
- Use latest compatible version for RN 0.85.

### Native Editor Component

Create:

```txt
src/components/notes/EntryMarkdownNoteEditor.tsx
```

Responsibilities:

- Render `EnrichedMarkdownTextInput`.
- Provide app-themed styles.
- Debounce save.
- Expose toolbar actions.
- Optionally render preview with `EnrichedMarkdownText`.

Toolbar actions:

- Heading
- Bold
- Italic
- Bullet
- Numbered
- Todo
- Quote
- Link later

The toolbar can use imperative APIs from `EnrichedMarkdownTextInput` if sufficient. If a specific action is not supported, use text insertion around the current selection.

## Routes And UI

### New Route

Create an entry note screen:

```txt
src/app/(cashflow)/forms/entry-note.tsx
```

Query params:

```ts
{ entryId: string }
```

Behavior:

- Load entry by `entryId`.
- If entry has no `notionId`, create local note and attach it.
- Load note content.
- Edit Markdown.
- Autosave content locally.
- Mark note `sync_status = 'pending' | 'updated'`.
- Mark entry updated if `notionId` was newly attached.

### Entry UI Integration

Add a “Detail note” action from one or more places:

- Entry edit form toolbar.
- Day detail panel entry row.
- Entry detail sheet/screen if present.

Visual indicator:

- If `entry.notionId` exists, show a small note icon or “has note” marker.

## Repository Work In `ethos`

Add note repository functions:

```ts
createNote(db, input)
getNote(db, noteId)
getNoteByRemoteId(db, remoteId)
updateNoteContent(db, noteId, content)
deleteNote(db, noteId)
getOrCreateEntryNote(db, managementId, entryId)
listDirtyNotes(db)
markNoteSynced(db, localId, remoteId, lastSyncedAt)
```

Update entry repository:

- Map `notion_id` to `notionId`.
- Insert `notion_id` when provided.
- Update `notion_id` when provided.
- Include `notion_id` in list/select rows.

## API Work In `cashflow-notion`

### Entry API Compatibility

Update backend types and mappers:

- Add `notionId` to `CashflowEntry` in `lib/db/types.ts`.
- Return `notionId` from `toEntry` in `lib/db/entries.ts`.
- Accept `notionId` in `createEntry`.
- Accept `notionId` in `updateEntry`.
- Include `notionId` in create/update API routes.

Important validation:

- If `notionId` is provided, ensure the current user has note membership.
- Optionally ensure one note can only be attached to one entry because Prisma already has `@unique`.

### Existing Note APIs

Use existing endpoints:

- `GET /api/v1/notes`
- `POST /api/v1/notes`
- `GET /api/v1/notes/[id]`
- `PUT /api/v1/notes/[id]/content`
- `DELETE /api/v1/notes/[id]`

`PUT /api/v1/notes/[id]/content` expects:

```json
{
  "contentJson": "...",
  "html": "...",
  "markdown": "..."
}
```

Mobile should send generated `contentJson`, generated/basic `html`, and native `markdown`.

## Sync Flow

### Push Local Note

For each dirty local note:

1. If no `remote_id`, call `POST /api/v1/notes` with `{ title }`.
2. Store returned `noteId` as `remote_id`.
3. Call `PUT /api/v1/notes/[remote_id]/content` with generated content.
4. Mark note synced.
5. If an attached entry references the local note, push entry update with server `notionId`.

### Pull Server Note

For each server note:

1. Match by `remote_id`.
2. If missing, create local note.
3. Store `contentJson`, `contentHtml`, `contentMarkdown`.
4. Set local editable content from `contentMarkdown` if present.
5. If local has unsynced changes, use last-write-wins for MVP and mark conflicts later.

### Entry Sync

When pushing an entry:

- If local `notionId` exists, resolve local note to `notes.remote_id`.
- Send remote note ID as `body.notionId`.
- If remote note ID does not exist yet, push the note before the entry.

When pulling an entry:

- If server `notionId` exists, find or create local note placeholder by remote ID.
- Store local note ID into `entries.notion_id`.

## Conflict Strategy

MVP:

- Use last-write-wins based on `updatedAt`.
- If both local note and remote note changed since `last_synced_at`, keep local content and log a warning.

Future:

- Add conflict copies.
- Add visual conflict review.
- Add per-note `sync_status = 'conflict'`.

## Implementation Phases

### Phase 1: Local Notes

- Add `notes` table.
- Add note repository functions.
- Expose `notionId` on entries.
- Add entry note route.
- Add native Markdown editor.
- Save Markdown locally.
- Generate BlockNote JSON locally.
- Add entry UI action.

Verification:

- Create note for an entry.
- Close/reopen app and confirm note persists.
- Confirm `entries.notion_id` is set.
- Confirm generated `content_json` is parseable JSON.

### Phase 2: Backend Entry `notionId`

- Patch `cashflow-notion` entry types/mappers/API to expose/persist `notionId`.
- Verify entry list returns `notionId`.
- Verify PATCH can attach a note to an entry.

Verification:

- Create note through `/api/v1/notes`.
- Attach note to entry through `/api/v1/entries/[id]`.
- Fetch entry and confirm `notionId` is returned.

### Phase 3: Note Sync

- Add note API client in `ethos`.
- Push dirty notes.
- Pull server notes.
- Wire note sync before entry sync when needed.

Verification:

- Create note on mobile, sync, open web, confirm BlockNote loads content.
- Edit note on web, sync mobile, confirm Markdown content appears.
- Attach note to entry and confirm relationship exists on both sides.

### Phase 4: Polish

- Add note preview in entry list/detail.
- Add “has note” indicator.
- Improve toolbar.
- Add more robust Markdown parsing.
- Add conflict handling.

## Testing Checklist

### TypeScript

Run in `ethos`:

```sh
npx tsc --noEmit
```

Run in `cashflow-notion` after backend patches:

```sh
npx tsc --noEmit
```

### Expo Config

After dependency/native changes:

```sh
npx expo config --json
```

### Native Smoke Tests

- Android dev-client build launches.
- iOS dev-client build launches if available.
- Note editor opens from entry.
- Keyboard does not cover editor controls.
- Autosave does not lag typing.
- App restart preserves note content.

### Sync Smoke Tests

- Mobile-created note appears in web Notes list.
- Web BlockNote opens the mobile-created note.
- Web edit updates mobile note after sync.
- Entry-note relationship survives sync both directions.

## Risks

- Markdown to BlockNote JSON is lossy compared to direct BlockNote editing.
- `react-native-enriched-markdown` requires a native rebuild and will not work in Expo Go.
- Advanced BlockNote content edited on web may not round-trip perfectly through native Markdown editing.
- Backend currently needs a small entry API compatibility patch for `notionId`.
- Note sync adds ordering requirements: notes must sync before entries that reference them.

## Recommended MVP Acceptance Criteria

- Users can attach one rich note to a cashflow entry in `ethos`.
- Notes are edited natively as Markdown.
- Local notes persist offline.
- Notes generate valid BlockNote-compatible JSON.
- Notes sync to `cashflow-notion` using existing Note content fields.
- Web BlockNote can open mobile-created notes.
- Mobile can display/edit web-created notes through `contentMarkdown`.
