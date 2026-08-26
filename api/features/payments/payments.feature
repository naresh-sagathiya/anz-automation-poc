Feature: Payments API
  Scenario: Create payment
    Given a valid payment payload
    When the payment is submitted
    Then the payment is accepted

