https://invoice-tt.vercel.app/

https://invoice-o5jp4l45x-dev-vibes.vercel.app/

## Manual SMS Invoice Workflow

Twilio is no longer required. The application **does not automatically send SMS**.

Instead, the "Text Invoice" button (available on the invoice form after a successful
receipt, and on the Recent Receipts / History lists) prepares the invoice text and
hands it off to the shop employee's own phone:

1. The app prepares the invoice message and shows it in an editable preview.
2. Clicking **Open Messages** copies the complete message to the clipboard and opens
   the device's Messages app with the customer's phone number filled in.
3. The employee pastes or reviews the message inside Messages.
4. The employee personally presses **Send**.

The message is sent from the employee's own cellphone number and carrier plan - not
from any shop-owned SMS number or third-party provider. Because of this:

- No Twilio account, API key, Messaging Service SID, or A2P 10DLC registration is needed.
- The application cannot confirm whether the text was actually sent or delivered -
  it only opens Messages. Nothing in the app is marked "Sent" automatically because
  of this step.
- A public invoice link is only included in the message when one safely exists. This
  project currently has no individual public invoice-detail route, so the message
  sends an invoice summary (customer name, invoice number, total, date) instead of a
  link. Adding a public per-invoice route would be required before links could be
  included.

If clipboard access isn't available, the message stays visible in the modal so it can
be copied manually, and "Open Messages" and "Copy Message" remain usable. A "Share
Invoice" button (using the Web Share API) is also available on devices/browsers that
support it, as an alternative way to hand the message to Messages, Mail, or another app.
