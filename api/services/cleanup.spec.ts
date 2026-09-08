import {
    test,
    expect
} from '../../utils/fixtures/api.fixture';

import { DataFactory } from '../../utils/data-factory';

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
