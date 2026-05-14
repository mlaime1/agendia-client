# Agendia

Agendia is a mobile-first application for tracking recurring trips, calculating period-based summaries, and sharing clear payment reports with clients.

## Why

Recurring transport arrangements are often managed with memory, chat messages, or informal notes.  
That makes it easy to lose track of completed trips, agreed prices, special surcharges, and monthly totals.

Agendia helps keep a clear historical record of trips and makes billing transparent.

## Core idea

The app combines two layers:

- **Daily operations** → register trips quickly from a calendar
- **Administrative closure** → generate summaries for weekly or monthly billing periods

## UX goal

The main interaction is inspired by the Wii Sports / Wii Fit calendar.

### Principles

- simple
- fast
- low friction
- mobile-first
- immediate visual feedback

### Calendar behavior

- each day can contain multiple trip stamps
- green car → outbound trip
- blue car → round trip
- special color → trip with stop / special route / exceptional trip

The calendar is a visual projection of trips.  
It is **not a database entity**.

## Domain model

### users
Driver / owner of the account.

### clients
Passengers or customers.

### routes
A recurring route associated with a client.

### route_stops
Ordered stops belonging to a route.

### rates
Defines agreed pricing for a route during a specific time period.

A rate contains:

- base price
- surcharge price
- start date
- end date

Rates are historical.  
A new price should create a new rate instead of modifying past data.

### trips
Represents an actual trip performed on a specific day.

A trip stores:

- trip date
- trip type
- final price
- applied surcharge
- special type
- notes

### summaries
A closed billing snapshot for a time period.

Summaries store:

- period start
- period end
- total trips
- total amount
- billing status

Trips included in a summary receive `summary_id`.

`total_amount` and `total_trips` are intentionally denormalized to preserve historical billing integrity.

## Summary lifecycle

draft → sent → paid → archived

## Product rules

- trips are daily operational records
- summaries are historical billing closures
- past billing should never change after being sent
- price changes create new rates
- a route may contain multiple ordered stops

## Initial stack

### Mobile
- React Native
- Expo
- TypeScript

### Backend
- Node.js
- Express
- PostgreSQL / Supabase

## First milestone

Build the calendar screen.

The first usable version should allow:

- render a monthly calendar
- tap a day
- register trips
- render stamps
- use local mocked data first