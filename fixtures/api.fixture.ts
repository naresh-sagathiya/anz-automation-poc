import {
    test as base,
    expect
} from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

import { CleanupRegistry } from '../utils/CleanupRegistry';
import AuthService from '../api/services/AuthService';
import DataFactoryService from '../api/services/DataFactoryService';
import { getApiConfig } from '../api/config/env';

type ApiFixtures = {
    apiRequest: APIRequestContext;
    apiAuthService: AuthService;
    apiDataFactory: DataFactoryService;
};

export { expect };

type Fixtures = ApiFixtures & {
    cleanupRegistry: CleanupRegistry;
};

export const test = base.extend<Fixtures>({

    apiRequest: async ({}, use) => {
        const { request } = await import('@playwright/test');
        const config = getApiConfig();
        const context = await request.newContext({
            baseURL: config.baseUrl,
        });
        await use(context);
        await context.dispose();
    },

    apiAuthService: async ({ apiRequest }, use) => {
        await use(new AuthService(apiRequest));
    },

    apiDataFactory: async ({ apiRequest }, use) => {
        await use(new DataFactoryService(apiRequest));
    },

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