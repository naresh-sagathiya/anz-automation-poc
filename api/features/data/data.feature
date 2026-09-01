@api @data
Feature: Banking test data factory
  Background:
    Given the banking API is available
    And I am authenticated as "alice"

  @A13 @A14
  Scenario: Seeded data is cleaned up by the fixture contract
    When I seed a customer through the data factory
    Then the seeded customer has an account and transaction history
    And the seeded customer has a payee
    And I clean up the seeded customer
    Then the seeded customer is no longer available