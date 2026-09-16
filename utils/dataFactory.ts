export interface BankingCustomer {

    customerId: string;

    accountId: string;

    payeeId: string;

    transactionIds: string[];

}

export class DataFactory {

    async createCustomer(): Promise<string> {

        const customerId =
            `CUST_${Date.now()}`;

        console.log(
            `Customer Created: ${customerId}`
        );

        return customerId;
    }

    async createAccount(
        customerId: string
    ): Promise<string> {

        const accountId =
            `ACC_${Date.now()}`;

        console.log(
            `Account Created: ${accountId}`
        );

        console.log(
            `Linked To Customer: ${customerId}`
        );

        return accountId;
    }

    async createPayee(
        customerId: string
    ): Promise<string> {

        const payeeId =
            `PAYEE_${Date.now()}`;

        console.log(
            `Payee Created: ${payeeId}`
        );

        console.log(
            `Customer: ${customerId}`
        );

        return payeeId;
    }

    async createTransaction(
        accountId: string,
        amount: number
    ): Promise<string> {

        const transactionId =
            `TXN_${Date.now()}`;

        console.log(
            `Transaction Created: ${transactionId}`
        );

        console.log(
            `Account: ${accountId}`
        );

        console.log(
            `Amount: ${amount}`
        );

        return transactionId;
    }

    async createBankingCustomer()
        : Promise<BankingCustomer> {

        const customerId =
            await this.createCustomer();

        const accountId =
            await this.createAccount(
                customerId
            );

        const payeeId =
            await this.createPayee(
                customerId
            );

        const depositTxn =
            await this.createTransaction(
                accountId,
                5000
            );

        const withdrawalTxn =
            await this.createTransaction(
                accountId,
                -2000
            );

        return {

            customerId,

            accountId,

            payeeId,

            transactionIds: [
                depositTxn,
                withdrawalTxn
            ]

        };

    }

    async deleteCustomer(
        customerId: string
    ) {

        console.log(
            `Deleting Customer: ${customerId}`
        );

    }

    async deleteAccount(
        accountId: string
    ) {

        console.log(
            `Deleting Account: ${accountId}`
        );

    }

    async deletePayee(
        payeeId: string
    ) {

        console.log(
            `Deleting Payee: ${payeeId}`
        );

    }

    async deleteTransaction(
        transactionId: string
    ) {

        console.log(
            `Deleting Transaction: ${transactionId}`
        );

    }
}