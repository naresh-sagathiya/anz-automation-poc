Feature: Session Idle Timeout

  Background:
    Given the user is on the MFA login page
    When the user logs in with valid GitHub credentials
    And the user enters a valid OTP
    Then the user should be successfully authenticated

  @session-idle-timeout @critical
  Scenario: Back button does not restore authenticated session after timeout
    When the session is invalidated by clearing storage
    And the user clicks the back button
    Then the user should be redirected to the login page
    And verify if user is logged out

  @session-idle-timeout @protected
  Scenario: Navigating back from protected page shows login page
    When the user navigates to a protected page
    And the user's session expires
    And the user clicks the back button
    Then the page should redirect to 2FA page
    And the user should not see any authenticated content

  @session-idle-timeout @cookies
  Scenario: Cookies are invalidated when session expires
    And the authentication cookie should be stored
    When the session is cleared
    Then the authentication cookie should not be present
    And the user should not have an active session
