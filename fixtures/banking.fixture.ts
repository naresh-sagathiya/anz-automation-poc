import { test as base } from "@playwright/test";
import AuthService from "../api/services/AuthService";
import DataFactoryService from "../api/services/DataFactoryService";

type BankingFixtures = {
  bankingToken: string;
  seededCustomerId: string | undefined;
};

export const test = base.extend<BankingFixtures>({
  bankingToken: async ({ request }, use) => {
    const auth = new AuthService(request);
    const response = await auth.login(
      process.env.API_USER_ALICE || "alice",
      process.env.API_PASSWORD_ALICE || "Password123!",
    );
    const body = await response.json();
    await use(body.accessToken);
  },
  seededCustomerId: async ({ request, bankingToken }, use) => {
    const factory = new DataFactoryService(request);
    const seed = await factory.seed(bankingToken);
    const body = await seed.json();
    try {
      await use(body.customerId);
    } finally {
      await factory.cleanup(bankingToken, body.customerId);
    }
  },
});
