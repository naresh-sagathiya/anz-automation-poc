@api @A2
Feature: MFA Challenge

  Background:
    Given I login with username "alice" and password "Password123!"

  @A2
  Scenario: MFA challenge should be created successfully
    When I request an MFA challenge
    Then the MFA response status should be 201
    And the MFA challenge token should be returned
    And the MFA challenge id should be returned
    And the MFA challenge should have an expiry
    And the MFA attempts remaining should be 3

  @A2
  Scenario: Wrong MFA code should decrement the failure counter
    When I request an MFA challenge
    And I verify the MFA challenge with code "000000"
    Then the MFA response status should be 401
    And the MFA error code should be "MFA_INVALID_CODE"
    And the MFA attempts remaining should be 2

  @A2
  Scenario: MFA challenge should be single-use
    When I request an MFA challenge
    And I verify the MFA challenge with code "123456"
    Then the MFA response status should be 200
    When I verify the same MFA challenge again with code "123456"
    Then the MFA response status should be 401
    And the MFA error code should be "MFA_CHALLENGE_ALREADY_USED"