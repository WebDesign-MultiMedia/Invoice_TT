"use server";

function buildReceiptEmailHtml({
  clientName,
  carDetails,
  jobDetails,
  totalAmount,
  paymentMethod,
  id,
  dateCreated,
}) {
  const formattedDate = new Date(dateCreated).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; padding: 24px 0; margin: 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <tr>
        <td style="background-color: #0f172a; padding: 20px 24px;">
          <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700;">Your Auto Shop Receipt</p>
          <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Receipt #${id}</p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #16a34a; padding: 16px 24px; text-align: center;">
          <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 800; letter-spacing: 0.5px;">
            TRANSACTION STATUS: PAID VIA ${paymentMethod.toUpperCase()}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px;">
          <p style="margin: 0 0 16px; color: #334155; font-size: 15px;">Hi ${clientName}, thank you for your visit! Here is a summary of your service:</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; color: #334155;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Vehicle</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${carDetails}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Service Performed</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${jobDetails}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Payment Method</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Date</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0 0; color: #0f172a; font-size: 16px; font-weight: 800;">Total Paid</td>
              <td style="padding: 12px 0 0; text-align: right; color: #16a34a; font-size: 20px; font-weight: 800;">$${totalAmount}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="background-color: #f8fafc; padding: 16px 24px; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">Thank you for choosing our shop. This receipt confirms your balance is fully paid.</p>
        </td>
      </tr>
    </table>
  </div>
  `;
}

export async function processReceiptAndNotify(receiptData) {
  try {
    const {
      clientName,
      clientPhone,
      clientEmail,
      carDetails,
      jobDetails,
      totalAmount,
      paymentMethod,
    } = receiptData;

    const id = `RCT-${Date.now()}`;
    const dateCreated = new Date().toISOString();

    // --- Step A: Bookkeeping (SheetDB) ---
    // Logging is the source of truth for accounting, so a failure here halts
    // the entire flow before any customer communication is sent.
    const sheetResponse = await fetch(process.env.SHEETDB_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            id,
            clientName,
            clientPhone,
            clientEmail,
            carDetails,
            jobDetails,
            totalAmount,
            paymentMethod,
            paymentStatus: "PAID",
            dateCreated,
          },
        ],
      }),
    });

    if (!sheetResponse.ok) {
      const errorText = await sheetResponse.text();
      throw new Error(`SheetDB logging failed (${sheetResponse.status}): ${errorText}`);
    }

    // --- Step B: Email Dispatch (Resend) ---
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Receipts <receipts@buffetluciasfiestamexicana.com>",
        to: clientEmail,
        subject: `Paid Receipt - ${carDetails}`,
        html: buildReceiptEmailHtml({
          clientName,
          carDetails,
          jobDetails,
          totalAmount,
          paymentMethod,
          id,
          dateCreated,
        }),
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Email dispatch failed (${emailResponse.status}): ${errorText}`);
    }

    // --- Step C: SMS Dispatch (Twilio) ---
    // Temporarily disabled while the Twilio sending number is being set up.
    // Set to true once TWILIO_PHONE_NUMBER is a verified, owned number.
    const SMS_ENABLED = false;

    if (SMS_ENABLED) {
      const smsBody =
        `Receipt Confirmation: Your ${carDetails} is ready. Total Paid: $${totalAmount} ` +
        `via ${paymentMethod} for ${jobDetails}. Thank you for choosing our shop!`;

      const twilioAuth = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString("base64");

      const smsResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${twilioAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: clientPhone,
            From: process.env.TWILIO_PHONE_NUMBER,
            Body: smsBody,
          }).toString(),
        }
      );

      if (!smsResponse.ok) {
        const errorText = await smsResponse.text();
        throw new Error(`SMS dispatch failed (${smsResponse.status}): ${errorText}`);
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
