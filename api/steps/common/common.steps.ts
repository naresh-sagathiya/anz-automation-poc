import { Given } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../../support/world";

Given("the banking API is available", async function (this: CustomWorld) {
  const response = await this.requestContext.get("/health");

  expect(response.status()).toBe(200);
});
