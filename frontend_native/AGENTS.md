# TicketHub Frontend Native Agent Guide

## Purpose

This file is a working guide for anyone modifying this Expo React Native app with Strapi Backend.
It documents the current setup, architecture, data flow, and repo-specific
constraints based on the present codebase.

## Stack

- Expo SDK 54
- React 19
- React Native 0.81
- React Navigation v7
- `apisauce` for HTTP
- `twrnc` for styling
- Expo modules in active use:
  - `expo-camera`
  - `expo-secure-store`
  - `expo-document-picker`
  - `expo-file-system`
  - `expo-media-library`
  - `expo-image-picker`
  - `expo-sharing`
  - `expo-linear-gradient`

## App Entry

- `index.js` registers the Expo root component.
- `App.js` mounts `NavigationContainer`.
- `Configs/Navigations.js` owns auth bootstrapping and the root stack.

## Navigation Structure

Root stack:

- `login` -> `Pages/Login.js`
- `home` -> `Pages/Home.js`
- `generateQR` -> `Pages/GenerateQRSharing.js`

Home shell:

- `Pages/Home.js` renders `Components/BottomTabs.js`

Bottom tabs:

- `Dashboard` -> `Screens/Dashboard.js`
- `Tickets` -> `Screens/Ticket.js`
- `Scan` -> `Screens/Scan.js`
- `Event` -> `Screens/Event.js`
- `More` -> `Screens/Report.js`

## State and Context

Contexts are defined in `Configs/AuthContext.js`:

- `EventContext`
- `SaleTicket`
- `ScanContext`
- `ExportContext`

These are local screen-level coordination contexts, not a global state system.

## API Layer

All API calls go through `Configs/globalApi.js`.

Important details:

- Base URL comes from `EXPO_PUBLIC_API_URL`
- JWT is injected on every request from `expo-secure-store`
- A `401` response triggers logout and navigates to `login`, but the current
  implementation uses `navigate` instead of a full navigation reset
- The backend appears to be Strapi-style based on query shapes and payloads

Current API methods cover:

- auth
- events
- tickets
- ticket limits
- booked tickets
- check-ins
- agents
- file upload
- bulk ticket creation

## Auth Model

Auth is handled by:

- `Pages/Login.js`
- `Configs/UserAuth.js`
- `Configs/Navigations.js`

Current behavior:

- User logs in with `/auth/local`
- User data is stored in `expo-secure-store`
- App checks token validity on boot and on foreground resume
- The current implementation also stores the raw password for re-validation

That last point is a known security weakness and should be treated carefully if
auth is refactored.

## Main Product Flows

### 1. Event Management

Files:

- `Screens/Event.js`
- `Components/CreateEvent.js`
- `Components/SetTicket.js`
- `Components/EventCard.js`

Responsibilities:

- create live events
- upload event image
- attach ticket types to events
- configure limits for ticket types
- mark an event as ended

### 2. Ticket Generation

Files:

- `Screens/Ticket.js`
- `Components/SingleEntry.js`
- `Components/BulkUploadWithSection.js`
- `Pages/GenerateQRSharing.js`

Responsibilities:

- manual ticket booking
- bulk ticket import from section-separated CSV
- generate an online ticket reference
- render a barcode-style ticket for sharing/saving

Bulk import format note:

- the current importer expects ticket-type sections such as `### VIP ###`
- each section is matched to an event ticket type by name
- this is not a generic flat CSV import flow

Key booking fields used across the app:

- `event`
- `ticket`
- `Name`
- `Email`
- `Phone`
- `Payment`
- `agent`
- `SeatNo`
- `Note`
- `Ticket_Id`
- `Ticket_Status`
- `Seller_Id`

### 3. Check-In

Files:

- `Screens/Scan.js`
- `Components/BuletoothScanner.js`
- `Components/ManualSearch.js`
- `Components/ScanTicketDetails.js`
- `Components/CheckInAudience.js`

Responsibilities:

- lookup by Strapi `documentId` or custom `Ticket_Id`
- check in a ticket
- create a separate check-in record
- show recent check-ins by event

Check-in-related fields:

- `CheckIn_Status`
- `Scanner_Id`
- `DateTime`

### 4. Reporting and Admin

Files:

- `Screens/Report.js`
- `Components/ExportEventsTicket.js`
- `Components/CreateAgent.js`

Responsibilities:

- export all booked tickets as CSV
- export event + ticket-type scoped CSV reports
- create agents
- logout

## File and Folder Map

- `Pages/`
  - top-level pages and QR/ticket display screens
- `Screens/`
  - main tab screens
- `Components/`
  - UI units plus most business logic
- `Configs/`
  - API, auth persistence, navigation, contexts
- `assets/`
  - icons and static images

## Important Implementation Notes

- Styling is mostly done inline with `twrnc`.
- Business logic is often colocated inside screen/components instead of hooks.
- There is no dedicated service layer beyond `globalApi.js`.
- There is no test setup in `package.json`.
- The repo currently includes `node_modules`, so file searches should exclude it
  when practical.

## Known Codebase Risks

These are current behavior risks worth knowing before editing:

- auth persists the raw password in secure storage
- limited-ticket checks can become stale in long sessions
- dashboard channel analytics are likely misclassified
- CSV import uses simple comma splitting, not a robust CSV parser
- some views may reference `Event`/`Agent` while the rest of the app commonly
  uses `event`/`agent`
- `getAllBookedTickets` is capped at 10,000 rows

## Current Naming Quirks

- `Components/BuletoothScanner.js` is misspelled in the filename but is used by
  current imports. Do not rename it without updating import sites.
- `Pages/GenerateQRSharing.js` is the active `generateQR` route.
- `Pages/GenerateQR.js` appears to be an older alternate ticket output screen.

## Environment

Expected env var:

- `EXPO_PUBLIC_API_URL`

Current Android config in `app.json` includes media/storage-related permissions
and Expo plugins for:

- `expo-font`
- `@react-native-community/datetimepicker`
- `expo-secure-store`
- `expo-media-library`

## Useful Commands

- `npm start`
- `npm run android`
- `npm run ios`
- `npm run web`

## Editing Guidance

- Prefer extending `globalApi.js` instead of scattering fetch logic.
- Preserve the existing screen/context structure unless there is a clear reason
  to refactor.
- Be careful when changing auth bootstrapping in `Configs/Navigations.js`.
- Validate backend field names against Strapi responses before changing casing.
- Watch for inconsistent relation naming in the current codebase, especially
  `event` vs `Event` and `agent` vs `Agent`.
- If touching CSV import/export, treat quoting and commas as a real bug surface.
- If touching 'import tickets', preserve the `### TicketType ###` section contract
  unless the importer and template are both changed together.
- If touching ticket limits, re-check both single-entry and bulk-import flows.
- Keep in mind that `Pages/GenerateQRSharing.js` is the active `generateQR`
  route and `Pages/GenerateQR.js` is an older alternate screen.

## Development Guidelines

- Use Context7 MCP for documentation lookup.

## Subagent lifecycle

- Subagents must NOT auto-close after returning results
- Default state: persistent
- Only close when explicitly instructed by user
