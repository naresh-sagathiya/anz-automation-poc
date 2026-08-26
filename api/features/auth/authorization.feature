@api @authentication @A4
Feature: Authentication - Unauthenticated and Cross User Access

  @A4
  Scenario: Protected endpoint without token should return 401
    When I access customer "CUST-001" without an access token
    Then the API response status should be 401
    And the API error code should be "TOKEN_MISSING"

  @A4
  Scenario: Protected endpoint with malformed token should return 401
    When I access customer "CUST-001" with malformed token
    Then the API response status should be 401
    And the API error code should be "TOKEN_INVALID"

  @A4
  Scenario: Customer should access their own customer data
    Given I login with username "alice" and password "Password123!"
    When I access customer "CUST-001"
    Then the API response status should be 200

  @A4
  Scenario: Customer should not access another customer's data
    Given I login with username "alice" and password "Password123!"
    When I access customer "CUST-002"
    Then the API response status should be 403
    And the API error code should be "ACCESS_DENIED"
    