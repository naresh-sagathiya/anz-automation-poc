Feature: ParaBank account balances and transaction history

  Background:
    Given the customer is on the ParaBank home page
    And the customer registers a new user using registration test data

  @w6 @balance-integrity
  Scenario: Reconcile the account balance across overview and statement
    When the customer records the first account balance
    And the customer navigates to Bill Pay
    And the customer submits a bill payment with amount "15"
    When the customer opens the first account from Accounts Overview
    Then the account balance should reconcile across the overview and statement

  @w7 @transaction-search
  Scenario: Search transaction history by amount
    When the customer navigates to Bill Pay
    And the customer submits a bill payment with amount "15"
    And the customer searches the first account transactions for amount "15"
    Then every transaction result should match amount "15"

   @w8 @transaction-details
  Scenario: Verify transaction details include person information
    Given the customer navigates to Bill Pay
    And the customer submits a bill payment with amount "15"
    And the customer searches the first account transactions for amount "15"
    When the customer views the transaction details with person information
    Then the transaction details should include person information
    And the transaction results should display full person details

  @w8 @export-csv
  Scenario: Export transaction details to CSV report
    Given the customer navigates to Bill Pay
    And the customer submits a bill payment with amount "15"
    And the customer searches the first account transactions for amount "15"
    When the customer views the transaction details with person information
    And the customer exports the transaction details to CSV
    Then the CSV report should be created with person details
    And the exported file should contain person information

  @w8 @export-json
  Scenario: Export transaction details to JSON report
    Given the customer navigates to Bill Pay
    And the customer submits a bill payment with amount "15"
    And the customer searches the first account transactions for amount "15"
    When the customer views the transaction details with person information
    And the customer exports the transaction details to JSON
    Then the JSON report should be created with person details
    And the exported file should contain person information

  