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

  @A4
  Scenario Outline: Every protected GET endpoint rejects missing and malformed tokens
    When I call protected endpoint "<endpoint>" with token type "<tokenType>"
    Then the API response status should be 401
    And the API error code should be "<code>"

    Examples:
      | endpoint                         | tokenType | code          |
      | /customers/CUST-001              | missing   | TOKEN_MISSING |
      | /customers/CUST-001/accounts     | missing   | TOKEN_MISSING |
      | /accounts/ACC-001                | missing   | TOKEN_MISSING |
      | /accounts/ACC-001/transactions   | missing   | TOKEN_MISSING |
      | /payees                          | missing   | TOKEN_MISSING |
      | /rate-limit/probe                | missing   | TOKEN_MISSING |
      | /customers/CUST-001              | malformed | TOKEN_INVALID |
      | /customers/CUST-001/accounts     | malformed | TOKEN_INVALID |
      | /accounts/ACC-001                | malformed | TOKEN_INVALID |
      | /accounts/ACC-001/transactions   | malformed | TOKEN_INVALID |
      | /payees                          | malformed | TOKEN_INVALID |
      | /rate-limit/probe                | malformed | TOKEN_INVALID |

  @A4
  Scenario Outline: Every protected customer endpoint denies another customer's token
    Given I login with username "alice" and password "Password123!"
    When I call protected endpoint "<endpoint>" with token type "other-user"
    Then the API response status should be 403
    And the API error code should be "ACCESS_DENIED"

    Examples:
      | endpoint                       |
      | /customers/CUST-002            |
      | /customers/CUST-002/accounts   |
      | /accounts/ACC-002              |
      | /accounts/ACC-002/transactions |
