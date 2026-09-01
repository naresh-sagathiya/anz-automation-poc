@mobile @ID-M8 @rotation
Feature: Mobile payment rotation behavior
  In order to verify payment continuity on mobile
  As a mobile user
  I want rotating to landscape during a payment to keep state and layout stable

  Background:
    Given I open the parabank mobile site
    And I login with valid mobile credentials

  Scenario: Rotating a payment draft to landscape keeps state and layout intact
    When I open the mobile bill pay form for rotation testing
    And I create a mobile payment draft
    And I rotate the payment form to landscape
    Then the mobile payment draft is preserved in landscape
    And the payment layout stays stable in landscape

  Scenario: Rotating from landscape back to portrait keeps state and allows payment submission
    When I open the mobile bill pay form for rotation testing
    And I create a mobile payment draft
    And I rotate the payment form to landscape
    And I rotate the payment form back to portrait
    Then the mobile payment draft is preserved in portrait
    And the payment layout stays stable in portrait
    When I submit the rotated mobile payment draft
    Then the mobile payment is completed successfully