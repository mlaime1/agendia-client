# Agendia UX Notes

## Product direction

Agendia is a mobile-first app for quickly registering recurring trips and generating clear billing summaries.

The UX should feel:

- simple
- lightweight
- fast
- tactile
- low friction

The main inspiration is the Wii Sports / Wii Fit calendar interaction.

The goal is not to build an administrative dashboard.

The goal is to make daily trip registration feel immediate and natural.

---

## Calendar philosophy

The calendar is the primary interaction surface.

The calendar is not a database entity.

It is a visual projection of trips grouped by date.

Each cell should summarize information, not expose all details.

---

## Calendar cell structure

Each calendar day should contain:

### Top-left
Day number.

### Center
Trip stamps.

### Bottom
Overflow indicator if needed.

Example:

```text
┌────────────┐
│ 12         │
│ 🚗 🚙 ●    │
│ +1         │
└────────────┘

## Calendar cell rules
- show up to 3 trip stamps
- if there are more than 3 trips, show +N
- keep visual density low
- prioritize readability over data density
- avoid clutter
- do not display full trip details inside the cell

## Trip stamps

Trip stamps represent recorded trips.

### Outbound trip
- green car
### Round trip
- blue car
### Special trip
### special color

Special trips may include:

- extra stop
- route deviation
- exceptional trip

# Calendar Specifications

## Day States

### Normal Day
* Neutral background.

### Day with Trips
* Only stamps are visible.

### Selected Day
* Soft border or subtle highlight.

### Current Day
* Small visual accent.

> **Note:** Do not make selected or current states visually heavy.

---

## Quick Action Bar
A quick action bar should be displayed above the calendar.

### Available Modes:
* **Outbound**
* **Round Trip**
* **Special**

The selected mode remains active until changed. The quick action bar exists to reduce friction during repeated daily usage.

---

## Interaction Model

### Normal Tap
Creates a trip immediately using the currently selected mode.

### Special Mode
Selecting a day opens a modal. The modal may allow:
* Trip type
* Optional note

**After confirmation:**
1. Update local state immediately.
2. Render stamp immediately.

### Long Press
Open day details. This may be used later for:
* Edit
* Delete
* Undo
* Inspect trips for that day

---

## Interaction Principles
* Immediate feedback.
* Minimal steps.
* Direct manipulation.
* **Common actions** should not require modal confirmation.
* **Exceptional actions** may use modal interaction.

---

## First Version Scope
The first goal is validating calendar feel and interaction quality.

### Included Features:
* Monthly calendar rendering.
* Day cells.
* Quick action bar.
* Mocked local data.
* Local state updates.
* Trip stamps rendering.

### Excluded (For Now):
* Backend integration.
* Auth.
* Summaries.
* Weather API.
* Billing flow.