# SlickGrid - A lightning fast JavaScript grid/spreadsheet

## Welcome to SlickGrid

Find documentation and examples in [the original wiki](https://github.com/mleibman/SlickGrid/wiki) and [this clone's wiki](https://github.com/GerHobbelt/SlickGrid/wiki).
This is a fork of SlickGrid maintained by Ger Hobbelt / Visyond Inc. The new features that have been added / mixed in:

## This Fork's Features

* Cells spanning arbitrary numbers of rows and/or columns (colspan / rowspan)
* A footer row that mimics the behavior of the header row, with similar options and controls.
* Enhanced info feed to/from Formatters and Editors
* Formatters can now change/augment the cell's CSS classes (no more need for SPAN or DIV in cell plus fixup CSS to apply styling to *entire* cell)
* Indirect data addressing via DataView
* Formatters and Editors adapted for the above
* Internal and external Copy/Cut/Paste through the usual keyboard shortcuts
* Mouse & Touch support
* `grid.updateColumnWidths()` API: very significant performance improvement; pull request with notes [here](https://github.com/mleibman/SlickGrid/pull/897)
* `grid.getId()` lets you get the uid of the grid instance
* Triggers existing event `onColumnsResized` when you change the column widths
* Triggers a new event `onColumnsChanged` when you set the columns
* Exposes the existing method `grid.setupColumnResize()`, which allows you to re-enable column resizing if you're manually screwing around with the headers.
* Some new options on `setColumns` and `resizeCanvas` let you prevent some of the expensive calculations, useful if you're doing them yourself externally.



This fork adds the following method:

```
grid.updateColumnWidths(columnDefinitions)
```

Using this method improves the performance of changing the width of one or more grid columns by a lot. The existing API only allows for a whole grid redraw, which can be very slow. Pull request with notes [here](https://github.com/mleibman/SlickGrid/pull/897). Use cases for fast column size adjustment may be: auto-sizing columns to fit content, responsive sizing cells to fill the screen, and similar. 

Also exposes the existing method `grid.setupColumnResize`, which allows you to re-enable column resizing if you're manually screwing around with the headers.



### Message by Michael Leibman (@mleibman)

**UPDATE:  March 5th, 2014 - I have too many things going on in my life right now to really give SlickGrid support and development the time and attention it deserves.  I am not stopping it, but I will most likely be unresponsive for some time.  Sorry.**

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


## TODO

* extend the set of unit tests for DataView to help test grouping behaviour (which currently has bugs) and indirect access
* extend set of examples, including external keyboard driver (e.g. keymaster.js)
* 'pace' the new delayed render activity, etc. using an external 'clock': now everything is running on individual setTimeout()s and userland code needs more control over when these fire exactly.
* enable Copy/Cut/Paste via externally triggered event or API call (so you can execute those commands from external controls)
* integrate the fixed-row/column work by JLynch7; that merge branch is currently botched -- EDIT: do not do this; see https://github.com/mleibman/SlickGrid/issues/1033 (#1033)
* unify Formatters and Editors' API in terms of info passed
* using jsperf and tests/*.html performance measurements to check current performance and possibly improve it -- EDIT: already did a lot in the render code
* update wiki with API changes re Formatters and Editors
* run script / tool to extract/update contributor/author list

