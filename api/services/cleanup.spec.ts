import {
    test,
    expect
} from '../../fixtures/api.fixture';

import { DataFactory } from '../../utils/DataFactory';

test(
    'Cleanup guarantee on failure',
    async ({ cleanupRegistry }) => {

        const dataFactory =
            new DataFactory();

        const customerId =
            await dataFactory.createCustomer();

        cleanupRegistry.register(
            async () => {

                await dataFactory.deleteCustomer(
                    customerId
                );

            }
        );

        throw new Error(
            'Forced mid-test failure'
        );
    }
);