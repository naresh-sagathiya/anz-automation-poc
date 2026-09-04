import * as OTPAuth from 'otpauth';

export function generateOTP(secret: string): string {
  const totp = new OTPAuth.TOTP({
    secret: secret,
    digits: 6,
    period: 30,
  });
  return totp.generate();
}

export function generateExpiredOTP(secret: string): string {
  const totp = new OTPAuth.TOTP({
    secret: secret,
    digits: 6,
    period: 30,
  });
  return totp.generate();
}
  
export function InvalidOTP(secret: string): string {
  const totp = new OTPAuth.TOTP({
    secret: secret,
    digits: 6,
    period: 30,
  });
  const code = totp.generate();
  return (parseInt(code) + 1).toString(); // Increment the code by 1 to make it invalid
}