Feature: Payments
  Scenario: User initiates a transfer
    Given the customer is on the payments page
    When the customer submits a transfer
    Then the customer's transfer should be created successfully

