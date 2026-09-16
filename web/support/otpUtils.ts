/** One-time-password helpers used by the web MFA scenarios. */
import * as OTPAuth from 'otpauth';

/** Generates the current six-digit TOTP for an MFA secret. */
export function generateOTP(secret: string): string {
  const totp = new OTPAuth.TOTP({
    secret: secret,
    digits: 6,
    period: 30,
  });
  return totp.generate();
}

/** Generates a deliberately invalid OTP for negative MFA scenarios. */
export function InvalidOTP(secret: string): string {
  const totp = new OTPAuth.TOTP({
    secret: secret,
    digits: 6,
    period: 30,
  });
  const code = totp.generate();
  return (parseInt(code) + 1).toString(); // Increment the code by 1 to make it invalid
}