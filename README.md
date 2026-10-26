# Chains Admin Tool

A standalone Next.js admin application for managing chains, comparing input sources with venues, and performing bulk operations on chain data.

## Features

- **Outer Join View**: Compare inputs from extracted_places with venues in real-time
- **Side-by-Side Comparison**: View attribute differences between input and venue data
- **Harmonization**: Link/unlink inputs to venues, create and manage EPWs
- **Bulk Operations**: Merge venues, add/remove from chains, close venues, propose WOEs
- **Advanced Filtering**: Filter by match status, source, address status, EPW status
- **Dupe Detection**: Automatically detect and merge duplicate venues
- **Audit Logging**: Track all changes with rollback capability
- **EPW Management**: Review and approve/reject edit proposals

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: MongoDB (multi-cluster: venues_aux, hypervenues)
- **State Management**: SWR for data fetching
- **TypeScript**: Full type safety

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and navigate through:
- **Home** (`/`) - Welcome page
- **Chains List** (`/chains`) - Browse all chains
- **Chain Detail** (`/chains/[chainId]`) - Manage specific chain

## Application Structure

### Pages

1. **Home Page** (`/`)
   - Welcome screen with feature overview
   - Links to browse chains or view demo

2. **Chains List** (`/chains`) 
   - Browse all 15 mock chains
   - Search, sort, and paginate
   - Click any chain to view details

3. **Chain Detail** (`/chains/[chainId]`)
   - Outer join view of inputs vs venues
   - Side-by-side attribute comparison
   - Bulk operations and EPW management
   - Dupe detection
   - Country filtering

## Features

```
/Users/syeo/Chain/
├── app/
│   ├── chains/[chainId]/
│   │   ├── page.tsx              # Main chain page
│   │   └── layout.tsx
│   ├── api/
│   │   ├── chains/[chainId]/
│   │   │   ├── outer-join/       # Outer join API
│   │   │   ├── harmonize/        # Harmonization API
│   │   │   ├── bulk-operations/  # Bulk ops API
│   │   │   ├── epws/             # EPW management
│   │   │   └── dupes/            # Dupe detection
│   │   └── audit-log/            # Audit & rollback
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn components
│   └── chains/
│       ├── outer-join-table.tsx
│       ├── attribute-compare-panel.tsx
│       ├── bulk-actions-menu.tsx
│       ├── filter-bar.tsx
│       ├── epw-list.tsx
│       └── chain-header.tsx
├── lib/
│   ├── mongodb.ts               # MongoDB client
│   ├── utils.ts                 # cn() utility
│   └── api-helpers.ts           # API utilities
├── types/
│   └── chain.ts                 # TypeScript types
└── package.json
```

## MongoDB Collections

### venues_aux Cluster
- `extracted_external_places`: Input data from crawls
- `canonicalUrls`: Join table linking inputs to venues
- `external_place_woes`: Edit proposals (EPWs)
- `edit_audit_log`: Audit trail for all operations

### hypervenues Cluster
- `venues`: Canonical venue data
- `chains`: Chain metadata

## Usage

### Viewing Chain Data

Navigate to `/chains/{chainId}?country=US` to view:
- All inputs from extracted_places for that chain
- All venues in that chain
- Outer join showing matched, input-only, and venue-only rows

### Filtering

Use the FilterBar to filter by:
- Match status (Matched, Input Only, Venue Only)
- Source (e.g., Google, Yelp)
- Address status (Has Address, Empty Address)
- EPW status (Has Pending EPW, No EPW)
- Search by name or address

### Bulk Operations

1. Select multiple rows using checkboxes
2. Click "Actions" dropdown
3. Choose operation:
   - Merge venues
   - Add/remove from chain
   - Move to different chain
   - Close venues
   - Propose WOE by field

### Harmonization

Expand a row to see attribute comparison, then:
- Click "Link Input to Venue" to create canonicalUrl
- Click "Propose WOE" to create edit proposal
- Click "Update Venue from Input" to apply all changes

### EPW Management

1. Click "Pending EPWs" button
2. Review proposals
3. Approve or reject each EPW

### Dupe Detection

1. Click "Run Dupe Detection"
2. View detected duplicates in table
3. Select duplicates and choose "Merge" from bulk actions

## API Authentication

All write operations require the `CHAIN_ADMIN_TOKEN` header:

```bash
curl -X POST http://localhost:3000/api/chains/{chainId}/bulk-operations \
  -H "Content-Type: application/json" \
  -H "x-admin-token: your-token" \
  -d '{"operation":"close_venues","rowIds":["venue_123"]}'
```

## Rollback

View audit log at `/api/audit-log?chainId={chainId}`

Rollback operation:
```bash
curl -X POST http://localhost:3000/api/audit-log/rollback \
  -H "Content-Type: application/json" \
  -H "x-admin-token: your-token" \
  -d '{"auditLogId":"..."}'
```

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Notes

- All edits use the `CHAIN_ADMIN_TOKEN` for tracking
- Audit logs enable rollback of all operations
- MongoDB indexes recommended:
  - `extracted_external_places`: `{cid: 1, cc: 1}`
  - `venues`: `{vcids: 1, cc: 1}`
- Pagination defaults to 50 rows, max 200

## License

Internal use only
