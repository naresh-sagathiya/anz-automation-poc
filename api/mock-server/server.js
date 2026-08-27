const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 4010);
const JWT_SECRET = process.env.JWT_SECRET || "anz-poc-secret-change-me";
const ACCESS_TOKEN_SECONDS = Number(process.env.ACCESS_TOKEN_SECONDS || 5);
const REFRESH_TOKEN_SECONDS = Number(process.env.REFRESH_TOKEN_SECONDS || 900);
const MFA_SECONDS = Number(process.env.MFA_SECONDS || 120);
const MFA_MAX_ATTEMPTS = 3;
const VALID_MFA_CODE = process.env.MFA_CODE || "123456";

const users = new Map([
  ["alice", {
    userId: "USER-001",
    username: "alice",
    password: "Password123!",
    customerId: "CUST-001"
  }],
  ["bob", {
    userId: "USER-002",
    username: "bob",
    password: "Password123!",
    customerId: "CUST-002"
  }]
]);

const customers = new Map([
  ["CUST-001", {
    customerId: "CUST-001",
    firstName: "Alice",
    lastName: "Smith",
    email: "alice@example.com"
  }],
  ["CUST-002", {
    customerId: "CUST-002",
    firstName: "Bob",
    lastName: "Jones",
    email: "bob@example.com"
  }]
]);

const accounts = new Map([
  ["CUST-001", [{
    accountId: "ACC-001",
    customerId: "CUST-001",
    accountType: "SAVINGS",
    currency: "AUD",
    balance: 5000.00
  }]],
  ["CUST-002", [{
    accountId: "ACC-002",
    customerId: "CUST-002",
    accountType: "CHECKING",
    currency: "AUD",
    balance: 7500.00
  }]]
]);

const refreshTokens = new Map(); // token -> { userId, expiresAt, revoked }
const revokedAccessTokens = new Set();
const mfaChallenges = new Map();

function nowMs() {
  return Date.now();
}

function iso(ms) {
  return new Date(ms).toISOString();
}

function error(res, status, code, message, extra = {}) {
  return res.status(status).json({ code, message, ...extra });
}

function createAccessToken(user) {
  const token = jwt.sign(
    {
      sub: user.userId,
      username: user.username,
      customerId: user.customerId,
      scope: "banking:read banking:write"
    },
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: ACCESS_TOKEN_SECONDS,
      issuer: "anz-banking-mock",
      audience: "anz-api"
    }
  );
  return token;
}

function createRefreshToken(user) {
  const token = `rt_${crypto.randomBytes(32).toString("hex")}`;
  refreshTokens.set(token, {
    userId: user.userId,
    customerId: user.customerId,
    expiresAt: nowMs() + REFRESH_TOKEN_SECONDS * 1000,
    revoked: false
  });
  return token;
}

function publicUser(user) {
  return {
    userId: user.userId,
    username: user.username
  };
}

function authenticate(req, res, next) {
  const header = req.get("authorization");

  if (!header || !header.startsWith("Bearer ")) {
    return error(res, 401, "TOKEN_MISSING", "Access token is required");
  }

  const token = header.substring("Bearer ".length).trim();

  if (!token) {
    return error(res, 401, "TOKEN_INVALID", "Access token is invalid");
  }

  if (revokedAccessTokens.has(token)) {
    return error(res, 401, "TOKEN_REVOKED", "Access token has been revoked");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "anz-banking-mock",
      audience: "anz-api"
    });

    req.auth = { token, payload };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return error(res, 401, "TOKEN_EXPIRED", "Access token has expired");
    }

    return error(res, 401, "TOKEN_INVALID", "Access token is malformed or invalid");
  }
}

function authorizeCustomer(req, res, next) {
  const requestedCustomerId = req.params.customerId;
  const authenticatedCustomerId = req.auth.payload.customerId;

  if (requestedCustomerId !== authenticatedCustomerId) {
    return error(
      res,
      403,
      "ACCESS_DENIED",
      "You are not authorized to access this customer"
    );
  }

  next();
}

app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "anz-banking-mock",
    timestamp: new Date().toISOString()
  });
});

// A1: login and token issue
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return error(res, 400, "INVALID_REQUEST", "username and password are required");
  }

  const user = users.get(username);

  if (!user || user.password !== password) {
    return error(res, 401, "AUTH_INVALID_CREDENTIALS", "Invalid username or password");
  }

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  const decoded = jwt.decode(accessToken);

  return res.status(200).json({
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_TOKEN_SECONDS,
    expiresAt: iso(decoded.exp * 1000),
    user: publicUser(user)
  });
});

// A2: create MFA challenge
app.post("/auth/mfa/challenge", authenticate, (req, res) => {
  const challengeId = `CH-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
  const challengeToken = `mfa_${crypto.randomBytes(24).toString("hex")}`;
  const expiresAt = nowMs() + MFA_SECONDS * 1000;

  mfaChallenges.set(challengeId, {
    challengeToken,
    userId: req.auth.payload.sub,
    expiresAt,
    attemptsRemaining: MFA_MAX_ATTEMPTS,
    used: false,
    locked: false
  });

  return res.status(201).json({
    challengeId,
    challengeToken,
    expiresIn: MFA_SECONDS,
    expiresAt: iso(expiresAt),
    attemptsRemaining: MFA_MAX_ATTEMPTS
  });
});

// A2: verify MFA challenge
app.post("/auth/mfa/verify", authenticate, (req, res) => {
  const { challengeId, challengeToken, code } = req.body || {};
  const challenge = mfaChallenges.get(challengeId);

  if (!challenge) {
    return error(res, 401, "MFA_CHALLENGE_NOT_FOUND", "MFA challenge was not found", {
      attemptsRemaining: 0
    });
  }

  if (challenge.userId !== req.auth.payload.sub) {
    return error(res, 403, "MFA_ACCESS_DENIED", "Challenge belongs to another user");
  }

  if (challenge.used) {
    return error(res, 401, "MFA_CHALLENGE_ALREADY_USED", "MFA challenge has already been used", {
      attemptsRemaining: 0
    });
  }

  if (challenge.locked) {
    return error(res, 403, "MFA_CHALLENGE_LOCKED", "MFA challenge is locked", {
      attemptsRemaining: 0
    });
  }

  if (nowMs() >= challenge.expiresAt) {
    challenge.attemptsRemaining = 0;
    return error(res, 401, "MFA_CHALLENGE_EXPIRED", "MFA challenge has expired", {
      attemptsRemaining: 0
    });
  }

  if (challenge.challengeToken !== challengeToken) {
    challenge.attemptsRemaining = Math.max(0, challenge.attemptsRemaining - 1);

    if (challenge.attemptsRemaining === 0) {
      challenge.locked = true;
      return error(res, 403, "MFA_CHALLENGE_LOCKED", "MFA challenge is locked", {
        attemptsRemaining: 0
      });
    }

    return error(res, 401, "MFA_INVALID_CODE", "Invalid MFA challenge token", {
      attemptsRemaining: challenge.attemptsRemaining
    });
  }

  if (code !== VALID_MFA_CODE) {
    challenge.attemptsRemaining = Math.max(0, challenge.attemptsRemaining - 1);

    if (challenge.attemptsRemaining === 0) {
      challenge.locked = true;
      return error(res, 403, "MFA_CHALLENGE_LOCKED", "MFA challenge is locked", {
        attemptsRemaining: 0
      });
    }

    return error(res, 401, "MFA_INVALID_CODE", "Invalid MFA code", {
      attemptsRemaining: challenge.attemptsRemaining
    });
  }

  challenge.used = true;

  return res.status(200).json({
    verified: true,
    message: "MFA verification successful"
  });
});

// A3: refresh
app.post("/auth/token/refresh", (req, res) => {
  const { refreshToken } = req.body || {};
  const record = refreshTokens.get(refreshToken);

  if (!record) {
    return error(res, 401, "REFRESH_TOKEN_INVALID", "Refresh token is invalid");
  }

  if (record.revoked) {
    return error(res, 401, "REFRESH_TOKEN_REVOKED", "Refresh token has been revoked");
  }

  if (nowMs() >= record.expiresAt) {
    return error(res, 401, "REFRESH_TOKEN_EXPIRED", "Refresh token has expired");
  }

  const user = [...users.values()].find(u => u.userId === record.userId);

  if (!user) {
    return error(res, 401, "REFRESH_TOKEN_INVALID", "Refresh token is invalid");
  }

  // Rotation: old refresh token becomes unusable.
  record.revoked = true;

  const accessToken = createAccessToken(user);
  const newRefreshToken = createRefreshToken(user);
  const decoded = jwt.decode(accessToken);

  return res.status(200).json({
    accessToken,
    refreshToken: newRefreshToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_TOKEN_SECONDS,
    expiresAt: iso(decoded.exp * 1000)
  });
});

// A3: revoke
app.post("/auth/token/revoke", authenticate, (req, res) => {
  const { token } = req.body || {};

  if (!token) {
    return error(res, 400, "INVALID_REQUEST", "token is required");
  }

  revokedAccessTokens.add(token);

  // Revoke associated refresh token(s) if the access token belongs to a user.
  try {
    const payload = jwt.decode(token);
    if (payload?.sub) {
      for (const record of refreshTokens.values()) {
        if (record.userId === payload.sub) {
          record.revoked = true;
        }
      }
    }
  } catch (_) {
    // The token is simply treated as revoked.
  }

  return res.status(200).json({
    revoked: true,
    message: "Token revoked successfully"
  });
});

// A4: customer
app.get("/customers/:customerId", authenticate, authorizeCustomer, (req, res) => {
  console.log(">>>>>req.params.customerId", req.params.customerId);
  const customer = customers.get(req.params.customerId);

  if (!customer) {
    return error(res, 404, "CUSTOMER_NOT_FOUND", "Customer was not found");
  }

  return res.status(200).json(customer);
});

// A4: accounts
app.get(
  "/customers/:customerId/accounts",
  authenticate,
  authorizeCustomer,
  (req, res) => {
    const customerAccounts = accounts.get(req.params.customerId);

    if (!customerAccounts) {
      return error(res, 404, "CUSTOMER_NOT_FOUND", "Customer was not found");
    }

    return res.status(200).json(customerAccounts);
  }
);

// Protected payment
app.post("/payments", authenticate, (req, res) => {
  const { fromAccountId, toAccountId, amount, currency, reference } = req.body || {};

  if (!fromAccountId || !toAccountId || !amount || !currency) {
    return error(
      res,
      400,
      "INVALID_PAYMENT",
      "fromAccountId, toAccountId, amount and currency are required"
    );
  }

  return res.status(201).json({
    paymentId: `PAY-${crypto.randomBytes(5).toString("hex").toUpperCase()}`,
    status: "COMPLETED",
    amount,
    currency,
    reference: reference || ""
  });
});

app.use((req, res) => {
  return error(res, 404, "NOT_FOUND", `Route ${req.method} ${req.path} was not found`);
});

app.listen(PORT, () => {
  console.log("");
  console.log("==============================================");
  console.log(" ANZ Banking Mock API");
  console.log("==============================================");
  console.log(` Base URL: http://localhost:${PORT}`);
  console.log(` Health:   http://localhost:${PORT}/health`);
  console.log(` Swagger:  Use banking-api.yml with Prism`);
  console.log("");
  console.log(" Test users:");
  console.log("   alice / Password123! / CUST-001");
  console.log("   bob   / Password123! / CUST-002");
  console.log("");
  console.log(` Access token lifetime:  ${ACCESS_TOKEN_SECONDS}s`);
  console.log(` Refresh token lifetime: ${REFRESH_TOKEN_SECONDS}s`);
  console.log(` MFA challenge lifetime: ${MFA_SECONDS}s`);
  console.log(` MFA test code:           ${VALID_MFA_CODE}`);
  console.log("==============================================");
  console.log("");
});
