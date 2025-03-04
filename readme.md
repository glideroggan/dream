# BUGS
- when you add the swish widget, you can't remove it until you reload, or switch page
- dismiss the search result with esc
- ✔️dismiss a workflow with esc
  - ✔️we don't have the correct focus
  - ✔️we 'had' several modals, we should only have one

# TODO
- should we change the name? widgets are the MFE equivalent, while same component, but with -at-a-glance, is the widget?
  or should each widget have two states, one full-size, and one at-a-glance? so that you can always minimize each section, and if you minimize all, you get the at-a-glance view?
- account info workflow, needs an empty/default state when no account is selected
- being able to save workflows
  I might be on page 3, and want to pause/save to do something else
  and have the ability to continue later
- add tests to already built
  - components
  - services
  - repositories

## workflows
- edit payment contacts
  Doesn't need to be a "page", can just be a workflow, showing different buttons for doing things
    - edit
    - add
    - remove
  Once done, it goes away
  - maybe pinnable?
## mfes/widgets
  
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
  


# Worksflows (explain how the work with the modal, base and manager)
Looks like there are different events
workflow-complete: emitted by workflow-base, no one seems to listen to this
workflow-completed
workflowComplete: emitted by modal, catched by workflow-manager, to be used when multiple workflows are in the same modal
Which one should we use? and why are there different ones?

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
- ✔️more details on a specific account, implement the three dots
- show a total of the upcoming payments on each account
- accounts needs to look into upcoming transactions, so that we can show the total amount of upcoming payments
### account details
- Where should we show this?
  it opens today in a modal, which is fine, but that means we should add another type, not a workflow, but an info?
### smartness
- check if there is any upcoming payment that will make the account go negative
## expenses
- Should show some insights about the expenses
- Should show a list of expenses
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
