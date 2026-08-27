Feature: Authentication
  Scenario: User logs in
    Given a valid user
    When they authenticate
    Then a token is issued

