@api @quality
Feature: Banking API quality contracts
  Background:
    Given the banking API is available
    And I am authenticated as "alice"

  @A16
  Scenario: Account and error responses pass schema validation
    When I request the configured customer accounts
    Then the account response passes its Zod schema
    When I submit a payment with amount 0 and currency "AUD"
    Then the error response passes its Zod schema

  @A16
  Scenario: Every banking resource response passes strict schema validation
    When I run the banking endpoint schema sweep
    Then every banking endpoint response passes its schema

  @A17
  Scenario: Client honours Retry-After for rate limiting
    When I call the rate limited endpoint with retry key "rate-test"
    Then the retried rate limited request succeeds

  @A18
  Scenario: Logger redacts sensitive values in an artefact
    When I write a redaction sample artefact
    Then the artefact contains no secrets