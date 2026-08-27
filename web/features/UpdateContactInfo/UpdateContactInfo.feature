Feature: ParaBank Login

  @UpdateContactInfo

  Scenario: Login with valid credentials
   Given the customer is on the ParaBank home page
        
   When the customer registers a new user using registration test data

   When the customer updates Contact details

