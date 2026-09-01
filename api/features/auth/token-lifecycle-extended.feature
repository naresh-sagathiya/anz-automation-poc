@api @authentication @A3
Feature: Authentication - extended token lifecycle checks

  Background:
    Given the banking API is available
  
  @A3
  Scenario: Refresh token rotation keeps the next request working
    Given I login with username "alice" and password "Password123!"
    And I refresh the access token
    Then the API response status should be 200
    When I access customer "CUST-001" using the new access token
    Then the API response status should be 200
  
  @A3
  Scenario: Revoked access token is rejected even after a refresh rotation
    Given I login with username "alice" and password "Password123!"
    And I revoke the access token
    When I access customer "CUST-001" using the revoked access token
    Then the API response status should be 401
    And the API error code should be "TOKEN_REVOKED"
