import {
    test as base,
    expect
} from '@playwright/test';

import { CleanupRegistry } from '../utils/CleanupRegistry';

export { expect };

type Fixtures = {
    cleanupRegistry: CleanupRegistry;
};

export const test = base.extend<Fixtures>({

    cleanupRegistry: async ({}, use) => {

        console.log(
            'Initializing Cleanup Registry'
        );

        const registry =
            new CleanupRegistry();

        await use(registry);

        console.log(
            'Executing Cleanup Registry'
        );

        await registry.cleanupAll();
    }
});