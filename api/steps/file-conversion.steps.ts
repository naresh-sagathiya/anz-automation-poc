import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { CustomWorld } from "../support/world";

Given("the banking API is available", async function (this: CustomWorld) {
  const response = await this.requestContext.get("/health");
  expect(response.status()).toBe(200);
});

When(
  "I convert the following text to JSON with file name {string} and output directory {string}",
  async function (
    this: CustomWorld,
    fileName: string,
    outputDir: string,
    text: string,
  ) {
    this.response = await this.requestContext.post("/files/text-to-json", {
      data: {
        text,
        fileName,
        outputDir,
      },
    });

    this.responseBody = await this.response.json();
  },
);

Then("the conversion response status should be {int}", function (
  this: CustomWorld,
  expectedStatus: number,
) {
  expect(this.response.status()).toBe(expectedStatus);
});

Then(
  "the conversion response should include file name {string}",
  function (this: CustomWorld, expectedFileName: string) {
    expect(this.responseBody.fileName).toBe(expectedFileName);
  },
);

Then(
  "the conversion response should include {string} with value {string}",
  function (this: CustomWorld, fieldName: string, expectedValue: string) {
    expect(this.responseBody.data[fieldName]).toBe(expectedValue);
  },
);

Then(
  "the generated JSON file should exist in the local output folder",
  function (this: CustomWorld) {
    const filePath = path.join(
      __dirname,
      "..",
      "locales",
      this.responseBody.fileName,
    );

    expect(existsSync(filePath)).toBeTruthy();

    const content = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(content);

    expect(parsed.name).toBe("Alice");
    expect(parsed.email).toBe("alice@example.com");
    expect(parsed.status).toBe("active");
  },
);
