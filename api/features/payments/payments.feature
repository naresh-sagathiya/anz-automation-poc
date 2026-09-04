@api @payments
Feature: Banking payment API
  Background:
    Given the banking API is available
    And I am authenticated as "alice"

  @A8 @A9
  Scenario: Payment and idempotency prevent duplicate debit
    When I create a payment of 10.25 with idempotency key "same-key"
    And I repeat the payment with idempotency key "same-key"
    Then the repeated payment has the original payment ID
    And the source and destination balances moved exactly once by 10.25
    And the payment status is "COMPLETED"

  @A9
  Scenario: A new idempotency key creates a second payment
    When I create a payment of 1 with idempotency key "first-key"
    And I create another payment of 1 with idempotency key "second-key"
    Then the second payment has a different payment ID

  @A10
  Scenario Outline: Invalid payment is rejected with an error contract
    When I submit a payment with amount <amount> and currency "<currency>"
    Then the payment response status is 422
    And the payment error has code "PAYMENT_VALIDATION_FAILED"

    Examples:
      | amount | currency |
      | 0      | AUD      |
      | 10.999 | AUD      |
      | 10001  | AUD      |
      | 10     | USD      |

  @A10
  Scenario Outline: Invalid payment fields are rejected
    When I submit a payment with invalid field "<field>"
    Then the payment response status is 422
    And the payment error has code "PAYMENT_VALIDATION_FAILED"

    Examples:
      | field       |
      | bsb         |
      | payee       |
      | missing     |

  @A11 @A15
  Scenario: Payment status and audit record are available
    When I create a payment of 2.50 with idempotency key "payments-feature-key"
    And I request its status and audit record
    Then the payment status is "COMPLETED"
    And the audit entry references the payment

  @A11
  Scenario: Payment terminal status is immutable
    When I create a pending payment
    And I move the payment status to "COMPLETED"
    And I try to move the payment status to "FAILED"
    Then the payment response status is 409

