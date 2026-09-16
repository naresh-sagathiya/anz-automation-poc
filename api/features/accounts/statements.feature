@api @statements
Feature: Account statements
  Background:
    Given the banking account API is available

  Scenario: Account statement reconciles to the closing balance
    When I request the statement for the selected account
    Then the statement has a valid schema
    And the statement transactions reconcile with the closing balance