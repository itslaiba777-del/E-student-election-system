import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const INTERNAL_SECRET = 'campus_vote_secure_mail_2026_bridge';

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, subject, html, text, secret, emailUser, emailPass } = body;

    // Verify secret bridge token
    if (secret !== INTERNAL_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized email bridge request.' },
        { status: 401 }
      );
    }

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Recipient "to" and "subject" are required.' },
        { status: 400 }
      );
    }

    const senderUser = (emailUser || process.env.EMAIL_USER || 'itslaiba.777@gmail.com').trim();
    const senderPass = (emailPass || process.env.EMAIL_PASS || '').replace(/\s+/g, '');

    if (!senderUser || !senderPass) {
      return NextResponse.json(
        { error: 'Email credentials are missing.' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Port 465 requires secure: true on Vercel
      auth: {
        user: senderUser,
        pass: senderPass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    });

    const mailOptions = {
      from: `"Campus Vote" <${senderUser}>`,
      to,
      subject,
      text: text || '',
      html: html || text || '',
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[VERCEL MAIL SUCCESS] Sent to ${to}: ${info.messageId}`);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('[VERCEL MAIL ERROR]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch email from Vercel.' },
      { status: 500 }
    );
  }
}
