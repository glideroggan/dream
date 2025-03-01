# BUGS
- modal primary buttons keeps their last workflow text, we need to reset it when closing

# TODO
- turn the theme pages into pages
content-component is more of the home-page-component now, and later we should create more theme pages so we need to think about
some router logic for this, where we change "page" and instead have the router component in the bottom

# menu
## theme pages
## pages
### accounts
- show a more dedicated page with more information about the account
- show a list of transactions
- show a list of upcoming payments

# widgets
## accounts✔️
- show a total of the upcoming payments on each account
- clicking an account should fold down and show a few more transactions and a button to go to the account page
### smartness
- check if there is any upcoming payment that will make the account go negative
## expenses
- Should show some insights about the expenses
- Should show a list of expenses
## new products
- a widget that shows new products
- clicking a product shows more information about the product (workflow)
- finishing the workflow should add the product/widget to the page


### swish

# workflows
## open account✔️
## kyc
## transfer✔️
## get swish🔧

# search
- clicking the input field should show a potential list in this order:✔️
    - popular services that you don't have
    - missing popular widgets on this page
- Should search in theme pages✔️
- all widgets✔️
- all workflows✔️
- clicking a theme item, should switch to that page
## smartness
- popular services that you don't have

## Implementation details
The search functionality now:
1. Registers search items from:
   - Theme pages in the sidebar component
   - Widgets
   - Workflows

2. Search results show different types (theme, widget, workflow) with visual distinction

3. When clicking a result:
   - Theme: navigates to that page
   - Widget: focuses on the widget or navigates to its page
   - Workflow: starts the workflow

4. Next steps:
   - Add ranking algorithm to prioritize most relevant results
   - Implement search history
   - Add keyboard navigation for search results
   - Create additional widget examples