# SlickGrid - A lightning fast JavaScript grid/spreadsheet

## Welcome to SlickGrid

Find documentation and examples in [the original wiki](https://github.com/mleibman/SlickGrid/wiki) and [this clone's wiki](https://github.com/GerHobbelt/SlickGrid/wiki).
This is a fork of SlickGrid maintained by Ger Hobbelt / Visyond Inc. The new features that have been added / mixed in:

## This Fork's Features

* This is synced with the 6pac slickgrid repo: @6pac is maintaining his own clone as a separate 'alternative master'. Check [his wiki](https://github.com/6pac/SlickGrid/wiki) for details.
* Cells spanning arbitrary numbers of rows and/or columns (colspan / rowspan)
* A footer row that mimics the behavior of the header row, with similar options and controls.
* Enhanced info feed to/from Formatters and Editors
* Formatters can now change/augment the cell's CSS classes (no more need for SPAN or DIV in cell plus fixup CSS to apply styling to *entire* cell)
* Indirect data addressing via DataView
* Formatters and Editors adapted for the above
* Internal and external Copy/Cut/Paste through the usual keyboard shortcuts
* Mouse & Touch support
* `grid.updateColumnWidths()` API: very significant performance improvement; pull request with notes [here](https://github.com/mleibman/SlickGrid/pull/897)
* `headerRow` renamed to `subHeader`. The old name was confusing. TODO: This means the name of related options has changed, too. (I (= @SimplGy) was uncomfortable with the proliferation of names like `header`, `headerScroller`, and `headerRow`.)
* Adds some methods that make it more performant to do auto column resizing and exposes some methods that make it easier to work with multiple grid instances.
  * `grid.updateColumnWidths(columnDefinitions)`: Using this method improves the performance of changing the width of one or more grid columns by a lot. The existing API only allows for a whole grid redraw, which can be very slow. Pull request with notes [here](https://github.com/mleibman/SlickGrid/pull/897). Use cases for fast column size adjustment may be: auto-sizing columns to fit content, responsive sizing cells to fill the screen, and similar. 
  * Also exposes the existing method `grid.setupColumnResize`, which allows you to re-enable column resizing if you're manually screwing around with the headers.
  * `grid.getId()` lets you get the uid of the grid instance
  * `grid.isGroupNode(row, cell)` lets you check if a node is part of a group row
* Triggers existing event `onColumnsResized` when you change the column widths
* Triggers a new event `onColumnsChanged` when you set the columns
* Exposes the existing method `grid.setupColumnResize()`, which allows you to re-enable column resizing if you're manually screwing around with the headers.
* Some new options on `setColumns` and `resizeCanvas` let you prevent some of the expensive calculations, useful if you're doing them yourself externally.
* Adds [antiscroll](https://github.com/learnboost/antiscroll) compatability to enable a uniform, OSX-style scrolling experience across browsers. Enable antiscroll by including the antiscroll library on your page, and passing the `useAntiscroll: true` option to your SlickGrid instance. By default we don't show scrollbars until the user begins scrolling (to mimic the way OSX does it); to change that behavior, you can set the `showScrollbarsOnHover` option.
* Adds `skipPaging` option to prevent slickgrid from paging when user keypress takes the user off the current page. Instead, up & down keypresses reveal one new row at a time.


### Message by Michael Leibman (@mleibman)

**UPDATE:  March 5th, 2014 - I have too many things going on in my life right now to really give SlickGrid support and development the time and attention it deserves.  I am not stopping it, but I will most likely be unresponsive for some time.  Sorry.**

## SlickGrid is an advanced jQuery grid/spreadsheet component

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
* add row/column pinning according to the new flexible design
  * allow grids to show without separate headers & footers: those must become part of the canvas itself
  * support CSS3 box-model (so that special more or less custom edge styles don't impact cell size: keeping cell position calculations simple and per-cell CSS agnostic)
  * add row and column folding & sliding support: if column headers also are part of the canvas itslef, then rows and columns are equal citizens that way and we can design one way to 'pin' (i.e. 'left limit' and/or 'right limit') columns and/or rows: one mechanism to recalculate the cell positions given pin settings (left limit, right limit, visiblity priority level)
  * fix remaining problems:
    + drag/resize handles and their (jQuery!) events are now part of the canvas, which goes counter to the original MLeibman design concept of keeping jQuery out of there
    + drag/resize handles now don't always stick to the right edge of a cell: when it is (partly) overlapped by a higher priority pinned cell, we need to decide what we want we want to do re drag/resize UX here: should the right/bottom?/top?/left? edge be visible before we accept a drag/resize operation?
    + how to place overlays on top of cells so that they are not clipped by the canvas edge?
    + row/colspanning cells are a horror: suppose a middle column of a 3 column spanning cell gets pinned! ==> does that colspanning cell get pinned in its entirety or doesn't it? What if the left or right column of the spanning cell is pinned? How do we visualize this cell in the light of column pinning priority levels: when the spanning cell is said to 'belong' to a top priority pinned column, despite spanning multiple columns, then the visuals will be rather ugly as the spanning cell will then 'stick out' as it is forced on top with the other cells in that top priority column.
    + What to do with too many pinned columns i.e. when the 'total pinned width' is larger than than the available viewport width? This is where 'pinning priority levels' come in, but that also means we have a complex rule for 'who shifts behind whom when space gets tight and the user scrolls'...
    + The *active cell* may be a cell, including any cell which is not pinned. Given that we can pin columns to the left and right (to facilitate LTR and RTL displays, but the same applies to row-level use cases where summary rows are 'footer' pin candidates versus label rows which are 'header' pin candidates), do we have to ensure that the active cell is always visible (and thus accessible)? And since I suppose we do, is that active cell to be shown in its entirety at all times, even when it happens to be very wide and/or high? Or do we accept a situation where you can reach a *part* of the active cell, enough to click on it / focus on it and have an 'external' editor pop up? Do we scroll the active cell into view (yes, we do) and then adjust its scroll position when the left and/or right pinned crowd is getting very wide, i.e. do we adjust the viewport scroll position to enable the maximum amount of pinned columns to be visible while also showing as much as possible of the currently active cell?
    
