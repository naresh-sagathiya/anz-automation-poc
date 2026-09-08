Feature: My Banking App native Android flow
  In order to verify the native My Banking App on an Android emulator
  As a banking app user
  I want to open the native registration flow

  @android @mybanking @native
  Scenario: Open registered device scanning
    Given I launch My Banking App
    When I open the registered device scan screen
    Then the registered device scan screen should be displayed
