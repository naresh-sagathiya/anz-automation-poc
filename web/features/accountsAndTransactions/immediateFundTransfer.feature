Feature: ParaBank immediate fund transfer

  Background:
    Given the customer is on the ParaBank home page
    And the customer registers a new user using registration test data
    When the customer creates a new additional account
    Then the customer should see the new account in the Accounts Overview page


  @immediate-fund-transfer @smoke
  Scenario: Transfer funds successfully between two accounts
    Given the customer navigates to Transfer Funds
    When the customer selects two different accounts for the transfer
    And the customer transfers amount "15"
    Then the fund transfer should be completed successfully

  @immediate-fund-transfer @reconciliation
  Scenario: Reconcile debit and credit balances after immediate fund transfer
    Given the customer navigates to Transfer Funds
    When the customer selects two different accounts for the transfer
    And the customer captures the source account balance before transfer
    And the customer captures the destination account balance before transfer
    And the customer transfers amount "15"
    Then the fund transfer should be completed successfully
    And the customer captures the source account balance after transfer
    And the customer captures the destination account balance after transfer
    Then the debit and credit amounts should reconcile exactly

  @immediate-fund-transfer @reference
  Scenario: Produce a reference for an immediate fund transfer
    Given the customer navigates to Transfer Funds
    When the customer selects two different accounts for the transfer
    And the customer transfers amount "15"
    Then the fund transfer should be completed successfully
    And a transfer reference should be produced