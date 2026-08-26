import { APIRequestContext, expect } from '@playwright/test';

export class PaymentService {

    constructor(private request: APIRequestContext) {}

    async createPayment() {

        const accountId = 12345;
        const amount = 250.75;

        const payload = {
            name: 'John Utility Company',
            address: {
                street: '123 Main Street',
                city: 'New York',
                state: 'NY',
                zipCode: '10001'
            },
            phoneNumber: '5551234567',
            accountNumber: 987654321
        };

        const response = await this.request.post(
            `/billpay?accountId=${accountId}&amount=${amount}`,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                data: payload
            }
        );

        expect(response.status()).toBe(201);

        const responseBody = await response.json();

        console.log('Payment Response:', responseBody);

        expect(responseBody.payeeName)
            .toBe(payload.name);

        expect(responseBody.amount)
            .toBe(amount);

        expect(responseBody.accountId)
            .toBe(accountId);

        return responseBody;
    }
}






if (require.main === module) {
    (async () => {
        // load env and create a Playwright API request context dynamically
        await import('dotenv/config');
        const { request } = await import('@playwright/test');

        const baseURL = process.env.API_BASE_URL || process.env.API_BASE_URI || 'http://localhost:3000';

        const apiContext = await request.newContext({
            baseURL,
            ignoreHTTPSErrors: true,
            extraHTTPHeaders: { Accept: 'application/json' },
        });

        try {
            const svc = new PaymentService(apiContext as any);
            const result = await svc.createPayment();
            console.log('PaymentService standalone result:', result);
        } catch (e) {
            console.error('PaymentService standalone error:', e);
            process.exitCode = 1;
        } finally {
            await apiContext.dispose();
        }
    })();
}
