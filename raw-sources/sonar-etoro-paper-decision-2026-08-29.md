# Sonar AI, eToro, and paper-trading decision

- Source type: user direction in project chat
- Captured: 2026-08-29

## User direction

- Continue with the original Sonar AI autonomous hedge-fund concept.
- Connect the project to eToro.
- Use paper money only.
- Remove the temporary alternate-track additions from the maintained wiki.
- Keep the repository context focused on Sonar AI for partners cloning the project.
- Event message supplied by the user: `Build whatever you want, you might just leave with the MVP from your next startup and some cool prizes!`

## Product boundary

The eToro connection is read-only for market data or reference data unless an official paper-trading interface is verified. Sonar AI simulates orders internally. It must not submit real-money orders, transfer funds, or manage a user's brokerage account.

## Unverified points

- Which official eToro interface, if any, the team can access during the event.
- Whether eToro exposes market data, virtual-portfolio data, or a paper-order API suitable for the demo.
- Authentication, rate limits, response schemas, instruments, and redistribution rules.

These points require official documentation or a sanitized test fixture before implementation claims are made.
