import { Before, After } from "@cucumber/cucumber";

import { CustomWorld } from "./world";

Before(async function (this: CustomWorld) {
  await this.initialize();
});

After(async function (this: CustomWorld) {
  await this.dispose();
});
