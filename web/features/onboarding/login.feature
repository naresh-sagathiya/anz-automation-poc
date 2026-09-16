Feature: ParaBank Login

  @login
  @smoke

  Scenario: Login with valid credentials

    Given the customer is on the ParaBank home page
    When the customer logs in using the shared test user
    And the customer logs out of ParaBank
    When the customer logs in to ParaBank using valid credentials
    Then the customer should see the Accounts Overview page