@mobile @ID-M4 @navigation-patterns
Feature: Banking Scenario - Mobile navigation patterns
  In order to verify responsive mobile navigation behavior
  As a mobile banker
  I want the mobile menu and compact layouts to expose the same functions and preserve data at narrow widths

  Background:
    Given I open the parabank mobile site
    And I login with valid mobile credentials

  Scenario: Mobile navigation exposes the same desktop-equivalent functions
    Then the mobile navigation menu exposes the same functions as desktop

  Scenario: Mobile menu retains the key account and transfer functions at narrow widths
    Then the mobile navigation menu presents the key account and transfer actions

  Scenario: Account data remains visible when the layout compresses to mobile cards
    Then the account data remains visible after mobile viewport compression
