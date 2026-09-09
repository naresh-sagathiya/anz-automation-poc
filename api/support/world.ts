import { World, IWorldOptions, setWorldConstructor } from "@cucumber/cucumber";
import { APIRequestContext, APIResponse, request } from "@playwright/test";
import { ErrorResponse, LoginResponse, MfaChallengeResponse } from "../models/auth.model";


import { getApiConfig } from "../config/env";
import AuthService from "@api/services/AuthService";
import { AccountService } from "@api/services/AccountService";
import BankingPaymentService from "@api/services/PaymentService";
import PayeeService from "@api/services/PayeeService";
import DataFactoryService from "@api/services/DataFactoryService";
import ScheduledPaymentService from "@api/services/ScheduledPaymentService";
import StatementService from "@api/services/StatementService";
import CustomerService from "@api/services/CustomerService";

export class CustomWorld extends World {
  request!: APIRequestContext;

  response!: APIResponse;

  customerApi: any;

  requestContext!: APIRequestContext;

  authService!: AuthService;

  responseBody!: LoginResponse;

  apiResponseBody!: any;

  loginBody!: LoginResponse;

  accessToken!: string;

  refreshToken!: string;

  errorBody!: ErrorResponse;

  mfaBody!: MfaChallengeResponse;

  challengeId!: string;

  challengeToken!: string;

  newAccessToken!: string;

  customerService!: CustomerService;

  accountService!: AccountService;
  paymentService!: BankingPaymentService;
  payeeService!: PayeeService;
  dataFactoryService!: DataFactoryService;
  scheduledPaymentService!: ScheduledPaymentService;
  statementService!: StatementService;
  customerId!: string;
  accounts: Array<any> = [];
  selectedAccount!: any;
  transactions: Array<any> = [];
  filteredTransactions: Array<any> = [];
  filteredAmount!: number;
  pages: Array<Array<any>> = [];
  paymentId!: string;
  firstPaymentId!: string;
  idempotencyKey!: string;
  sourceBalanceBefore!: number;
  destinationBalanceBefore!: number;
  secondPaymentId!: string;
  repeatedPayment!: any;
  auditBody!: any;
  payeeBody!: any;
  payeePayload!: { name: string; bsb: string; accountNumber: string };
  seedBody!: any;
  artifactPath!: string;
  seedCleanupComplete = false;
  scheduledPaymentBody!: any;
  statementBody!: any;
  adminBody!: any;
  schemaSweepCompleted = false;


  constructor(options: IWorldOptions) {
    super(options);
  }

  async initialize(): Promise<void> {
    const config = getApiConfig();
    this.requestContext = await request.newContext({
      baseURL: config.baseUrl,
    });

    this.authService = new AuthService(this.requestContext);
    this.customerService = new CustomerService(this.requestContext);
    this.accountService = new AccountService(this.requestContext);
    this.paymentService = new BankingPaymentService(this.requestContext);
    this.payeeService = new PayeeService(this.requestContext);
    this.dataFactoryService = new DataFactoryService(this.requestContext);
    this.scheduledPaymentService = new ScheduledPaymentService(this.requestContext);
    this.statementService = new StatementService(this.requestContext);
  }

  async dispose(): Promise<void> {
    if (this.requestContext) {
      await this.requestContext.dispose();
    }
  }
}

setWorldConstructor(CustomWorld);
