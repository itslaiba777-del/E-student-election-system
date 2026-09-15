/**
 * OTP Verification Email Template for Nodemailer
 * Strictly uses inline CSS and email-client-safe table layouts.
 */
function generateOtpEmail(otpCode) {
  const formattedCode = otpCode ? otpCode.toString().replace(/(\d{3})(\d{3})/, '$1 $2') : '123 456';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campus Vote OTP Verification</title>
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
              <h1 style="font-size: 24px; font-weight: bold; color: #1b1c1a; margin-top: 10px; margin-bottom: 12px;">Verify your identity</h1>
              <p style="font-size: 14px; color: #41493e; line-height: 1.6; margin-bottom: 24px;">
                Please use the verification code below to sign in to the Campus Vote portal. This code is required to ensure secure and authentic participation in the upcoming elections.
              </p>

              <!-- OTP Display Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f0; border-radius: 12px; border: 1px solid #c0c9bb; margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding: 24px;">
                    <div style="font-size: 38px; font-weight: 900; letter-spacing: 0.25em; color: #00450d; margin-bottom: 6px;">
                      ${formattedCode}
                    </div>
                    <div style="font-size: 12px; font-weight: bold; color: #717a6d; text-transform: uppercase; letter-spacing: 0.05em;">
                      Verification Code
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffdad6; border-radius: 8px; border: 1px solid #ba1a1a; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px; font-size: 13px; color: #93000a; font-weight: bold; line-height: 1.4;">
                    ⏰ This code will expire in 5 minutes. Do not share this code with anyone. If you did not request this, please ignore this email.
                  </td>
                </tr>
              </table>

              <!-- Footer Line -->
              <hr style="border: 0; border-top: 1px solid #c0c9bb; margin-bottom: 20px;" />
              <p style="font-size: 12px; color: #717a6d; margin: 0;">
                © 2026 Campus Vote System • Secure Student Governance Portal
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

module.exports = { generateOtpEmail };
