import { World, IWorldOptions, setWorldConstructor } from "@cucumber/cucumber";
import { AccountService } from "../services/AccountService";
import { APIRequestContext, APIResponse, request } from "@playwright/test";
import AuthService from "../services/AuthService";
import { ErrorResponse, LoginResponse, MfaChallengeResponse } from "../models/auth.model";
import CustomerService from "../services/CustomerService";

export class CustomWorld extends World {
  request!: APIRequestContext;

  response!: APIResponse;

  customerApi: any;

  requestContext!: APIRequestContext;

  authService!: AuthService;

  responseBody!: LoginResponse;

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
  customerId!: number;
  accounts: Array<{ id: number; customerId: number; type: "CHECKING" | "SAVINGS" | "LOAN"; balance: number }> = [];
  selectedAccount!: { id: number; customerId: number; type: "CHECKING" | "SAVINGS" | "LOAN"; balance: number };
  transactions: Array<{ id: number; accountId: number; type: "Credit" | "Debit"; date: number; amount: number; description: string }> = [];
  filteredTransactions: Array<{ id: number; accountId: number; type: "Credit" | "Debit"; date: number; amount: number; description: string }> = [];
  filteredAmount!: number;
  pages: Array<Array<{ id: number; accountId: number; type: "Credit" | "Debit"; date: number; amount: number; description: string }>> = [];


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
