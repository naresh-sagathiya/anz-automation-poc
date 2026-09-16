Feature: ParaBank Login

  @UpdateContactInfo

  Scenario: Login with valid credentials
   Given the customer is on the ParaBank home page    
  When the customer logs in using the shared test user
   When the customer updates Contact details

