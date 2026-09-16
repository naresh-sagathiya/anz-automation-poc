@api @authentication @A3
Feature: Authentication - Token Lifecycle

  @A3
  Scenario: Expired access token should return 401
    Given I login with username "alice" and password "Password123!"
    And I wait for the access token to expire
    When I access customer "CUST-001"
    Then the API response status should be 401
    And the API error code should be "TOKEN_EXPIRED"

  @A3
  Scenario: Refresh token should issue a new working access token
    Given I login with username "alice" and password "Password123!"
    When I refresh the access token
    Then the API response status should be 200
    And a new access token should be returned
    When I access customer "CUST-001" using the new access token
    Then the API response status should be 200

  @A3
  Scenario: Revoked access token should be rejected
    Given I login with username "alice" and password "Password123!"
    When I revoke the access token
    Then the API response status should be 200
    When I access customer "CUST-001" using the revoked access token
    Then the API response status should be 401
    And the API error code should be "TOKEN_REVOKED"
    