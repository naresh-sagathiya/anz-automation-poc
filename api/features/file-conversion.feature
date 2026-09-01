@api @files @A1
Feature: File conversion utility

  Scenario: Convert text content into a JSON file and return the JSON payload
    When I convert the following text to JSON with file name "sample" and output directory "locales"
      """
      name=Alice
      email=alice@example.com
      status=active
      """
    Then the conversion response status should be 200
    And the conversion response should include file name "sample.json"
    And the conversion response should include "name" with value "Alice"
    And the generated JSON file should exist in the local output folder
