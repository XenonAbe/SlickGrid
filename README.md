# DataSplice SlickGrid Fork

* uses a deferred editor interface, so editors can validate, get, set, commit, etc asynchronously.
* dependencies on jquery ui have been removed, stubbed out the only hard depencency (_.keyCode) in the
`slick.editors.js` file.
* merged in features from https://github.com/JLynch7/SlickGrid/tree/2.0-frozenRowsAndColumns for
frozen column support
* tracking mleibman's master
* installable via bower

# Welcome to SlickGrid

For now, please check out [the wiki](/mleibman/SlickGrid/wiki).

## SlickGrid is an advanced JavaScript grid/spreadsheet component

Some highlights:

* Adaptive virtual scrolling (handle hundreds of thousands of rows with extreme responsiveness)
* Extremely fast rendering speed
* Supports jQuery UI Themes
* Background post-rendering for richer cells
* Configurable & customizable
* Full keyboard navigation
* Column resize/reorder/show/hide
* Column autosizing & force-fit
* Pluggable cell formatters & editors
* Support for editing and creating new rows.
* Grouping, filtering, custom aggregators, and more!
* Advanced detached & multi-field editors with undo/redo support.
* “GlobalEditorLock” to manage concurrent edits in cases where multiple Views on a page can edit the same data.
* Support for [millions of rows](http://stackoverflow.com/a/2569488/1269037)
