Feature: Payments
  Scenario: User initiates a transfer
    Given the user is on the payments page
    When they submit a transfer
    Then the transfer is created successfully

