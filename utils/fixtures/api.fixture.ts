import {
    test as base,
    expect,
} from '@playwright/test';


import { cleanupRegistry } from '../../api/support/cleanupRegistry';
import DataFactoryService from '@api/services/dataFactoryService';
import { getApiConfig } from '@api/config/env';
import AuthService from '@api/services/authService';


export { expect };

type Fixtures = {
    cleanupRegistry: cleanupRegistry;
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

        const registry = new cleanupRegistry();

        await use(registry);

        console.log(
            'Executing Cleanup Registry'
        );

        await registry.cleanupAll();
    }
});
