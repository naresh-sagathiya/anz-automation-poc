Feature: MFA Login

  @mfa
  @smoke
  Scenario: User can log in with valid MFA credentials
    Given the user is on the MFA login page
    When the user logs in with valid GitHub credentials
    And the user enters a valid OTP
    Then the user should be successfully authenticated

  @mfa
  Scenario: User receives error with invalid OTP
    Given the user is on the MFA login page
    When the user logs in with valid GitHub credentials
    And the user enters an invalid OTP
    Then the user should see an authentication error message
