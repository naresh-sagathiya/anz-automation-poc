import { When } from "@cucumber/cucumber";
import { CustomWorld } from "../../support/world";

// When(
//   "I access customer {string}",
//   async function (this: CustomWorld, customerId: string) {
//     this.response = await this.requestContext.get(`/customers/${customerId}`, {
//       headers: {
//         Authorization: `Bearer ${this.accessToken}`,
//       },
//     });

//     this.responseBody = await this.response.json();
//   },
// );

When(
  "I access customer {string} without an access token",
  async function (this: CustomWorld, customerId: string) {
    this.response = await this.requestContext.get(`/customers/${customerId}`);

    this.errorBody = await this.response.json();
  },
);

When(
  "I access customer {string} with malformed token",
  async function (this: CustomWorld, customerId: string) {
    this.response = await this.requestContext.get(`/customers/${customerId}`, {
      headers: {
        Authorization: "Bearer abc.invalid.token",
      },
    });

    this.errorBody = await this.response.json();
  },
);
