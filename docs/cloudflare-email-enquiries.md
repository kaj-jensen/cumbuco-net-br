# Cloudflare email enquiry setup

The website sends form enquiries through the Worker `EMAIL` binding. It does not require a mailbox at `cumbuco.net`. Because the binding sends only to one verified destination address, it can use Cloudflare's free verified-destination exception on Workers Free.

## Required Cloudflare configuration

1. Use `cumbucorentals@outlook.com` as the enquiry destination.
2. In **Email Service → Email Routing → Destination Addresses**, add `cumbucorentals@outlook.com` and complete the verification email sent to it.
3. Preserve the two confirmed addresses: `info@cumbuco.net` and `enquiries@cumbuco.net`. No other `@cumbuco.net` addresses are currently in use.
4. In **Email Service → Email Routing**, onboard `cumbuco.net`. This replaces the SiteGround MX records. Create forwarding rules for both confirmed addresses and route them to `cumbucorentals@outlook.com`.
5. In **Turnstile**, create a managed widget named `Cumbuco Rentals enquiries` and restrict it to:
   - `www.cumbuco.net`
   - `cumbuco-net.kaj-jensen-d29.workers.dev` for preview testing, if desired
6. In the `cumbuco-net` Worker settings, add:
   - Variable `ENQUIRY_TO`: `cumbucorentals@outlook.com`
   - Secret `TURNSTILE_SECRET_KEY`: the Turnstile widget secret
7. In the Git-connected build settings, add:
   - Build variable `PUBLIC_TURNSTILE_SITE_KEY`: the Turnstile public site key
8. Deploy again after all three values are configured.

The repository already declares the `EMAIL` binding and restricts it to sender `enquiries@cumbuco.net` and the single destination `cumbucorentals@outlook.com`. Sending to that verified account-level destination is free on Workers Free, including when only Email Routing is configured.

## Verification

1. Open a property page and select valid current-year dates.
2. Send a test enquiry using an email address you control.
3. Confirm that the Outlook mailbox receives it.
4. Reply to the message and confirm that the reply is addressed to the traveller's email.
5. Check **Email Service → Email logs** for the successful delivery.
6. Check **Turnstile → Analytics** for a successful server-side validation.

Keep WhatsApp enabled as the fallback. Workers Paid is only needed later if the application must send to arbitrary, unverified recipients—for example automatic confirmation emails sent back to travellers.
