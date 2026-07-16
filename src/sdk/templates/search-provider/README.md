# Search Provider Extension Template

This template demonstrates how to create a Search Provider extension.

## Architecture
Like widgets, this does not have a main window. It registers as a search provider which the `SearchService` invokes when the user queries Spotlight Search or the start menu.

## Concepts demonstrated
- Defining a `SearchProvider` extension
- Returning structured search results
- Defining an `action` callback for when a user selects a result
