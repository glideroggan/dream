# BUGS
- modal primary buttons keeps their last workflow text, we need to reset it when closing

# widgets
## accounts✔️
## expenses
- Should show some insights about the expenses
- Should show a list of expenses

# workflows
## open account✔️
## kyc
## transfer✔️
## get swish

# search
- clicking the input field should show a potential list in this order:✔️
    - popular services that you don't have
    - missing popular widgets on this page
- Should search in theme pages✔️
- all widgets
- all workflows
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