Feature: ParaBank OpenAdditionalAccount

    Background: 
       Given the customer is on the ParaBank home page
       When the customer registers a new user using registration test data

    @OpenAdditionalAccount
    @smoke

    Scenario: open additional account in the registered account

        When the customer creates a new additional account

        Then the customer should see the new account in the Accounts Overview page