/**
 * Vote Confirmation Email Template for Nodemailer
 * Strictly uses inline CSS and email-client-safe table layouts.
 */
function generateVoteConfirmationEmail(electionName, receiptId) {
  const displayElection = electionName || 'Student Government General Election';
  const displayReceipt = receiptId || 'CV-2026-8F22-409B-BD58';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vote Confirmation - Campus Vote</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f0; font-family: Arial, sans-serif; color: #2c2c2c;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f4f0; padding: 20px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #E4E1D5; box-shadow: 0 4px 12px rgba(27,94,32,0.05);">
          <!-- Top Green Accent Line -->
          <tr>
            <td style="height: 6px; background-color: #1b5e20; width: 100%;"></td>
          </tr>

          <!-- Header Logo & Confirmed Badge -->
          <tr>
            <td style="padding: 30px 40px 10px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size: 22px; font-weight: bold; color: #00450d;">
                    🗳️ Campus Vote
                  </td>
                  <td align="right">
                    <span style="background-color: #a0f399; color: #005312; font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">
                      CONFIRMED
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 10px 40px 30px 40px; text-align: center;">
              <!-- Green Checkmark Container -->
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 20px auto 16px auto;">
                <tr>
                  <td align="center" justify="center" style="width: 64px; height: 64px; background-color: #a0f399; border-radius: 50%; color: #00450d; font-size: 32px; font-weight: bold; line-height: 64px;">
                    ✔
                  </td>
                </tr>
              </table>

              <h1 style="font-size: 22px; font-weight: bold; color: #1b1c1a; margin-top: 10px; margin-bottom: 8px;">Your vote has been recorded</h1>
              <p style="font-size: 14px; color: #41493e; margin-bottom: 24px;">
                Election: <strong>${displayElection}</strong>
              </p>

              <!-- Anonymity Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf9f5; border-radius: 12px; border: 1px solid #c0c9bb; text-align: left; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="font-size: 15px; font-weight: bold; color: #00450d; margin: 0 0 6px 0;">🔒 Anonymity Guaranteed</h3>
                    <p style="font-size: 13px; color: #41493e; line-height: 1.5; margin: 0 0 14px 0;">
                      Your specific selections have been encrypted and decoupled from your identity. The system only records that you have participated, ensuring your vote remains completely private.
                    </p>
                    <div style="font-size: 12px; font-family: monospace; background-color: #e9e8e4; color: #41493e; padding: 10px; border-radius: 6px; border: 1px solid #c0c9bb;">
                      Receipt ID: ${displayReceipt}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #41493e; line-height: 1.6; text-align: left; margin-bottom: 24px;">
                Thank you for participating in the democratic process of our campus community. The results will be published on the portal once the counting period concludes.
              </p>

              <!-- Footer Line -->
              <hr style="border: 0; border-top: 1px solid #c0c9bb; margin-bottom: 20px;" />
              <p style="font-size: 12px; color: #717a6d; margin: 0; text-align: center;">
                This is an automated receipt. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

module.exports = { generateVoteConfirmationEmail };
