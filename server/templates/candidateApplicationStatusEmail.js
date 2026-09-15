/**
 * Candidate Application Status Email Template for Nodemailer
 * Branches conditionally between Approved (with assigned symbol) and Rejected (with reason).
 * Strictly uses inline CSS and email-client-safe table layouts.
 */
function generateCandidateStatusEmail(status, reason, symbolImageUrl, candidateName, positionName, symbolName) {
  const isApproved = status === 'approved';
  const name = candidateName || 'Candidate';
  const position = positionName || 'Student Body President';
  const symbol = symbolName || 'GOLDEN STAR';
  const rejectionReason = reason || 'The minimum cumulative GPA requirement or departmental residency criteria was not met.';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidate Application Outcome - Campus Vote</title>
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
                Candidate Application Outcome
              </h1>

              ${
                isApproved
                  ? `
              <!-- Approved Candidate Branch -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; font-weight: bold; color: #1b5e20; text-transform: uppercase; letter-spacing: 0.05em;">
                    -- APPROVED APPLICATION --
                  </td>
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf9f5; border-radius: 12px; border: 1px solid #c0c9bb; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="font-size: 14px; color: #1b1c1a; line-height: 1.6; margin: 0 0 16px 0;">
                      Congratulations <strong>${name}</strong>! Your application to run for <strong>${position}</strong> has been approved by the Electoral Commission.
                    </p>

                    <!-- Assigned Symbol Badge -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #a0f399; border-radius: 10px; padding: 14px; border: 1px solid #1b6d24;">
                      <tr>
                        <td align="center" style="font-size: 13px; font-weight: bold; color: #005312;">
                          ⭐ ASSIGNED ELECTION SYMBOL: ${symbol.toUpperCase()}
                        </td>
                      </tr>
                      ${
                        symbolImageUrl
                          ? `
                      <tr>
                        <td align="center" style="padding-top: 10px;">
                          <img src="${symbolImageUrl}" alt="${symbol}" width="80" height="80" style="border-radius: 8px; border: 2px solid #ffffff;" />
                        </td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>
              `
                  : `
              <!-- Rejected Candidate Branch -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; font-weight: bold; color: #ba1a1a; text-transform: uppercase; letter-spacing: 0.05em;">
                    -- REJECTED APPLICATION --
                  </td>
                </tr>
              </table>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f0; border-radius: 12px; border: 1px solid #c0c9bb; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="font-size: 14px; color: #1b1c1a; line-height: 1.6; margin: 0 0 16px 0;">
                      Hello <strong>${name}</strong>, we regret to inform you that your candidacy for the <strong>${position}</strong> position was not approved.
                    </p>

                    <div style="background-color: #ffffff; padding: 14px; border-radius: 8px; border-left: 4px solid #ba1a1a;">
                      <div style="font-size: 12px; font-weight: bold; color: #93000a; margin-bottom: 4px;">Reason for Rejection:</div>
                      <div style="font-size: 13px; color: #41493e; line-height: 1.4;">${rejectionReason}</div>
                    </div>
                  </td>
                </tr>
              </table>
              `
              }

              <p style="font-size: 12px; color: #717a6d; font-style: italic; margin-bottom: 24px;">
                For more details or to file an inquiry, please contact the Electoral Commission Help Desk at support@campusvote.edu
              </p>

              <!-- Footer Line -->
              <hr style="border: 0; border-top: 1px solid #c0c9bb; margin-bottom: 20px;" />
              <p style="font-size: 12px; color: #717a6d; margin: 0;">
                © 2026 Campus Vote Electoral Commission
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

module.exports = { generateCandidateStatusEmail };
