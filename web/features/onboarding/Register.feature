Feature: ParaBank Registration

  @registration
  @smoke

  Scenario: Register a new ParaBank user

    Given the customer is on the ParaBank home page

    When the customer registers a new user using registration test data

    Then the customer registration should be successful