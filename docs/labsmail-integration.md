# LabsMail Lead Export Guide (CrabKhai Admin)

This guide explains how CrabKhai admins can export customer leads to LabsMail, then use LabsMail campaigns to manage and follow up with those leads.

## What this integration does

- Exports CrabKhai customers as leads to LabsMail.
- Updates existing LabsMail leads when the email matches.
- Sends lead details like name, email, phone, status, value, and notes.

## Requirements

- Access to CrabKhai admin dashboard.
- A LabsMail lead ingestion key created in LabsMail admin.
- The base URL for your LabsMail instance (example: `https://labsmail.yourdomain.com`).

## Connect CrabKhai to LabsMail

1. Open CrabKhai admin.
2. Go to **Leads → LabsMail**.
3. Enter:
   - Base URL (your LabsMail domain)
   - Lead Ingestion Key (from LabsMail admin)
4. Enable **LabsMail export**.
5. Click **Save Settings**.

## Export leads from CrabKhai

1. Go to **Leads → LabsMail**.
2. Choose an export range:
   - All time
   - Last 7 days
   - Last 30 days
   - Last 90 days
3. Click **Export to LabsMail**.

You will see a success message with counts for created, updated, and skipped leads.

## How lead data is mapped

- `name`: customer name
- `email`: customer email
- `phone`: customer phone
- `source`: `crabkhai`
- `status`:
  - `qualified` if the customer has at least one order
  - `new` if no orders yet
- `value`: total spent in CrabKhai (if any)
- `notes`: order count and total spend summary

## Use LabsMail to manage leads and campaigns

1. Log in to your LabsMail admin dashboard.
2. Go to **Leads** to review new entries from CrabKhai.
3. Segment leads by status (`new`, `qualified`, etc.).
4. Create a campaign and select the lead segment you want to target.
5. Track engagement and update lead status as they respond.

## Tips and troubleshooting

- If export is disabled, check that **LabsMail export** is enabled and the key is present.
- If export fails, confirm the base URL and lead key are correct in LabsMail.
- If no leads appear, make sure CrabKhai has customer records to export.
- Keep your LabsMail lead key private and rotate it if compromised.

## FAQ

**Do exports overwrite existing leads?**
LabsMail updates existing leads when the email already exists.

**Can I re-export the same leads?**
Yes. Re-exports update existing lead details and notes.
