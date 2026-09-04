import { World, IWorldOptions, setWorldConstructor } from "@cucumber/cucumber";
import { AccountService } from "../services/AccountService";
import { APIRequestContext, APIResponse, request } from "@playwright/test";
import AuthService from "../services/AuthService";
import { ErrorResponse, LoginResponse, MfaChallengeResponse } from "../models/auth.model";
import CustomerService from "../services/CustomerService";
import BankingPaymentService from "../services/PaymentService";
import PayeeService from "../services/PayeeService";
import DataFactoryService from "../services/DataFactoryService";

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


  constructor(options: IWorldOptions) {
    super(options);
  }

  async initialize(): Promise<void> {
    this.requestContext = await request.newContext({
      baseURL: process.env.API_BASE_URL || "http://localhost:4010",
    });

    this.authService = new AuthService(this.requestContext);
    this.customerService = new CustomerService(this.requestContext);
    this.accountService = new AccountService(this.requestContext);
    this.paymentService = new BankingPaymentService(this.requestContext);
    this.payeeService = new PayeeService(this.requestContext);
    this.dataFactoryService = new DataFactoryService(this.requestContext);
  }

  async dispose(): Promise<void> {
    if (this.requestContext) {
      await this.requestContext.dispose();
    }
  }

  // async initialize() {
  //   this.request = await request.newContext({
  //     baseURL: process.env.API_BASE_URL,
  //     extraHTTPHeaders: {
  //       Accept: "application/json",
  //     },
  //   });
  // }

  // async dispose() {
  //   if (this.request) {
  //     await this.request.dispose();
  //   }
  // }
}

setWorldConstructor(CustomWorld);
