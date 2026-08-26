import { World, IWorldOptions, setWorldConstructor } from "@cucumber/cucumber";

import { APIRequestContext, APIResponse, request } from "@playwright/test";
import AuthService from "../services/AuthService";
import { ErrorResponse, LoginResponse, MfaChallengeResponse } from "../models/auth.model";

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

  constructor(options: IWorldOptions) {
    super(options);
  }

  async initialize(): Promise<void> {
    this.requestContext = await request.newContext({
      baseURL: process.env.API_BASE_URL || "http://localhost:4010",
    });

    this.authService = new AuthService(this.requestContext);
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
