@api @payees @A12
Feature: Banking payee API
  Background:
    Given the banking API is available
    And I am authenticated as "alice"

  @A12
  Scenario: Payee has a complete CRUD lifecycle
    When I create a valid payee
    And I update the payee name to "Updated Utilities"
    And I delete the payee
    Then the payee is no longer found

  @A12
  Scenario: Duplicate and invalid payees are rejected
    When I create a valid payee
    And I create the same payee again
    Then the payment response status is 409
    When I create a payee with an invalid BSB
    Then the payment response status is 422