import { When } from "@cucumber/cucumber";
import { CustomWorld } from "../../support/world";

When(
  "I access customer {string} without an access token",
  async function (this: CustomWorld, customerId: string) {
    this.response = await this.authService.getCustomer(customerId, "");
    this.errorBody = await this.response.json();
  },
);

When(
  "I call protected endpoint {string} with token type {string}",
  async function (this: CustomWorld, endpoint: string, tokenType: string) {
    let token = "";
    if (tokenType === "malformed") token = "abc.invalid.token";
    if (tokenType === "other-user") token = this.accessToken;
    this.response = await this.requestContext.get(endpoint, {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });
    this.errorBody = await this.response.json();
  },
);

When(
  "I access customer {string} with malformed token",
  async function (this: CustomWorld, customerId: string) {
    this.response = await this.authService.getCustomer(
      customerId,
      "abc.invalid.token",
    );

    this.errorBody = await this.response.json();
  },
);
