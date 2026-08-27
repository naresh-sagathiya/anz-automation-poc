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

  @A1
  Scenario: Login with invalid password should return 401
    When I login with username "alice" and password "WrongPassword123!"
    Then the login response status should be 401
    And the login error code should be "AUTH_INVALID_CREDENTIALS"
    And the login error message should be "Invalid username or password"
    And the login response should not contain an access token
    And the login response should not contain a refresh token

  @A1
  Scenario: Login with non-existing username should return 401
    When I login with username "unknownuser" and password "Password123!"
    Then the login response status should be 401
    And the login error code should be "AUTH_INVALID_CREDENTIALS"
    And the login error message should be "Invalid username or password"
    And the login response should not contain an access token
    And the login response should not contain a refresh token