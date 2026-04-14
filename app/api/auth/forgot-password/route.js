import { NextResponse }        from 'next/server';
import crypto                  from 'crypto';
import { Resend }              from 'resend';
import { readData, writeData } from '@/lib/github-db';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 });

  const { data: profiles, sha } = await readData('profiles');
  const idx = profiles.findIndex(p => p.email?.toLowerCase() === email.trim().toLowerCase());

  // Always return success to avoid user enumeration
  if (idx === -1) return NextResponse.json({ ok: true });

  const token   = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + TOKEN_TTL_MS;

  profiles[idx].reset_token         = token;
  profiles[idx].reset_token_expires = expires;
  await writeData('profiles', profiles, sha);

  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const resetLink = `${siteUrl}/reset-password?token=${token}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from:    process.env.RESEND_FROM,
      to:      profiles[idx].email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#0f172a">Reset Your Password</h2>
          <p>Hi <strong>${profiles[idx].username}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
          <p style="margin:24px 0">
            <a href="${resetLink}" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
              Reset Password
            </a>
          </p>
          <p style="color:#64748b;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
          <p style="color:#94a3b8;font-size:12px">Or copy this link: ${resetLink}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send password reset email:', err);
    return NextResponse.json({ error: 'Failed to send email. Please try again later.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
