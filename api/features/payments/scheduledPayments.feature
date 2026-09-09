@api @scheduled-payments
Feature: Scheduled payments
  Background:
    Given the banking API is available
    And I am authenticated as "alice"

  Scenario: Create and cancel a scheduled payment
    When I create a scheduled payment for tomorrow
    Then the scheduled payment is returned with status "SCHEDULED"
    When I cancel the scheduled payment
    Then the scheduled payment is returned with status "CANCELLED"

  Scenario: Reject a scheduled payment outside the payment limit
    When I submit a scheduled payment above the payment limit
    Then the scheduled payment response status is 422
    And the scheduled payment error code is "SCHEDULED_PAYMENT_VALIDATION_FAILED"