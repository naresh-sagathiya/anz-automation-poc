require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 4010);
const JWT_SECRET = process.env.JWT_SECRET || "anz-poc-secret-change-me";
const ACCESS_TOKEN_SECONDS = Number(process.env.ACCESS_TOKEN_SECONDS || 3600);
const REFRESH_TOKEN_SECONDS = Number(
  process.env.REFRESH_TOKEN_SECONDS || 86400,
);
const MFA_SECONDS = Number(process.env.MFA_SECONDS || 120);
const MFA_MAX_ATTEMPTS = 3;
const VALID_MFA_CODE = process.env.MFA_CODE || "123456";
const API_USER_ALICE = process.env.API_USER_ALICE || "alice";
const API_USER_BOB = process.env.API_USER_BOB || "bob";
const API_PASSWORD_ALICE = process.env.API_PASSWORD_ALICE || "Password123!";
const API_PASSWORD_BOB = process.env.API_PASSWORD_BOB || "Password123!";

const users = new Map([
  [
    API_USER_ALICE,
    {
      userId: "USER-001",
      username: API_USER_ALICE,
      password: API_PASSWORD_ALICE,
      customerId: "CUST-001",
    },
  ],
  [
    API_USER_BOB,
    {
      userId: "USER-002",
      username: API_USER_BOB,
      password: API_PASSWORD_BOB,
      customerId: "CUST-002",
    },
  ],
]);

const customers = new Map([
  [
    "CUST-001",
    {
      customerId: "CUST-001",
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@example.com",
    },
  ],
  [
    "CUST-002",
    {
      customerId: "CUST-002",
      firstName: "Bob",
      lastName: "Jones",
      email: "bob@example.com",
    },
  ],
]);

const accounts = new Map([
  [
    "CUST-001",
    [
      {
        accountId: "ACC-001",
        accountNumber: "XXXXXX001",
        customerId: "CUST-001",
        accountType: "SAVINGS",
        currency: "AUD",
        balance: 5000.0,
        currentBalance: 5000.0,
        availableBalance: 5000.0,
        pendingBalance: 0.0,
      },
      {
        accountId: "ACC-003",
        accountNumber: "XXXXXX003",
        customerId: "CUST-001",
        accountType: "CHECKING",
        currency: "AUD",
        balance: 1000.0,
        currentBalance: 1000.0,
        availableBalance: 1000.0,
        pendingBalance: 0.0,
      },
    ],
  ],
  [
    "CUST-002",
    [
      {
        accountId: "ACC-002",
        accountNumber: "XXXXXX002",
        customerId: "CUST-002",
        accountType: "CHECKING",
        currency: "AUD",
        balance: 7500.0,
        currentBalance: 7500.0,
        availableBalance: 7500.0,
        pendingBalance: 0.0,
      },
    ],
  ],
]);

const refreshTokens = new Map(); // token -> { userId, expiresAt, revoked }
const revokedAccessTokens = new Set();
const mfaChallenges = new Map();
const payees = new Map([
  ["CUST-001", []],
  ["CUST-002", []],
]);
const transactions = new Map([
  [
    "ACC-001",
    [
      {
        transactionId: "TX-001",
        accountId: "ACC-001",
        type: "CREDIT",
        amount: 5500,
        currency: "AUD",
        description: "Opening balance",
        occurredAt: "2026-01-01T00:00:00.000Z",
      },
      {
        transactionId: "TX-002",
        accountId: "ACC-001",
        type: "DEBIT",
        amount: 500,
        currency: "AUD",
        description: "Utility payment",
        occurredAt: "2026-01-02T00:00:00.000Z",
      },
    ],
  ],
  [
    "ACC-002",
    [
      {
        transactionId: "TX-003",
        accountId: "ACC-002",
        type: "CREDIT",
        amount: 7500,
        currency: "AUD",
        description: "Opening balance",
        occurredAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  ],
  [
    "ACC-003",
    [
      {
        transactionId: "TX-004",
        accountId: "ACC-003",
        type: "CREDIT",
        amount: 1000,
        currency: "AUD",
        description: "Opening balance",
        occurredAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  ],
]);
const payments = new Map();
const idempotencyKeys = new Map();
const auditEntries = new Map();
const rateLimitCounters = new Map();
const seededCustomers = new Map();
const validPayeeIds = new Set(["PAYEE-UTILITY"]);

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
      scope: "banking:read banking:write",
    },
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: ACCESS_TOKEN_SECONDS,
      issuer: "anz-banking-mock",
      audience: "anz-api",
    },
  );
  return token;
}

function createRefreshToken(user) {
  const token = `rt_${crypto.randomBytes(32).toString("hex")}`;
  refreshTokens.set(token, {
    userId: user.userId,
    customerId: user.customerId,
    expiresAt: nowMs() + REFRESH_TOKEN_SECONDS * 1000,
    revoked: false,
  });
  return token;
}

function parseTextToJson(text) {
  if (text === undefined || text === null) {
    return {};
  }

  const normalized = String(text).trim();
  if (!normalized) {
    return {};
  }

  const parsedEntries = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .reduce((result, line) => {
      const separatorIndex = line.indexOf("=");
      const keyValueSeparator = line.indexOf(":");
      const separatorPos =
        separatorIndex >= 0 && (keyValueSeparator === -1 || separatorIndex < keyValueSeparator)
          ? separatorIndex
          : keyValueSeparator;

      if (separatorPos === -1) {
        result[line] = true;
        return result;
      }

      const key = line.slice(0, separatorPos).trim();
      const value = line.slice(separatorPos + 1).trim();
      result[key] = value;
      return result;
    }, {});

  return parsedEntries;
}

function publicUser(user) {
  return {
    userId: user.userId,
    username: user.username,
    customerId: user.customerId,
  };
}

function accountById(accountId) {
  for (const customerAccounts of accounts.values()) {
    const account = customerAccounts.find(
      (item) => item.accountId === accountId,
    );
    if (account) return account;
  }
  return undefined;
}

function userCustomerId(req) {
  return req.auth.payload.customerId;
}

function ownedAccount(req, accountId) {
  const account = accountById(accountId);
  return account &&
    (account.customerId === userCustomerId(req) ||
      seededCustomers.get(account.customerId) === userCustomerId(req))
    ? account
    : undefined;
}

function accountIsOwnedByRequest(req, account) {
  return (
    account &&
    (account.customerId === userCustomerId(req) ||
      seededCustomers.get(account.customerId) === userCustomerId(req))
  );
}

function paymentError(res, message) {
  return error(res, 422, "PAYMENT_VALIDATION_FAILED", message, {
    errors: [{ field: "payment", message }],
  });
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
      audience: "anz-api",
    });

    req.auth = { token, payload };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return error(res, 401, "TOKEN_EXPIRED", "Access token has expired");
    }

    return error(
      res,
      401,
      "TOKEN_INVALID",
      "Access token is malformed or invalid",
    );
  }
}

function authorizeCustomer(req, res, next) {
  const requestedCustomerId = req.params.customerId;
  const authenticatedCustomerId = req.auth.payload.customerId;

  if (!customers.has(requestedCustomerId)) {
    return error(res, 404, "CUSTOMER_NOT_FOUND", "Customer was not found");
  }

  if (
    requestedCustomerId !== authenticatedCustomerId &&
    seededCustomers.get(requestedCustomerId) !== authenticatedCustomerId
  ) {
    return error(
      res,
      403,
      "ACCESS_DENIED",
      "You are not authorized to access this customer",
    );
  }

  next();
}

app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "anz-banking-mock",
    timestamp: new Date().toISOString(),
  });
});

app.post("/files/text-to-json", (req, res) => {
  const { text, fileName = "converted.json", outputDir = "locales" } = req.body || {};

  if (text === undefined || text === null || String(text).trim() === "") {
    return error(
      res,
      400,
      "INVALID_TEXT",
      "A non-empty text payload is required to convert into JSON",
    );
  }

  const jsonData = parseTextToJson(text);
  const folderPath = path.resolve(__dirname, "..", outputDir);
  const outputFileName = fileName.endsWith(".json") ? fileName : `${fileName}.json`;
  const outputPath = path.join(folderPath, outputFileName);

  fs.mkdirSync(folderPath, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), "utf8");

  return res.status(200).json({
    fileName: outputFileName,
    filePath: outputPath,
    outputDir: folderPath,
    data: jsonData,
  });
});

// A1: login and token issue
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return error(
      res,
      400,
      "INVALID_REQUEST",
      "username and password are required",
    );
  }

  const user = users.get(username);

  if (!user || user.password !== password) {
    return error(
      res,
      401,
      "AUTH_INVALID_CREDENTIALS",
      "Invalid username or password",
    );
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
    user: publicUser(user),
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
    locked: false,
  });

  return res.status(201).json({
    challengeId,
    challengeToken,
    expiresIn: MFA_SECONDS,
    expiresAt: iso(expiresAt),
    attemptsRemaining: MFA_MAX_ATTEMPTS,
  });
});

// A2: verify MFA challenge
app.post("/auth/mfa/verify", authenticate, (req, res) => {
  const { challengeId, challengeToken, code } = req.body || {};
  const challenge = mfaChallenges.get(challengeId);

  if (!challenge) {
    return error(
      res,
      401,
      "MFA_CHALLENGE_NOT_FOUND",
      "MFA challenge was not found",
      {
        attemptsRemaining: 0,
      },
    );
  }

  if (challenge.userId !== req.auth.payload.sub) {
    return error(
      res,
      403,
      "MFA_ACCESS_DENIED",
      "Challenge belongs to another user",
    );
  }

  if (challenge.used) {
    return error(
      res,
      401,
      "MFA_CHALLENGE_ALREADY_USED",
      "MFA challenge has already been used",
      {
        attemptsRemaining: 0,
      },
    );
  }

  if (challenge.locked) {
    return error(res, 403, "MFA_CHALLENGE_LOCKED", "MFA challenge is locked", {
      attemptsRemaining: 0,
    });
  }

  if (nowMs() >= challenge.expiresAt) {
    challenge.attemptsRemaining = 0;
    return error(
      res,
      401,
      "MFA_CHALLENGE_EXPIRED",
      "MFA challenge has expired",
      {
        attemptsRemaining: 0,
      },
    );
  }

  if (challenge.challengeToken !== challengeToken) {
    challenge.attemptsRemaining = Math.max(0, challenge.attemptsRemaining - 1);

    if (challenge.attemptsRemaining === 0) {
      challenge.locked = true;
      return error(
        res,
        403,
        "MFA_CHALLENGE_LOCKED",
        "MFA challenge is locked",
        {
          attemptsRemaining: 0,
        },
      );
    }

    return error(res, 401, "MFA_INVALID_CODE", "Invalid MFA challenge token", {
      attemptsRemaining: challenge.attemptsRemaining,
    });
  }

  if (code !== VALID_MFA_CODE) {
    challenge.attemptsRemaining = Math.max(0, challenge.attemptsRemaining - 1);

    if (challenge.attemptsRemaining === 0) {
      challenge.locked = true;
      return error(
        res,
        403,
        "MFA_CHALLENGE_LOCKED",
        "MFA challenge is locked",
        {
          attemptsRemaining: 0,
        },
      );
    }

    return error(res, 401, "MFA_INVALID_CODE", "Invalid MFA code", {
      attemptsRemaining: challenge.attemptsRemaining,
    });
  }

  challenge.used = true;

  return res.status(200).json({
    verified: true,
    message: "MFA verification successful",
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
    return error(
      res,
      401,
      "REFRESH_TOKEN_REVOKED",
      "Refresh token has been revoked",
    );
  }

  if (nowMs() >= record.expiresAt) {
    return error(
      res,
      401,
      "REFRESH_TOKEN_EXPIRED",
      "Refresh token has expired",
    );
  }

  const user = [...users.values()].find((u) => u.userId === record.userId);

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
    expiresAt: iso(decoded.exp * 1000),
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
    message: "Token revoked successfully",
  });
});

// A4: customer
app.get(
  "/customers/:customerId",
  authenticate,
  authorizeCustomer,
  (req, res) => {
    const customer = customers.get(req.params.customerId);

    if (!customer) {
      return error(res, 404, "CUSTOMER_NOT_FOUND", "Customer was not found");
    }

    return res.status(200).json(customer);
  },
);

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
  },
);

app.get("/accounts/:accountId", authenticate, (req, res) => {
  const account = accountById(req.params.accountId);
  if (!account)
    return error(res, 404, "ACCOUNT_NOT_FOUND", "Account was not found");
  if (!accountIsOwnedByRequest(req, account))
    return error(
      res,
      403,
      "ACCESS_DENIED",
      "You are not authorized to access this account",
    );
  if (!account)
    return error(res, 404, "ACCOUNT_NOT_FOUND", "Account was not found");
  return res.status(200).json(account);
});

app.get("/accounts/:accountId/transactions", authenticate, (req, res) => {
  const account = accountById(req.params.accountId);
  if (!account)
    return error(res, 404, "ACCOUNT_NOT_FOUND", "Account was not found");
  if (!accountIsOwnedByRequest(req, account))
    return error(
      res,
      403,
      "ACCESS_DENIED",
      "You are not authorized to access this account",
    );
  if (!account)
    return error(res, 404, "ACCOUNT_NOT_FOUND", "Account was not found");

  const all = transactions.get(account.accountId) || [];
  const type = req.query.type;
  const minAmount =
    req.query.minAmount === undefined ? undefined : Number(req.query.minAmount);
  const filtered = all.filter(
    (item) =>
      (!type || item.type === String(type).toUpperCase()) &&
      (minAmount === undefined || item.amount >= minAmount),
  );
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(req.query.pageSize || filtered.length || 1)),
  );
  const start = (page - 1) * pageSize;

  return res.status(200).json({
    items: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
  });
});

app.get("/payees", authenticate, (req, res) => {
  return res.status(200).json(payees.get(userCustomerId(req)) || []);
});
app.get(
  "/customers/:customerId/payees",
  authenticate,
  authorizeCustomer,
  (req, res) => {
    return res.status(200).json(payees.get(req.params.customerId) || []);
  },
);

app.post("/payees", authenticate, (req, res) => {
  const { name, bsb, accountNumber } = req.body || {};
  if (
    !name ||
    !/^\d{6}$/.test(String(bsb)) ||
    !/^\d{6,10}$/.test(String(accountNumber))
  ) {
    return error(
      res,
      422,
      "PAYEE_VALIDATION_FAILED",
      "name, six-digit BSB and valid account number are required",
    );
  }
  const customerPayees = payees.get(userCustomerId(req)) || [];
  if (
    customerPayees.some(
      (item) =>
        item.bsb === String(bsb) &&
        item.accountNumber === String(accountNumber),
    )
  ) {
    return error(res, 409, "PAYEE_ALREADY_EXISTS", "Payee already exists");
  }
  const payee = {
    payeeId: `PAYEE-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    name,
    bsb: String(bsb),
    accountNumber: String(accountNumber),
    createdAt: new Date().toISOString(),
  };
  customerPayees.push(payee);
  validPayeeIds.add(payee.payeeId);
  payees.set(userCustomerId(req), customerPayees);
  return res.status(201).json(payee);
});

app.get("/payees/:payeeId", authenticate, (req, res) => {
  const payee = (payees.get(userCustomerId(req)) || []).find(
    (item) => item.payeeId === req.params.payeeId,
  );
  if (!payee) return error(res, 404, "PAYEE_NOT_FOUND", "Payee was not found");
  return res.status(200).json(payee);
});

app.put("/payees/:payeeId", authenticate, (req, res) => {
  const customerPayees = payees.get(userCustomerId(req)) || [];
  const index = customerPayees.findIndex(
    (item) => item.payeeId === req.params.payeeId,
  );
  if (index < 0)
    return error(res, 404, "PAYEE_NOT_FOUND", "Payee was not found");
  const { name, bsb, accountNumber } = req.body || {};
  if (
    !name ||
    !/^\d{6}$/.test(String(bsb)) ||
    !/^\d{6,10}$/.test(String(accountNumber))
  ) {
    return error(
      res,
      422,
      "PAYEE_VALIDATION_FAILED",
      "name, six-digit BSB and valid account number are required",
    );
  }
  customerPayees[index] = {
    ...customerPayees[index],
    name,
    bsb: String(bsb),
    accountNumber: String(accountNumber),
    updatedAt: new Date().toISOString(),
  };
  return res.status(200).json(customerPayees[index]);
});

app.patch("/payees/:payeeId", authenticate, (req, res) => {
  const customerPayees = payees.get(userCustomerId(req)) || [];
  const index = customerPayees.findIndex(
    (item) => item.payeeId === req.params.payeeId,
  );
  if (index < 0)
    return error(res, 404, "PAYEE_NOT_FOUND", "Payee was not found");

  const { name, bsb, accountNumber } = req.body || {};
  const nextName = name ?? customerPayees[index].name;
  const nextBsb = bsb ?? customerPayees[index].bsb;
  const nextAccountNumber = accountNumber ?? customerPayees[index].accountNumber;

  if (
    !nextName ||
    !/^\d{6}$/.test(String(nextBsb)) ||
    !/^\d{6,10}$/.test(String(nextAccountNumber))
  ) {
    return error(
      res,
      422,
      "PAYEE_VALIDATION_FAILED",
      "name, six-digit BSB and valid account number are required",
    );
  }

  customerPayees[index] = {
    ...customerPayees[index],
    name: nextName,
    bsb: String(nextBsb),
    accountNumber: String(nextAccountNumber),
    updatedAt: new Date().toISOString(),
  };

  return res.status(200).json(customerPayees[index]);
});

app.delete("/payees/:payeeId", authenticate, (req, res) => {
  const customerPayees = payees.get(userCustomerId(req)) || [];
  const remaining = customerPayees.filter(
    (item) => item.payeeId !== req.params.payeeId,
  );
  if (remaining.length === customerPayees.length)
    return error(res, 404, "PAYEE_NOT_FOUND", "Payee was not found");
  payees.set(userCustomerId(req), remaining);
  validPayeeIds.delete(req.params.payeeId);
  return res.status(204).send();
});

// Protected payment
app.post("/payments", authenticate, (req, res) => {
  const {
    fromAccountId,
    toAccountId,
    amount,
    currency,
    reference,
    bsb,
    payeeId,
    initialStatus,
  } = req.body || {};
  const idempotencyKey = req.get("Idempotency-Key");

  if (
    idempotencyKey &&
    idempotencyKeys.has(`${userCustomerId(req)}:${idempotencyKey}`)
  ) {
    return res
      .status(200)
      .json(idempotencyKeys.get(`${userCustomerId(req)}:${idempotencyKey}`));
  }

  if (!fromAccountId || !toAccountId || amount === undefined || !currency)
    return paymentError(
      res,
      "fromAccountId, toAccountId, amount and currency are required",
    );
  if (
    !Number.isFinite(Number(amount)) ||
    Number(amount) <= 0 ||
    Math.round(Number(amount) * 100) !== Number(amount) * 100
  )
    return paymentError(
      res,
      "amount must be positive and have no more than two decimal places",
    );
  if (Number(amount) > 10000)
    return paymentError(res, "amount exceeds the daily payment limit");
  if (currency !== "AUD") return paymentError(res, "currency must be AUD");
  if (bsb !== undefined && !/^\d{6}$/.test(String(bsb)))
    return paymentError(res, "bsb must contain exactly six digits");
  if (payeeId !== undefined && !validPayeeIds.has(String(payeeId)))
    return paymentError(res, "payee was not found");
  const source = ownedAccount(req, fromAccountId);
  const destination = accountById(toAccountId);
  if (!source || !destination)
    return paymentError(res, "source or destination account was not found");
  if (source.balance < Number(amount))
    return paymentError(res, "insufficient funds");

  source.balance -= Number(amount);
  source.currentBalance = source.balance;
  source.availableBalance = source.balance;
  destination.balance += Number(amount);
  destination.currentBalance = destination.balance;
  destination.availableBalance = destination.balance;
  const payment = {
    paymentId: `PAY-${crypto.randomBytes(5).toString("hex").toUpperCase()}`,
    status: ["PENDING", "COMPLETED", "FAILED"].includes(initialStatus)
      ? initialStatus
      : "COMPLETED",
    amount: Number(amount),
    currency,
    fromAccountId,
    toAccountId,
    reference: reference || "",
    createdAt: new Date().toISOString(),
  };
  payments.set(payment.paymentId, payment);
  if (idempotencyKey)
    idempotencyKeys.set(`${userCustomerId(req)}:${idempotencyKey}`, payment);
  const entry = {
    auditId: `AUD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    paymentId: payment.paymentId,
    action: "PAYMENT_CREATED",
    createdAt: new Date().toISOString(),
  };
  auditEntries.set(payment.paymentId, entry);
  transactions.get(source.accountId).push({
    transactionId: `TX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    accountId: source.accountId,
    type: "DEBIT",
    amount: Number(amount),
    currency,
    description: reference || "Payment",
    occurredAt: payment.createdAt,
  });
  transactions.get(destination.accountId).push({
    transactionId: `TX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    accountId: destination.accountId,
    type: "CREDIT",
    amount: Number(amount),
    currency,
    description: reference || "Payment",
    occurredAt: payment.createdAt,
  });
  return res.status(201).json(payment);
});

app.get("/payments/:paymentId", authenticate, (req, res) => {
  const payment = payments.get(req.params.paymentId);
  if (!payment)
    return error(res, 404, "PAYMENT_NOT_FOUND", "Payment was not found");
  return res.status(200).json(payment);
});

app.get("/payments/:paymentId/audit", authenticate, (req, res) => {
  const entry = auditEntries.get(req.params.paymentId);
  if (!entry)
    return error(res, 404, "AUDIT_NOT_FOUND", "Audit entry was not found");
  return res.status(200).json(entry);
});

app.post("/payments/:paymentId/status", authenticate, (req, res) => {
  const payment = payments.get(req.params.paymentId);
  if (!payment)
    return error(res, 404, "PAYMENT_NOT_FOUND", "Payment was not found");
  const nextStatus = req.body?.status;
  if (!["PENDING", "COMPLETED", "FAILED"].includes(nextStatus))
    return paymentError(res, "invalid payment status");
  if (payment.status !== "PENDING")
    return error(
      res,
      409,
      "PAYMENT_TERMINAL",
      "Terminal payment status is immutable",
    );
  payment.status = nextStatus;
  return res.status(200).json(payment);
});

app.get("/rate-limit/probe", authenticate, (req, res) => {
  const key = `${userCustomerId(req)}:${req.get("x-test-key") || "default"}`;
  const count = rateLimitCounters.get(key) || 0;
  rateLimitCounters.set(key, count + 1);
  if (count < 2)
    return res
      .set("Retry-After", "0")
      .status(429)
      .json({ code: "RATE_LIMITED", message: "Too many requests" });
  return res.status(200).json({ status: "OK" });
});

app.post("/test-data/seed", authenticate, (req, res) => {
  const customerId = `CUST-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const accountId = `ACC-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  customers.set(customerId, {
    customerId,
    firstName: "Seed",
    lastName: "Customer",
    email: `${customerId.toLowerCase()}@example.com`,
  });
  accounts.set(customerId, [
    {
      accountId,
      accountNumber: "XXXXXX999",
      customerId,
      accountType: "SAVINGS",
      currency: "AUD",
      balance: 1000,
      currentBalance: 1000,
      availableBalance: 1000,
      pendingBalance: 0,
    },
  ]);
  transactions.set(accountId, [
    {
      transactionId: `TX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      accountId,
      type: "CREDIT",
      amount: 1000,
      currency: "AUD",
      description: "Seed balance",
      occurredAt: new Date().toISOString(),
    },
  ]);
  payees.set(customerId, []);
  payees
    .get(customerId)
    .push({
      payeeId: `PAYEE-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      name: "Seed Utility",
      bsb: "123456",
      accountNumber: "12345678",
      createdAt: new Date().toISOString(),
    });
  seededCustomers.set(customerId, userCustomerId(req));
  return res.status(201).json({ customerId, accountId });
});

app.delete("/test-data/:customerId", authenticate, (req, res) => {
  const customerId = req.params.customerId;
  if (
    customerId !== userCustomerId(req) &&
    seededCustomers.get(customerId) !== userCustomerId(req)
  )
    return error(
      res,
      403,
      "ACCESS_DENIED",
      "You are not authorized to clean up this customer",
    );
  const customerAccounts = accounts.get(customerId) || [];
  for (const account of customerAccounts)
    transactions.delete(account.accountId);
  customers.delete(customerId);
  accounts.delete(customerId);
  payees.delete(customerId);
  seededCustomers.delete(customerId);
  return res.status(204).send();
});

app.use((req, res) => {
  return error(
    res,
    404,
    "NOT_FOUND",
    `Route ${req.method} ${req.path} was not found`,
  );
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
