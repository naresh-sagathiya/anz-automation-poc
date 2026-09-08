import {
    test as base,
    expect
} from '@playwright/test';

import { cleanupRegistry } from '../../api/support/cleanupRegistry';

export { expect };

type Fixtures = {
    cleanupRegistry: cleanupRegistry;
};

export const test = base.extend<Fixtures>({

    cleanupRegistry: async ({}, use) => {

        console.log(
            'Initializing Cleanup Registry'
        );

        const registry = new cleanupRegistry();

        await use(registry);

        console.log(
            'Executing Cleanup Registry'
        );

        await registry.cleanupAll();
    }
});
