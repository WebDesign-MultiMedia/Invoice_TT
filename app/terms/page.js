export const metadata = {
  title: "Terms and Conditions",
};

export default function TermsAndConditions() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-slate-800">
      <h1 className="mb-6 text-2xl font-bold">Terms and Conditions</h1>
      <p className="mb-4 text-sm text-slate-500">Last updated: July 2026</p>

      <h2 className="mb-2 mt-6 text-lg font-semibold">Program Name</h2>
      <p className="mb-4">[Shop Name] Receipt Notifications</p>

      <h2 className="mb-2 mt-6 text-lg font-semibold">Program Description</h2>
      <p className="mb-4">
        This program sends a one-time paid receipt confirmation by text message to customers
        immediately after they complete payment (cash or Zelle) for an auto repair or
        maintenance service at [Shop Name]. Messages include a summary of the vehicle, the
        service performed, and the total amount paid. This is a transactional program only —
        no marketing or promotional messages are sent.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-semibold">Message Frequency</h2>
      <p className="mb-4">
        You will receive one text message per completed and paid transaction. Message frequency
        varies based on how often you use our services.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-semibold">Message and Data Rates</h2>
      <p className="mb-4">Message and data rates may apply, depending on your mobile carrier plan.</p>

      <h2 className="mb-2 mt-6 text-lg font-semibold">Opt-Out and Help</h2>
      <p className="mb-4">
        Reply <strong>STOP</strong> at any time to opt out of future text messages. Reply{" "}
        <strong>HELP</strong> for assistance. After opting out, you will no longer receive text
        receipt confirmations, though you may still request a receipt by email.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-semibold">Support Contact</h2>
      <p className="mb-4">
        For support or questions about this program, contact us at [Support Email] or
        [Support Phone].
      </p>

      <h2 className="mb-2 mt-6 text-lg font-semibold">Changes to These Terms</h2>
      <p className="mb-4">
        We may update these terms from time to time. Continued use of our services after changes
        are posted constitutes acceptance of the updated terms.
      </p>
    </main>
  );
}
