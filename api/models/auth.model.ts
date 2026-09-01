export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginUser {
  userId: string;
  username: string;
  customerId: string;
}

export interface LoginResponse {
  data: Record<string, string | number | boolean>;
  fileName: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  user: LoginUser;
  message: string;
  code: string;
}

export interface MfaChallengeResponse {
  challengeId: string;
  challengeToken: string;
  expiresIn: number;
  expiresAt: string;
  attemptsRemaining: number;
}

export interface MfaVerifyRequest {
  challengeId: string;
  challengeToken: string;
  code: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  attemptsRemaining?: number;
}
