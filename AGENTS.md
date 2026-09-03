# AGENTS.md

Mobile client for **Agendia** — Expo + React Native + TypeScript. This repo is the app only; the backend is a separate Express/Postgres service (see `docs/`).

## Commands

- `npm run typecheck` → `tsc --noEmit`. **This is the only verification gate.** There is no test runner, no linter, no formatter configured. Always run it after changes.
- `npm start` → Expo dev server. `npm run android` / `npm run ios` / `npm run web`.
- No `prettier`/`eslint` config exists. Match existing code style by hand (no semicolon-free style, double quotes, 2-space indent, trailing commas).

## Environment (critical)

- `backendApi.ts` and `lib/supabase.ts` **throw at module load** if required env vars are missing. The app crashes immediately without `.env` present.
- Required vars (`.env`, mirrored in `.env.local`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`.
- **Gotcha:** `eas.json` build profiles inject their own `env` pointing at **different** URLs than `.env` (production Supabase `kmezfkcx…`/Railway API vs local `.env` `zogedlvr…`/CodeSandbox). Don't assume `.env` == EAS build. Verify against `.env` for local runs.
- `.env.dev` is a Supabase-local CLI generated block (Studio/Mailpit/MCP ports), not a standard env file — ignore it in app code.

## Architecture

- **Entrypoint:** `App.tsx`. Navigation is **hand-rolled**, not React Navigation. There is one `useState<NavigationState>` and a `switch` in `renderCurrentScreen()`, with the drawer in `components/CustomDrawer.tsx` and the screen header in `components/ScreenWrapper.tsx`.
  - To add a screen: add an `<AppRoute>` string, a `case` in `renderCurrentScreen()`, and an entry in `menuItems` in `CustomDrawer.tsx` (hide `Recorridos` for non-driver).
  - Sub-navigation (e.g. detail screens) uses additional `useState` like `clientsNav`/`recorridosNav` or the `NavigationState` union.
- **Feature layout:** each feature lives in `src/features/<feature>/` with `screens/`, `components/`, `hooks/`, `data/`, `utils/`, `types.ts`.
- **Imports:** the `@/*` → `./src/*` alias exists in `tsconfig.json`, **but the codebase uses only relative imports** (e.g. `../../../services`). Follow the relative-import convention.
- **State:** Supabase auth lives in `src/state/AuthContext.tsx` (`useAuth()`). Global toasts in `src/state/FeedbackContext.tsx` (`useFeedback()`).

## Services layer (never call `fetch`)

- All HTTP goes through `src/services/*.ts`, which use `api.get/post/put/patch/delete` from `services/backendApi.ts`. The api client attaches the Bearer token from the Supabase session and auto-refreshes on a 401.
- Re-exported from `src/services/index.ts`. Add endpoints there, not inline.
- **Backend `trip_type` is `ida_y_vuelta`** (underscores) — the local `TripType` type uses `'ida y vuelta'`. It also emits `ida`, `especial`. Normalize strings before comparing; never assume the space form.
- **Trip directions come from itineraries, not `trip.routes`.** `trip.routes` has no stops. Resolve via `GET /itineraries/{route_id}/stops` — the trip's `route_id` is the itinerary id. Sort stops by `stop_order`; first = origin, last = destination.
- IDs are **strings** (BigInt-serialized). Build paths with template literals and compare with `===` on strings.

## Role-aware views

- Screens receive a `role: UserRole` prop (`'driver' | 'admin' | 'client'`) from `App.tsx`. Branch driver vs client rendering inside the screen (client must hide prices/payment status/totals).
- `App.tsx` resolves `selectedClientId` differently: client → `linked_client_id`, driver/admin → selected/first client.

## Theming

- Use `useTheme()` + `useThemedStyles(createStyles)` from `src/theme`. Colors come from `theme.colors.*` (`semantic`, `trip.{outbound,roundTrip,special}`, `summaryStatus`).
- When porting HTML mock → RN, map the HTML hex colors to theme tokens. Do not hardcode colors; the themes are dynamic (incl. a purple-free palette; dark mode is `dark`).
- `trip.*` tokens map to the calendar badges: `outbound` (green/Ida), `roundTrip` (blue/Ida y vuelta), `special` (orange/Especial).

## Prototypes & Swagger

- `docs/new-calendar/` holds the UI HTML mocks (design reference) and `swagger.ts` (a **frontend TS file** describing the backend API; it is not the live OpenAPI doc). Use it as the endpoint reference. Design mocks and swagger may be slightly out of date with actual backend behavior — trust observed backend responses over prose.
