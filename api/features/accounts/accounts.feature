Feature: Accounts
  Scenario: Fetch account list
    Given an authenticated user
    When they request accounts
    Then the account list is returned

