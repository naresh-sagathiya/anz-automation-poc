import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../../support/world";

When("I request the operations audit endpoint", async function (this: CustomWorld) {
  this.response = await this.requestContext.get("/admin/audit", {
    headers: { Authorization: `Bearer ${this.accessToken}` },
  });
  this.apiResponseBody = await this.response.json();
  if (this.response.status() !== 200) this.errorBody = this.apiResponseBody;
});

Then(
  "the operations audit response identifies the {string} role",
  function (this: CustomWorld, role: string) {
    expect(this.apiResponseBody.role).toBe(role);
  },
);