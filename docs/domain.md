# Domain Notes

Agendia is a mobile application for tracking recurring transportation trips, managing billing periods, and sharing closed summaries with clients.

This document is intended as domain context for AI-assisted development. It defines business concepts, relationships, and important behavioral rules.

---

## Core domain

The system has two layers:

### Operational layer
Represents what happens day by day.

- trips
- routes
- route stops
- rates

### Billing layer
Represents closed billing periods and payment lifecycle.

- summaries

A calendar is **not** a database entity. It is a UI projection built from trips grouped by date.

---

# Entities

## users

Represents the driver / account owner.

Fields:

- id
- name
- email
- created_at

Rules:

- A user owns many clients
- A user creates trips
- A user creates summaries

---

## clients

Represents the passenger / customer.

Fields:

- id
- user_id
- name
- billing_cycle (`weekly` | `monthly`)
- created_at

Rules:

- A client belongs to one user
- A client can have many routes
- A client can have many rates
- A client can have many trips
- A client can have many summaries

---

## routes

Represents a habitual route agreed with a client.

Examples:

- Home → Work
- Home → School

Fields:

- id
- client_id
- name
- created_at

Rules:

- A client can have multiple routes
- A route contains ordered stops
- A route can have multiple rates over time

---

## route_stops

Represents ordered stops inside a route.

A route is not limited to origin and destination. It can contain intermediate stops.

Example:

- Home
- Grandmother's house
- Work

Fields:

- id
- route_id
- address
- stop_order

Rules:

- Stops are ordered
- A route can contain one or many stops

---

## rates

Represents the agreed pricing rules valid during a time period.

A rate is historical and time-bound.

Fields:

- id
- client_id
- route_id
- base_price
- surcharge_price
- start_date
- end_date (nullable)
- created_at

Rules:

- A client may have multiple rates over time
- Rates must not be edited historically
- When pricing changes, create a new rate
- At any trip date there should be only one active rate per client and route

Example:

- Week 1 → $5000
- Week 2 → $6000

---

## trips

Represents a real trip event.

A trip is the atomic operational record.

Fields:

- id
- user_id
- client_id
- route_id
- rate_id
- summary_id (nullable)

- trip_date
- trip_type (`outbound` | `return`)

- final_price
- has_surcharge
- surcharge_reason

- special_type (nullable)
- notes (nullable)

- created_at

Rules:

- One trip represents one actual movement
- Round trips are represented as two trips
- Trips can belong to a summary
- A trip can only belong to one summary
- Trips remain editable until included in a closed summary

Examples of special situations:

- extra stop
- detour
- exceptional route variation

---

## summaries

Represents a closed billing snapshot for a period.

A summary is not a visual summary. It is a historical billing record.

Fields:

- id
- client_id
- user_id

- period_start
- period_end
- period_type (`weekly` | `monthly`)

- total_trips
- total_amount

- status (`draft` | `sent` | `paid` | `archived`)

- sent_at
- paid_at
- archived_at

- whatsapp_msg
- notes

- created_at

Rules:

- A summary groups trips for a defined period
- When a summary is created, selected trips receive `summary_id`
- A trip cannot belong to multiple summaries
- `total_trips` and `total_amount` are intentionally denormalized
- Summary values represent a snapshot of the moment of closing
- Later edits to trips or rates must not alter already sent summaries

Lifecycle:

- `draft` → summary created
- `sent` → sent to client
- `paid` → payment received
- `archived` → historical storage

---

# Calendar behavior

The calendar is the main mobile interaction model.

It is built by grouping trips by `trip_date`.

A day may contain multiple trips.

Visual examples:

- green stamp → one outbound trip
- blue stamp → outbound + return
- alternate color → special trip / extra stop

A calendar cell is a visual aggregation only.

No calendar rows are persisted.

---

# Scheduling rules

## Rate resolution

When creating a trip, the system should resolve the active rate by:

- client
- route
- trip date

Valid rate:

- `start_date <= trip_date`
- `end_date IS NULL OR end_date >= trip_date`

---

## Billing rules

A summary should only include trips:

- belonging to the same client
- inside the selected period
- not already linked to another summary

---

## Historical integrity

Closed summaries are immutable from a business perspective.

Historical billing must remain stable even if:

- rates change later
- trips are edited later
- client data changes later

---

# External API integration

A weather API may be used during trip creation.

Behavior:

- detect rain forecast
- optionally suggest surcharge
- user decides whether surcharge applies

Important:

External API results are advisory only.

The trip must persist the final decision.

Never depend on live weather data for historical reconstruction.

---

# Important domain principles

- Trips are operational events
- Summaries are billing snapshots
- Rates are temporal pricing rules
- Routes define habitual paths
- Calendar is a UI projection, not persistence