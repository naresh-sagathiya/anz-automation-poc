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