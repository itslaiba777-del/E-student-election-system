/**
 * Registration Status Email Template for Nodemailer
 * Branches conditionally between Approved (green) and Rejected (red) variants.
 * Strictly uses inline CSS and email-client-safe table layouts.
 */
function generateRegistrationStatusEmail(status, reason, studentName, regNo) {
  const isApproved = status === 'approved';
  const name = studentName || 'Student';
  const regNumber = regNo || '2024-QAU-123';
  const rejectionReason = reason || 'Mismatched department or institution credentials. Please re-upload your identity document.';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Voter Registration Status - Campus Vote</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f0; font-family: Arial, sans-serif; color: #2c2c2c;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f4f0; padding: 20px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #E4E1D5; box-shadow: 0 4px 12px rgba(27,94,32,0.05);">
          <!-- Top Accent Line -->
          <tr>
            <td style="height: 6px; background-color: ${isApproved ? '#1b5e20' : '#ba1a1a'}; width: 100%;"></td>
          </tr>

          <!-- Header Logo -->
          <tr>
            <td style="padding: 30px 40px 10px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size: 22px; font-weight: bold; color: #00450d;">
                    🗳️ Campus Vote
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 10px 40px 30px 40px;">
              <h1 style="font-size: 22px; font-weight: bold; color: #1b1c1a; margin-top: 10px; margin-bottom: 20px;">
                Voter Registration Status
              </h1>

              ${
                isApproved
                  ? `
              <!-- Approved Card Variant -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf9f5; border-radius: 12px; border: 1px solid #a0f399; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
                      <tr>
                        <td width="40" style="vertical-align: middle;">
                          <div style="width: 32px; height: 32px; background-color: #1b5e20; border-radius: 50%; color: #ffffff; font-size: 18px; font-weight: bold; text-align: center; line-height: 32px;">
                            ✔
                          </div>
                        </td>
                        <td style="font-size: 20px; font-weight: bold; color: #00450d; vertical-align: middle;">
                          Approved
                        </td>
                      </tr>
                    </table>
                    <p style="font-size: 14px; color: #1b1c1a; line-height: 1.5; margin: 0 0 16px 0;">
                      Hello <strong>${name}</strong>, your voter eligibility has been verified. You are cleared to participate in all upcoming institutional polls.
                    </p>
                    <div style="font-size: 11px; font-weight: bold; color: #00450d; letter-spacing: 0.1em; text-transform: uppercase;">
                      STATUS: ELIGIBLE TO VOTE
                    </div>
                  </td>
                </tr>
              </table>
              `
                  : `
              <!-- Rejected Card Variant -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffdad6; border-radius: 12px; border: 1px solid #ba1a1a; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
                      <tr>
                        <td width="40" style="vertical-align: middle;">
                          <div style="width: 32px; height: 32px; background-color: #ba1a1a; border-radius: 50%; color: #ffffff; font-size: 18px; font-weight: bold; text-align: center; line-height: 32px;">
                            ✕
                          </div>
                        </td>
                        <td style="font-size: 20px; font-weight: bold; color: #93000a; vertical-align: middle;">
                          Action Required
                        </td>
                      </tr>
                    </table>
                    <p style="font-size: 14px; color: #1b1c1a; line-height: 1.5; margin: 0 0 12px 0;">
                      Hello <strong>${name}</strong>, your voter registration application was not approved.
                    </p>
                    <div style="background-color: #ffffff; padding: 12px; border-radius: 6px; border-left: 4px solid #ba1a1a; margin-bottom: 12px;">
                      <div style="font-size: 12px; font-weight: bold; color: #93000a; margin-bottom: 4px;">Reason for Rejection:</div>
                      <div style="font-size: 13px; color: #41493e; line-height: 1.4;">${rejectionReason}</div>
                    </div>
                    <div style="font-size: 11px; font-weight: bold; color: #93000a; letter-spacing: 0.1em; text-transform: uppercase;">
                      STATUS: REJECTED
                    </div>
                  </td>
                </tr>
              </table>
              `
              }

              <!-- Account Info Summary -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #efeeea; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <div style="font-size: 12px; color: #717a6d;">Account Reg No: <strong>${regNumber}</strong></div>
                    <div style="font-size: 14px; font-weight: bold; color: #1b1c1a; margin-top: 2px;">${name}</div>
                  </td>
                </tr>
              </table>

              <!-- Footer Line -->
              <hr style="border: 0; border-top: 1px solid #c0c9bb; margin-bottom: 20px;" />
              <p style="font-size: 12px; color: #717a6d; margin: 0;">
                © 2026 Campus Vote System • Institutional Registrar Services
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

module.exports = { generateRegistrationStatusEmail };
