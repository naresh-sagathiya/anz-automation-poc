@api @authorization @rbac
Feature: Role-based authorization

  Scenario: Customer cannot access operations audit data
    Given I am authenticated as "alice"
    When I request the operations audit endpoint
    Then the API response status should be 403
    And the API error code should be "ROLE_ACCESS_DENIED"

  Scenario: Operations user can access audit data
    Given I am authenticated as "operator"
    When I request the operations audit endpoint
    Then the API response status should be 200
    And the operations audit response identifies the "OPERATIONS" role