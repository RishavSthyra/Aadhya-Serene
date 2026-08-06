# Lead Date Range Filter

## Behaviour

The Leads view provides a date-range filter with start and end calendar inputs. Applying the range reloads leads submitted during those India-calendar dates, inclusive.

## Export

The CSV export passes the same start and end dates to the server. Exported rows therefore match the filtered lead dataset, while existing source restrictions remain in force.

## Validation

The server accepts only `YYYY-MM-DD`, rejects an end date before its start date, and converts the selected India dates to MongoDB `createdAt` boundaries.
