Feature: ParaBank Login

  Background:
    Given the customer is on the ParaBank home page
    When the customer registers a new user using registration test data
    And the customer logs out after registration

  @login
  @smoke

  Scenario: Login with valid credentials

    Given the customer is on the ParaBank home page

    When the customer logs in to ParaBank using valid credentials

    Then the customer should see the Accounts Overview page