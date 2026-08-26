@api @authentication @A1
Feature: Authentication - Login and Token Issue

  Background:
    Given the banking API is available

  @A1
  Scenario: Login with valid credentials should return a valid access token
    When I login with username "alice" and password "Password123!"
    Then the login response status should be 200
    And the login response should contain an access token
    And the login response should contain a refresh token
    And the token type should be "Bearer"
    And the access token expiry should be greater than zero
    And the access token should contain an expiry claim
    And the login response should contain a valid expiry date
    And the login response should not contain the password
    And the login response should not contain sensitive personal information
    