import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { captcha, jwt } from "better-auth/plugins";
import { Pool } from "pg";
import { sendEmail } from "./email";
import { emailOTP } from "better-auth/plugins";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: "-c search_path=public",
});

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      if (!user.email) return;
      void sendEmail({
        to: user.email,
        subject: "Reset your Impactis password",
        text: `You requested a password reset.\n\nClick the link below to reset your password:\n\n${url}\n\nIf you did not request this, you can safely ignore this email.`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
  },
  user: {
    modelName: "users",
    fields: {
      name: "name",
      image: "image",
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    additionalFields: {
      raw_user_meta_data: {
        type: "string",
        required: false,
      },
    },
  },
  session: {
    modelName: "sessions",
    // Default is 7 days. Uncomment to customize:
    // expiresIn: 60 * 60 * 24 * 7,   // 7 days (in seconds)
    // updateAge: 60 * 60 * 24,        // refresh expiry every 1 day when active
  },
  account: {
    modelName: "accounts",
  },
  database: pool,
  plugins: [
    nextCookies(),
    jwt(),
    // Only require Cloudflare Turnstile in production (or when ENABLE_CAPTCHA=1) so login/signup work when the widget doesn't load locally.
    ...(process.env.NODE_ENV === "production" || process.env.ENABLE_CAPTCHA === "1"
      ? [
          captcha({
            provider: "cloudflare-turnstile",
            secretKey: process.env.TURNSTILE_SECRET_KEY!,
          }),
        ]
      : []),
    emailOTP({
      // 10 minutes (in seconds)
      expiresIn: 10 * 60,
      async sendVerificationOTP({ email, otp, type }) {
        const purpose =
          type === "forget-password"
            ? "reset your password"
            : type === "sign-in"
              ? "sign in"
              : type === "change-email"
                ? "confirm your email change"
                : "verify your email";

        const subject = "Your Impactis Verification Code";
        const text = `Your Impactis verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`;
        const html = `
          <div style="background:#f6f7f9;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
            <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
              <div style="padding:20px 22px;background:#0B3D2E;color:#ffffff;">
                <div style="font-size:18px;font-weight:800;letter-spacing:-0.02em;">Impactis</div>
                <div style="opacity:0.9;margin-top:4px;font-size:13px;">Verification code</div>
              </div>
              <div style="padding:22px;">
                <p style="margin:0 0 12px 0;font-size:14px;color:#111827;">
                  Use this 6-digit code to ${purpose}.
                </p>
                <div style="margin:16px 0;padding:14px 16px;border:1px solid #e5e7eb;border-radius:12px;text-align:center;">
                  <div style="font-size:28px;letter-spacing:0.35em;font-weight:900;color:#0B3D2E;">${otp}</div>
                </div>
                <p style="margin:12px 0 0 0;font-size:13px;color:#4b5563;">
                  This code expires in <strong>10 minutes</strong>.
                </p>
                <p style="margin:10px 0 0 0;font-size:12px;color:#6b7280;">
                  If you didn’t request this, you can safely ignore this email.
                </p>
              </div>
              <div style="padding:14px 22px;background:#fafafa;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
                Sent to ${email}
              </div>
            </div>
          </div>
        `;

        void sendEmail({
          to: email,
          subject,
          text,
          html,
        });
      },
      sendVerificationOnSignUp: true,
    }),
  ],
  advanced: {
    database: {
      generateId: (options) => {
        if (options.model === "user") {
          return crypto.randomUUID();
        }
        return crypto.randomUUID();
      },
    },
  },
  // databaseHooks removed because BetterAuth native fields mapping handles it.
});

