// import 'dotenv/config';
// import { request } from 'playwright';
// import { PaymentService } from '../api/services/PaymentService';

// async function main() {
//   const baseURL = process.env.API_BASE_URL || process.env.API_BASE_URI || 'http://localhost:3000';

//   const apiContext = await request.newContext({
//     baseURL,
//     ignoreHTTPSErrors: true,
//     extraHTTPHeaders: { Accept: 'application/json' },
//   });

//   try {
//     const service = new PaymentService(apiContext as any);
//     const result = await service.createPayment();
//     console.log('PaymentService result:', result);
//   } catch (err) {
//     console.error('Error running PaymentService:', err);
//     // Re-run the same request to capture the raw response body for debugging
//     try {
//       const accountId = 12345;
//       const amount = 250.75;

//       const payload = {
//         name: 'John Utility Company',
//         address: {
//           street: '123 Main Street',
//           city: 'New York',
//           state: 'NY',
//           zipCode: '10001'
//         },
//         phoneNumber: '5551234567',
//         accountNumber: 987654321
//       };

//       const resp = await apiContext.post(
//         `/billpay?accountId=${accountId}&amount=${amount}`,
//         {
//           headers: { 'Content-Type': 'application/json' },
//           data: payload,
//         }
//       );

//       console.log('Debug - response status:', resp.status());
//       let bodyText: string;
//       try {
//         const json = await resp.json();
//         console.log('Debug - response JSON:', JSON.stringify(json, null, 2));
//       } catch (e) {
//         bodyText = await resp.text();
//         console.log('Debug - response text:', bodyText);
//       }
//     } catch (innerErr) {
//       console.error('Error fetching debug response:', innerErr);
//     }
//     process.exitCode = 1;
//   } finally {
//     await apiContext.dispose();
//   }
// }

// main();
