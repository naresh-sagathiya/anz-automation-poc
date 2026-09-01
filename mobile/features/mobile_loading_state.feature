@mobile @ID-M9 @loading-state
Feature: Mobile transfer loading state and duplicate-submit protection
  In order to prevent duplicate money transfers on mobile banking
  As a mobile user
  I want a visible loading state and a disabled confirm button while transfer submission is in flight

  Background:
    Given I open the parabank mobile site
    And I login with valid mobile credentials

  Scenario: Loading state is shown and duplicate submit is blocked during slow network transfer
    Given I open the mobile transfer screen for ID-M9
    When I enable CDP network throttling for ID-M9 transfer
    And I prepare valid transfer details for ID-M9
    And I submit the ID-M9 transfer rapidly twice
    Then a loading state is shown while the ID-M9 transfer is in flight
    And the confirm button is disabled while the ID-M9 transfer is in flight
    And only one ID-M9 transfer submit request is sent
    And the ID-M9 transfer completes successfully