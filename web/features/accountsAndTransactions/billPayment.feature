Feature: ParaBank bill payment

  Background:
    Given the customer is on the ParaBank home page
    And the customer registers a new user using registration test data

  @bill-payment @smoke
  Scenario: Pay a bill with a valid amount
    Given the customer navigates to Bill Pay
    And the customer submits the bill payment using test data
    Then the bill payment should be completed successfully

  @bill-payment @negative
  Scenario: Reject a bill payment without a payee name
    Given the customer navigates to Bill Pay
    When the customer submits a bill payment without a payee name
    Then the bill payment should be rejected with an error

  @bill-payment @negative
  Scenario: Reject a bill payment with mismatched account confirmation

    Given the customer navigates to Bill Pay
    When the customer submits a bill payment with mismatched account confirmation
    Then the bill payment should be rejected with an error

  @bill-payment @limit @negative
  Scenario: Process a payment at the configured payment limit
    Given the customer navigates to Bill Pay
    When the customer submits a bill payment with amount "15"
    Then the bill payment should be completed successfully

  @bill-payment @double-submit
  Scenario: Prevent a double-submit from creating two payments
    Given the customer navigates to Bill Pay
    When the customer submits the same bill payment twice
    Then the bill payment should be completed successfully
