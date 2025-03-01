# BUGS
- ✔️We should not show widgets, which require the product, in the search results
  - We only show the workflow to get the widget, and once you have the product, we show the widget instead of the workflow
- I can still see the workflow for swish, even though you have it
- modal primary buttons keeps their last workflow text, we need to reset it when closing

# TODO

# menu
## theme pages
## pages
### home
- What more do we want to show on the home page?
### accounts
- show a more dedicated page with more information about the account
- show a list of transactions
- show a list of upcoming payments

# widgets
## accounts✔️
- show a total of the upcoming payments on each account
- ✔️clicking an account should fold down and show a few more transactions and a button to go to the account page
### smartness
- check if there is any upcoming payment that will make the account go negative
## expenses
- Should show some insights about the expenses
- Should show a list of expenses
## new products
- a widget that shows new products
- clicking a product shows more information about the product (workflow)
- ✔️finishing the workflow should add the product/widget to the page


### swish✔️
- We need to think about how the swish widget should look like, because it is a phone app

# workflows
## kyc
## transfer✔️
- ✔️should create transactions
  - ✔️we need a transaction repository
    - a transaction can be upcoming or completed
    - a transaction can be recurring
      - We want this to be a checkbox on the transfer workflow
      - this will require some mocked logic in FE for actually processing the transaction at that date
        - for BE, this wouldn't be a problem, but in FE we can just fake it, by checking if the date is today or later, and then just marking it as completed, but at the date it should been processed

# search
- clicking the input field should show a potential list in this order:✔️
    - popular services that you don't have✔️
    - missing popular widgets on this page
- Should search in theme pages✔️
- all widgets✔️
- all workflows✔️
- clicking a theme item, should switch to that page
## smartness
- ✔️popular services that you don't have
