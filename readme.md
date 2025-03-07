# BUGS
- the loan workflow purpose dropdown doesn't show any options
- the loan workflow doesn't show any of my accounts to deposit the loan into
- the transaction signing is not so nice, the style of it should improve
- need toast error when failing to start a workflow
- ✔️Transaction list doesn't update after adding a new transaction
- transfers should be able to be scheduled
- when there is only one choice from the search inputs, enter key should select it
- payment contact search doesn't tab through the results
- favorite checkbox doesn't work on add payment contact
- ✔️Enter key doesn't work in account info, rename account input
- ✔️changing account name doesn't update account-widget
- do new transfers not update the account-widget?
- need to update net worth after account and transaction changes
- when you add the swish widget, you can't remove it until you reload, or switch page
- dismiss the search result with esc
- all the amounts, should be positive, and instead the type of the transaction should be the one that decides if it is showing as a negative value or not
- the button in the bottom in financial health widget is unstyled
- can't use keyboard in transfer workflow

# TODO
- can we include some colors?
#384959: Primary text, headers, footers
#6A89A7: Secondary elements, inactive states, dividers
#88BDF2: Interactive elements (buttons, links), highlights, accent
#BDDDFC: Backgrounds, cards, hover states
- search should be smart enough to show "new" documents
  - when a document have been created, the search should have it under "new"
- we need a document widget
  - how big will this be?
  - will it have a search?
  - or will the global search be able to search for documents?

# BE
- arch? bun, deno, node?
- document should be cached and static as much as possible
- we can serve the document from an api, and dynamically fill in importmaps

# bankid workflow

# account widget
- should there be a single insight/recommendation in the header of the account widget?
  that can sum the entire thing up?

# account info
- ✔️make account details show more information about the account
- account info workflow, needs an empty/default state when no account is selected
- ✔️rename function of the account, in account details

# financial health widget
- score should be nicer

# new workflows
- a signing workflow
  - make it look like mobile bankid
  - make use of it in the "take a loan" workflow
- edit payment contacts
  Doesn't need to be a "page", can just be a workflow, showing different buttons for doing things
    - edit
    - add
    - remove
  Once done, it goes away

# workflow
- maybe pinnable?
  - Do they become widgets? 
    - they would need the wrapper?
- being able to save workflows
  I might be on page 3, and want to pause/save to do something else
  and have the ability to continue later



# TODO
- Start looking at the Signals API and see if we can do something with that instead of the way it is now
  - looks like this is more just for aborting certain actions, so if anything, we could use it to abort fetches
- add a "chaos" layer for repositoryService
  - when the feature is on, when requesting the repository, it will sometimes return a chaos layer on top of the requested repository
  - when asking for data, it will sometimes return an error
  - when asking for data, it will sometimes return a timeout
  - when asking for data, it will sometimes return a 500
  - when asking for data, it will sometimes return a 404
  - when asking for data, it will sometimes return a 200, but with an empty array
  - when asking for data, it will sometimes return a 200, but with a different array
  - when asking for data, it will sometimes return a 200, but with a different object
- add tests to already built
  - components
  - services
  - repositories
- ✔️importmaps
  - it doesn't look like we can "download" a json acting as an importmap, but nothing is stopping us from hitting an api that creates the document for us, and at that time we can create the JSON file for the importmap
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#importing_modules_using_import_maps

## workflows
## mfes/widgets
### Financial-Health-widget
  - make this work with slots
  This means that the Financial Health widget are supposed to have these widgets, but these widgets can also be found through search, and added to the home page, or any other page, and resized to fit the layout
- be able to resize widgets
  
# Features
- Toast
  - Give some visual feedback when completing workflows or other actions
  - when creating an account
- Create a coach mark feature
  - Let the welcome-widget use it to demonstrate how to use the app
- create a better FE logger
  - should have categories, so that we can choose to see the logs of a workflow, modal specifics, etc
- rearrange widgets
  This is a big change. But it should be just the grid-layout and the widget-wrapper
  


# menu
## theme pages
## pages
### home
- What more do we want to show on the home page?
  - a loan widget (if you have the product)
  - a product widget, where you can easily get certain products
  - a savings insight widget (if you have saving accounts)
  - a pension widget (if you have a pension account)
### accounts
- show a more dedicated page with more information about the account
- show a list of upcoming payments

# widgets
- We should be able to order them
   - Drag it below one, and it should be placed below that one?
- We should be able to remove them
   - How do we get it back?
## Savings
### smartness
## accounts✔️
- ✔️accounts needs to look into upcoming transactions, so that we can show the total amount of upcoming payments
### smartness
- ✔️check if there is any upcoming payment that will make the account go negative
## loan widget
- show the total amount of the loan
  - a nice bar showing how much you have paid off
- show the next payment
- need to have a loan for having the widget
- is a product
- loans create upcoming transactions, as this is a recurring payment
### smartness
- can we suggest a better loan?
- can we suggest a better payment plan?
- can we suggest a better interest rate?
- can  we suggest to increase the amortization when we have a lot of capital?
## new products
- a widget that shows new products
- clicking a product shows more information about the product (workflow)


### swish✔️
- We need to think about how the swish widget should look like, because it is a phone app

# workflows
## kyc
- should trigger when opening a new pension account
  - workflows should send a notification?
  - we could set a flag on the account, that we have a pending kyc
    This could then we check at intervals and show the modal
## transfer✔️
- we should translate between different currencies
- we should be able to transfer to other banks
- ✔️should create transactions
  - ✔️we need a transaction repository
    - a transaction can be recurring
      - We want this to be a checkbox on the transfer workflow
      - this will require some mocked logic in FE for actually processing the transaction at that date
        - for BE, this wouldn't be a problem, but in FE we can just fake it, by checking if the date is today or later, and then just marking it as completed, but at the date it should been processed

# search
## smartness


Here are key widgets a bank user might want on their dashboard:

# Financial Overview
- Total balance across all accounts
- Net worth summary
- Spending vs. income trend

# Quick Actions
- Transfer money
- Pay bills
- Send instant payment
- Deposit check

# Account Insights
- Recent transactions
- Unusual spending alerts
- Credit score snapshot

# Goal Tracking
- Savings progress
- Investment performance
- Debt reduction tracker

# Personalized Recommendations
- Potential savings opportunities
- Investment suggestions
- Credit card or loan offers

# Bill and Subscription Management
- Upcoming bill due dates
- Subscription cost summary
- Recurring payment tracker

# Security Corner
- Account security status
- Recent login activities
- Fraud protection updates

Each widget aims to provide immediate, actionable financial information that helps users manage their money effectively.