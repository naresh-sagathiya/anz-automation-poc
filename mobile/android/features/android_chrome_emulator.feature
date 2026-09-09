Feature: Android emulator Chrome flow
  In order to verify the app runs on a real Android emulator browser
  As a user of the Android emulator Chrome session
  I want to load the ParaBank login and interact with the mobile site

  @android @chrome
  Scenario: Login through Chrome on Android emulator
    Given I launch Chrome on the Android emulator
    And I open the ParaBank login page
    When I login with the Android emulator credentials
    Then I should see the account overview page

  @navigation
  Scenario Outline: Navigate through ParaBank mobile pages on Android
    Given I launch Chrome on the Android emulator
    And I open the ParaBank login page
    When I login with the Android emulator credentials
    And I open the Android mobile navigation link "<link>"
    Then the Android mobile page should display "<heading>"

    Examples:
      | link              | heading           |
      | Transfer Funds    | Transfer Funds    |
      | Bill Pay          | Bill Pay          |
      | Find Transactions | Find Transactions |
      | Request Loan      | Request Loan      |

  @forms
  Scenario Outline: Open core ParaBank mobile forms on Android
    Given I launch Chrome on the Android emulator
    And I open the Android ParaBank page "<path>"
    Then the Android mobile page should display "<heading>"

    Examples:
      | path          | heading        |
      | register.htm  | Register       |
      | transfer.htm  | Transfer Funds |
      | billpay.htm   | Bill Pay       |
      | findtrans.htm | Find Transactions |
