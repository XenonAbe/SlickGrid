/**
 * @license
 * (c) 2009-2013 Michael Leibman
 * michael{dot}leibman{at}gmail{dot}com
 * http://github.com/mleibman/slickgrid
 *
 * Distributed under MIT license.
 * All rights reserved.
 *
 * SlickGrid v2.2
 *
 * NOTES:
 *     Cell/row DOM manipulations are done directly bypassing jQuery's DOM manipulation methods.
 *     This increases the speed dramatically, but can only be done safely because there are no event handlers
 *     or data associated with any cell/row DOM nodes.  Cell editors must make sure they implement .destroy()
 *     and do proper cleanup.
 */

// make sure required JavaScript modules are loaded
if (typeof jQuery === "undefined") {
  throw "SlickGrid requires jquery module to be loaded";
}
if (!jQuery.fn.drag) {
  throw "SlickGrid requires jquery.event.drag module to be loaded";
}
if (typeof Slick === "undefined") {
  throw "slick.core.js not loaded";
}


(function ($) {
  // Slick.Grid
  $.extend(true, window, {
    Slick: {
      Grid: SlickGrid
    }
  });

  // shared across all grids on the page
  var scrollbarDimensions;
  var maxSupportedCssHeight;  	// browser's breaking point
  var isBrowser;				// browser info to be used for those very special browser quirks & ditto hacks where feature detection doesn't cut it

  //////////////////////////////////////////////////////////////////////////////////////////////
  // SlickGrid class implementation (available as Slick.Grid)

  /**
   * Creates a new instance of the grid.
   * @class SlickGrid
   * @constructor
   * @param {Node}              container   Container node to create the grid in.
   * @param {Array,Object}      data        An array of objects for databinding.
   * @param {Array}             columns     An array of column definitions.
   * @param {Object}            options     Grid options.
   *
   * [KCPT] SlickGrid 2.1
   *  data: Array of data items or an object which implements the data-access functions
   *    {Array} of data items, each item has the following:
   *      id:         {String}    A unique ID for the item
   *      Other properties as indicated by the 'field' entries of the columns array.
   *      For instance, if one of the columns specifies a field value of 'name',
   *      then each item of the data array should have a 'name' property.
   *    {Object} implementing the data-access functions:
   *      getLength()         Returns the number of data items (analogous to data.length)
   *      getItem(i)          Returns the ith data item (analogous to data[i])
   *      getItemMetadata(row, cell)
   *                          Returns the metadata for the given row index.
   *                          `cell` may be FALSE or an index number of the cell currently
   *                          receiving attention -- this is handy when the metadata is
   *                          generated on the fly and the grid is very large/complex,
   *                          i.e. it is costly to cache all row/column metadata.
   *    Slick.DataView is an example of an Object which provides this API. It is essentially
   *    a wrapper around an {Array} of data items which provides additional data manipulation
   *    features, such as filtering and sorting.
   *
   *  columns: Array of objects which specify details about the columns
   *      id:                 {String}    A unique ID for the column
   *      name:               {String}    The name of the column, displayed in column header cell
   *      field:              {String}    The name of the data item property to be displayed in this column
   *      width:              {Number}    The width of the column in pixels
   *      minWidth:           {Number}    The minimum width of the column
   *      maxWidth:           {Number}    The maximum width of the column
   *      cssClass:           {String}    The name of the CSS class to use for cells in this column
   *      formatter:          {Function}  formatter(rowIndex, colIndex, cellValue, colInfo, rowDataItem, cellMetaInfo) for grid cells
   *      headerFormatter:    {Function}  formatter(rowIndex, colIndex, cellValue, colInfo, rowDataItem, cellMetaInfo) for header cells
   *      headerRowFormatter: {Function}  formatter(rowIndex, colIndex, cellValue, colInfo, rowDataItem, cellMetaInfo) for headerRow cells (option.showHeaderRow)
   *      editor:             {Function}  The constructor function for the class to use for editing of grid cells
   *      validator:          {Function}  A function to be called when validating user-entered values
   *      cannotTriggerInsert:{Boolean}
   *      resizable:          {Boolean}   Whether this column can be resized
   *      selectable:         {Boolean}   Whether this column can be selected
   *      sortable:           {Boolean}   Whether the grid rows can be sorted by this column
   *
   *  options: Object with additional customization options
   *      explicitInitialization:
   *                          {Boolean}   Defers initialization until the client calls the
   *                                      grid.init() method explicitly. Supports situations in
   *                                      which SlickGrid containers may not be in the DOM at creation.
   *      rowHeight:          {Number}    Height of each row in pixels
   *      autoHeight:         {Boolean}   (?) Don't need vertical scroll bar
   *      defaultColumnWidth: {Number}    Default column width for columns that don't specify a width
   *      enableColumnReorder:{Boolean}   Can columns be reordered?
   *      enableAddRow:       {Boolean}   Can rows be added?
   *      leaveSpaceForNewRows:{Boolean}  Should space be left for a new/data entry row at bottom?
   *      showTopPanel:       {Boolean}   Should the top panel be shown?
   *      topPanelHeight:     {Number}    Height of the top panel in pixels
   *      showHeaderRow:      {Boolean}   Should the extra header row be shown?
   *      headerRowHeight:    {Number}    Height of the header row in pixels
   *      enableCellNavigation:{Boolean}  Should arrow keys navigate between cells?
   *      enableTextSelectionOnCells:
   *                          {Boolean}   Should text selection be allowed in cells? (This is MSIE specific; other browsers always assume 'true')
   *      forceFitColumns:    {Boolean}   Should column widths be automatically resized to fit?
   *      syncColumnCellResize:{Boolean}  Should the grid width be changed dynamically during a drag
   *                                      to change column widths, or only once the mouse is released?
   *      dataItemColumnValueExtractor(item, columnDef, rowMetadata, columnMetadata):
   *                          {Function}  If present, will be called to retrieve a data value from the
   *                                      specified item for the corresponding column.
   *                                      Analogous to item[columnDef.field], where item is analogous to data[i].
   *      formatterFactory:   {Object}    If present, its getFormatter(column, row) method will be called
   *                                      to retrieve a formatter for the specified cell
   *      selectedCellCssClass:{Object?}  (?)Object used to specify CSS class for selected cells
   *      cellFlashingCssClass:{Object?}  (?)Object used to specify CSS class for flashing cells
   *      enableAsyncPostRender:{Boolean}
   *      asyncPostRenderDelay:{Number}   Delay passed to setTimeout in milliseconds
   *      editable:           {Boolean}   Is editing table cells supported?
   *      autoEdit:           {Boolean}   (?)Should editing be initiated automatically on click in cell?
   *      editorFactory:      {Object}    If present, its getEditor(columnInfo, row, cell) method will be called
   *                                      to retrieve an editor for the specified cell,
   *                                      unless column.editor is specified, which will be used.
   *      editorLock:         {Object}    a Slick.EditorLock instance; the default NULL will make SlickGrid use the Slick.GlobalEditorLock singleton
   *      asyncEditorLoading: {Boolean}   Should editors be loaded asynchronously?
   *      asyncEditorLoadDelay:{Number}   Delay passed to setTimeout in milliseconds
   *      editCommandHandler: {Function}  editCommandHandler(item, column, editCommand) is called from
   *                                      the commitCurrentEdit() function, where it can be used to
   *                                      implement undo/redo, for instance.
   *      fullWidthRows:      {Boolean}   If true, rows are sized to take up the available grid width.
   *      multiColumnSort:    {Boolean}   If true, rows can be sorted by multiple columns.
   *      defaultFormatter:   {Function}  Default function for converting cell values to strings.
   *      defaultEditor:      {Function}  Default function for editing cell values.
   *      defaultHeaderFormatter: {Function}
   *                                      The Slick.Formatters compatible cell formatter used to render the header cell.
   *      defaultHeaderRowFormatter: {Function}
   *                                      The Slick.Formatters compatible cell formatter used to render the headerRow cell.
   *                                      The 'headerRow' is the header row shown by SlickGrid when the `option.showHeaderRow` is enabled.
   *      forceSyncScrolling: {Boolean}   If true, renders more frequently during scrolling, rather than
   *                                      deferring rendering until default scroll thresholds are met.
   *      addNewRowCssClass:  {String}    specifies CSS class for the extra bottom row: 'add new row'
   * [/KCPT]
   **/
  function SlickGrid(container, data, columns, options) {
    // settings
    var defaults = {
      explicitInitialization: false,
      rowHeight: 25,
      defaultColumnWidth: 80,
      enableAddRow: false,
      leaveSpaceForNewRows: false,
      editable: false,
      autoEdit: true,
      enableCellNavigation: true,
      enableColumnReorder: true,
      asyncEditorLoading: false,
      asyncEditorLoadDelay: 100,
      forceFitColumns: false,
      enableAsyncPostRender: false,
      asyncPostRenderDelay: 50,
      autoHeight: false,
      editorLock: Slick.GlobalEditorLock,
      showHeaderRow: false,
      headerRowHeight: 25,
      showTopPanel: false,
      topPanelHeight: 25,
      formatterFactory: null,
      editorFactory: null,
      formatterOptions: {},
      editorOptions: {},
      cellFlashingCssClass: "flashing",
      selectedCellCssClass: "selected",
      multiSelect: true,
      enableTextSelectionOnCells: true,
      dataItemColumnValueExtractor: null,
      fullWidthRows: false,
      multiColumnSort: false,
      defaultFormatter: defaultFormatter,
      defaultEditor: null,
      defaultHeaderFormatter: defaultHeaderFormatter,
      defaultHeaderRowFormatter: defaultHeaderRowFormatter,
      forceSyncScrolling: false,
      addNewRowCssClass: "new-row",
      syncColumnCellResize: false,
      editCommandHandler: null,
      clearCellBeforeEdit: true
    };

    var columnDefaults = {
      name: "",
      resizable: true,
      sortable: false,
      minWidth: 30,
      rerenderOnResize: false,
      headerCssClass: null,
      defaultSortAsc: true,
      focusable: true,
      selectable: true,
      dataItemColumnValueExtractor: null
    };

    // scroller
    var virtualTotalHeight;   // virtual height
    var scrollableHeight;     // real scrollable height
    var pageHeight;           // page height
    var numberOfPages;        // number of pages
    var jumpinessCoefficient; // "jumpiness" coefficient

    var page = 0;           // current page
    var pageOffset = 0;     // current page offset
    var vScrollDir = 1;

    // private
    var initialized = false;
    var $container;
    var uid = "slickgrid_" + Math.round(1000000 * Math.random());
    var self = this;
    var $focusSink, $focusSink2;
    var $headerScroller;
    var $headers;
    var $headerRow, $headerRowScroller, $headerRowSpacer;
    var $topPanelScroller;
    var $topPanel;
    var $viewport;
    var $canvas;
    var $style;
    var $boundAncestors;
    var $headerParents;
    var stylesheet, columnCssRulesL, columnCssRulesR;
    var viewportH, viewportW;
    var canvasWidth;
    var viewportHasHScroll, viewportHasVScroll;
    var headerColumnWidthDiff = 0, headerColumnHeightDiff = 0, // border+padding
        cellWidthDiff = 0, cellHeightDiff = 0;
    var cellMetrics;
    var absoluteColumnMinWidth;

    var tabbingDirection = 1;
    var activePosY;
    var activePosX;
    var activeRow, activeCell;
    var activeCellNode = null;
    var currentEditor = null;
    var serializedEditorValue;
    var editController = null;

    var rowsCache = {};
    var rowPositionCache = {};
    var cellSpans = [];
    var renderedRows = 0;
    var numVisibleRows;
    var prevScrollTop = 0;
    var scrollTop = 0;
    var lastRenderedScrollTop = 0;
    var lastRenderedScrollLeft = 0;
    var prevScrollLeft = 0;
    var scrollLeft = 0;

    var selectionModel;
    var selectedRows = [];

    var plugins = [];
    var cellCssClasses = {};

    var columnsById = {};
    var sortColumns = [];
    var columnPosLeft = [];      // this cache array length is +1 longer than columns[] itself as we store the 'right edge + 1 pixel' as the 'left edge' of the first column beyond the grid width just as it would have been anyway. This simplifies the rest of the code.
    //var columnPosRight = [];


    // async call handles
    var h_editorLoader = null;
    var h_render = null;
    var h_postrender = null;
    var postProcessedRows = {};
    var postProcessToRow = null;
    var postProcessFromRow = null;

    // perf counters
    var counter_rows_rendered = 0;
    var counter_rows_removed = 0;

    var hasNestedColumns = false;
    var nestedColumns = null;

    // These two variables work around a bug with inertial scrolling in Webkit/Blink on Mac.
    // See http://crbug.com/312427.
    var rowNodeFromLastMouseWheelEvent;  // this node must not be deleted while inertial scrolling
    var zombieRowNodeFromLastMouseWheelEvent;  // node that was hidden instead of getting deleted


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Initialization

    function init() {
      $container = $(container);
      if ($container.length < 1) {
        throw new Error("SlickGrid requires a valid container, " + container + " does not exist in the DOM.");
      }

      if (!columns || !columns.length) {
        columns = [{}];
      }

      if (typeof get_browser_info === 'undefined') {
        throw new Error("SlickGrid requires detect_browser.js to be loaded.");
      }
      if (!isBrowser) {
      	isBrowser = get_browser_info();
      	isBrowser.safari    = /safari/i.test(isBrowser.browser);
      	isBrowser.safari605 = isBrowser.safari && /6\.0/.test(isBrowser.version);
      	isBrowser.msie      = /msie/i.test(isBrowser.browser);
      }

      // calculate these only once and share between grid instances
      maxSupportedCssHeight = maxSupportedCssHeight || getMaxSupportedCssHeight();
      scrollbarDimensions = scrollbarDimensions || measureScrollbar();

      options = $.extend({}, defaults, options);
      validateAndEnforceOptions();
      columnDefaults.width = options.defaultColumnWidth;

      columnsById = {};

      columns = parseColumns(columns);

      // validate loaded JavaScript modules against requested options
      if (options.enableColumnReorder && !$.fn.sortable) {
        throw new Error("SlickGrid's 'enableColumnReorder = true' option requires jquery-ui.sortable module to be loaded");
      }

      editController = {
        commitCurrentEdit: commitCurrentEdit,
        cancelCurrentEdit: cancelCurrentEdit
      };

      $container
          .empty()
          .addClass("slickgrid-container ui-widget " + uid)
          .attr('role', 'grid');

      // set up a positioning container if needed
      if (!/relative|absolute|fixed/.test($container.css("position"))) {
        $container.css("position", "relative");
      }

      $focusSink = $("<div tabIndex='0' hideFocus='true' style='position:fixed;width:0;height:0;top:0;left:0;outline:0;'></div>").appendTo($container);

      $headerScroller = $("<div class='slick-header ui-state-default' style='overflow:hidden;position:relative;' />").appendTo($container);

      viewportW = parseFloat($.css($container[0], "width", true));

      var headersWidth = getHeadersWidth();

      $headerParents = $("<div/>").appendTo($headerScroller);
      $headerParents.width(headersWidth);

      $headers = $("<div class='slick-header-columns' style='left:-1000px;top:0;' role='row' />").appendTo($headerScroller);
      $headers.width(headersWidth);

      $headerRowScroller = $("<div class='slick-headerrow ui-state-default' style='overflow:hidden;position:relative;' />").appendTo($container);
      $headerRow = $("<div class='slick-headerrow-columns' />").appendTo($headerRowScroller);
      $headerRowSpacer = $("<div style='display:block;height:1px;position:absolute;top:0;left:0;'></div>")
        .css("width", getCanvasWidth() + scrollbarDimensions.width + "px")
        .appendTo($headerRowScroller);

      $topPanelScroller = $("<div class='slick-top-panel-scroller ui-state-default' style='overflow:hidden;position:relative;' />").appendTo($container);
      $topPanel = $("<div class='slick-top-panel' style='width:10000px' />").appendTo($topPanelScroller);

      if (!options.showTopPanel) {
        $topPanelScroller.hide();
      }

      if (!options.showHeaderRow) {
        $headerRowScroller.hide();
      }

      $viewport = $("<div class='slick-viewport' style='width:100%;overflow:auto;outline:0;position:relative;'>").appendTo($container);
      $viewport.css("overflow-y", options.autoHeight ? "hidden" : "auto");

      $canvas = $("<div class='grid-canvas' />").appendTo($viewport);

      $focusSink2 = $focusSink.clone().appendTo($container);

      if (!options.explicitInitialization) {
        finishInitialization();
      }
    }

    function finishInitialization() {
      if (!initialized) {
        initialized = true;

        viewportW = parseFloat($.css($container[0], "width", true));

        // header columns and cells may have different padding/border skewing width calculations (box-sizing, hello?)
        // calculate the diff so we can set consistent sizes
        measureCellPaddingAndBorder();

        // for usability reasons, all text selection in SlickGrid is disabled
        // with the exception of input and textarea elements (selection must
        // be enabled there so that editors work as expected); note that
        // selection in grid cells (grid body) is already unavailable in
        // all browsers except IE
        disableSelection($headers); // disable all text selection in header (including input and textarea)
        disableSelection($headerParents);

        if (!options.enableTextSelectionOnCells) {
          // disable text selection in grid cells except in input and textarea elements
          // (this is IE-specific, because selectstart event will only fire in IE)
          $viewport.bind("selectstart.ui", function (event) {
            return $(event.target).is("input,textarea");
          });
        }

        updateColumnCaches();
        createColumnHeaders();
        setupColumnSort();
        createCssRules();
        cacheRowPositions();
        resizeCanvas();
        bindAncestorScrollEvents();

        $container
            .bind("resize.slickgrid", resizeCanvas);
        $viewport
            //.bind("click", handleClick)
            .bind("scroll", handleScroll);
        $headerScroller
            .bind("contextmenu", handleHeaderContextMenu)
            .fixClick(handleHeaderClick, handleHeaderDblClick)
            .delegate(".slick-header-column", "mouseenter", handleHeaderMouseEnter)
            .delegate(".slick-header-column", "mouseleave", handleHeaderMouseLeave)
            .bind("draginit", handleHeaderDragInit)
            .bind("dragstart", handleHeaderDragStart)
            .bind("drag", handleHeaderDrag)
            .bind("dragend", handleHeaderDragEnd);
        $headerRowScroller
            .bind("scroll", handleHeaderRowScroll);
        $focusSink.add($focusSink2)
            .bind("keydown", handleKeyDown);
        $canvas
            .bind("keydown", handleKeyDown)
            .fixClick(handleClick, handleDblClick)
            .bind("contextmenu", handleContextMenu)
            .bind("draginit", handleDragInit)
            .bind("dragstart", {distance: 3}, handleDragStart)
            .bind("drag", handleDrag)
            .bind("dragend", handleDragEnd)
            .delegate(".slick-cell", "mouseenter", handleMouseEnter)
            .delegate(".slick-cell", "mouseleave", handleMouseLeave);

        // Work around http://crbug.com/312427.
        if (navigator.userAgent.toLowerCase().match(/webkit/) &&
            navigator.userAgent.toLowerCase().match(/macintosh/)) {
          $canvas.bind("mousewheel", handleMouseWheel);
        }
      } else if (!stylesheet) {
        // when a previous 'init' run did not yet use the run-time stylesheet data, we have to adjust the canvas while waiting for the browser to actually parse that style.
        resizeCanvas();
      }
      // report the user whether we are a complete success (truthy) or not (falsey):
      return !!stylesheet;
    }

    function isInitialized() {
      return initialized;
    }

    function registerPlugin(plugin) {
      plugins.unshift(plugin);
      plugin.init(self);
    }

    function unregisterPlugin(plugin) {
      for (var i = plugins.length; i >= 0; i--) {
        if (plugins[i] === plugin) {
          if (plugins[i].destroy) {
            plugins[i].destroy();
          }
          plugins.splice(i, 1);
          break;
        }
      }
    }

    function setSelectionModel(model) {
      if (selectionModel) {
        selectionModel.onSelectedRangesChanged.unsubscribe(handleSelectedRangesChanged);
        if (selectionModel.destroy) {
          selectionModel.destroy();
        }
      }

      selectionModel = model;
      if (selectionModel) {
        selectionModel.init(self);
        selectionModel.onSelectedRangesChanged.subscribe(handleSelectedRangesChanged);
      }
    }

    function getSelectionModel() {
      return selectionModel;
    }

    function getCanvasNode() {
      return $canvas[0];
    }

    function measureScrollbar() {
      var $c = $("<div style='position:absolute; top:-10000px; left:-10000px; width:100px; height:100px; overflow:scroll;'></div>").appendTo("body");
      var dim = {
        width: $c.width() - $c[0].clientWidth,
        height: $c.height() - $c[0].clientHeight
      };
      $c.remove();
      return dim;
    }

    // Return the pixel positions of the left and right edge of the column, relative to the left edge of the entire grid.
    function getColumnOffset(cell) {
      var l = columns.length;
      // Is the cache ready? If not, update it.
      if (columnPosLeft.length <= l) {
        updateColumnCaches();
        assert(columnPosLeft.length === l + 1);
      }
      assert(cell >= 0);
      assert(cell < columnPosLeft.length);
      return columnPosLeft[cell];
    }

    function getHeadersWidth() {
      var headersWidth = getColumnOffset(columns.length);
      headersWidth += scrollbarDimensions.width;
      return Math.max(headersWidth, viewportW) + 1000;
    }

    function getCanvasWidth() {
      var availableWidth = viewportHasVScroll ? viewportW - scrollbarDimensions.width : viewportW;
      var rowWidth = getColumnOffset(columns.length);
      return options.fullWidthRows ? Math.max(rowWidth, availableWidth) : rowWidth;
    }

    function updateCanvasWidth(forceColumnWidthsUpdate, forceCanvasResize) {
      var oldCanvasWidth = canvasWidth;
      canvasWidth = getCanvasWidth();

      // see https://github.com/mleibman/SlickGrid/issues/477
      viewportHasHScroll = (canvasWidth > viewportW - scrollbarDimensions.width);

      if (canvasWidth != oldCanvasWidth || forceCanvasResize) {
        $canvas.width(canvasWidth);
        $headerRow.width(canvasWidth);
        var headersWidth = getHeadersWidth();
        $headers.width(headersWidth);
        $headerParents.width(headersWidth);
        trigger(self.onCanvasWidthChanged, { width: canvasWidth });
      }

      $headerRowSpacer.width(canvasWidth + (viewportHasVScroll ? scrollbarDimensions.width : 0));

      // when 'stylesheet' has not been set yet, it means that any previous call to applyColumnWidths() did not use up to date values yet as the run-time generated stylesheet wasn't parsed in time.
      if (canvasWidth != oldCanvasWidth || forceColumnWidthsUpdate || forceCanvasResize || !stylesheet) {
        applyColumnWidths();
      }
    }

    function disableSelection($target) {
      if ($target && $target.jquery) {
        $target
            .attr("unselectable", "on")
            .css("MozUserSelect", "none")
            .bind("selectstart.ui", function () {
              return false;
            }); // from jquery:ui.core.js 1.7.2
      }
    }

    function getMaxSupportedCssHeight() {
      var supportedHeight = 1000000;
      // FF reports the height back but still renders blank after ~6M px
      var testUpTo = navigator.userAgent.toLowerCase().match(/firefox/) ? 6000000 : 1000000000;
      var div = $("<div style='display:none' />").appendTo(document.body);

      while (true) {
        var test = supportedHeight * 2;
        div.css("height", test);
        if (test > testUpTo || div.height() !== test) {
          break;
        } else {
          supportedHeight = test;
        }
      }

      div.remove();
      return supportedHeight;
    }

    // TODO:  this is static.  need to handle page mutation.
    function bindAncestorScrollEvents() {
      var elem = $canvas[0];
      while ((elem = elem.parentNode) != document.body && elem != null) {
        // bind to scroll containers only
        if (elem == $viewport[0] || elem.scrollWidth != elem.clientWidth || elem.scrollHeight != elem.clientHeight) {
          var $elem = $(elem);
          if (!$boundAncestors) {
            $boundAncestors = $elem;
          } else {
            $boundAncestors = $boundAncestors.add($elem);
          }
          $elem.bind("scroll." + uid, handleActiveCellPositionChange);
        }
      }
    }

    function unbindAncestorScrollEvents() {
      if (!$boundAncestors) {
        return;
      }
      $boundAncestors.unbind("scroll." + uid);
      $boundAncestors = null;
    }

    function updateColumnHeader(columnId, title, toolTip) {
      if (!initialized) { return false; }
      var idx = getColumnIndex(columnId);
      if (idx == null) {
        return false;
      }

      var columnDef = columns[idx];
      var $header = $headers.children().eq(idx);
      if ($header) {
        if (title !== undefined) {
          columnDef.name = title;
        }
        if (toolTip !== undefined) {
          columnDef.toolTip = toolTip;
        }

        var e = new Slick.EventData();
        trigger(self.onBeforeHeaderCellDestroy, {
          node: $header[0],
          column: columnDef,
          cell: idx
        }, e);
        if (e.isImmediatePropagationStopped()) {
          return false;
        }

        // TODO: RISK: when formatter produces more than ONE outer HTML element, we're toast with nuking the .eq(0) element down here:
        $header
            .attr("title", columnDef.toolTip || null)
            .children().eq(0).html(title);

        trigger(self.onHeaderCellRendered, {
          node: $header[0],
          column: columnDef,
          cell: idx
        });
        return true;
      }
      return false;
    }

    function getHeaderRow() {
      return $headerRow[0];
    }

    function getHeaderRowColumn(columnId) {
      var idx = getColumnIndex(columnId);
      var $header = $headerRow.children().eq(idx);
      return $header && $header[0];
    }

    function getHeadersColumn(columnId) {
      var idx = getColumnIndex(columnId);
      var $header = $headers.children().eq(idx);
      return $header && $header[0];
    }

    function mkSaneId(columnDef, cell) {
      s = '' + uid + '_c' + cell + '_' + columnDef.id;
      s = s.replace(/[^a-zA-Z0-9]+/g, '_');
      return s;
    }

    function extractCellFromDOMid(id) {
      // format of ID is: uid_c<cell>_<blah>
      var m = /_c(\d+)_/.exec(id);
      if (m[1] == null || m[1] == '') {
        return false;
      }
      return +m[1];
    }

    function createColumnHeaders() {
      function onMouseEnter() {
        $(this).addClass("ui-state-hover");
      }

      function onMouseLeave() {
        $(this).removeClass("ui-state-hover");
      }

      $headers.find(".slick-header-column")
        .each(function() {
          var columnDef = $(this).data("column");
          if (columnDef) {
            trigger(self.onBeforeHeaderCellDestroy, {
              node: this,
              column: columnDef
            });
          }
        });
      var headersWidth = getHeadersWidth();
      $headers.empty();
      $headers.width(headersWidth);
      $headerParents.empty();
      $headerParents.width(headersWidth);

      $headerRow.find(".slick-headerrow-column")
        .each(function() {
          var columnDef = $(this).data("column");
          if (columnDef) {
            trigger(self.onBeforeHeaderRowCellDestroy, {
              node: this,
              column: columnDef
            });
          }
        });
      $headerRow.empty();

      function createColumnHeader(m, appendTo, level, cell) {
        var colspan = getColumnColspan(m);
        var cellCss = ["ui-state-default", "slick-header-column", "level" + (level || 0), "colspan" + colspan];
        if (m.headerCssClass) cellCss.push(m.headerCssClass);
        var cellStyles = ["width:" + (m.width - headerColumnWidthDiff) + "px"];
        var info = {
          cellCss: cellCss,
          cellStyles: cellStyles,
          html: "",
          toolTip: m.toolTip || null,
          colspan: colspan,
          rowspan: 1,
          //cellHeight: cellHeight,
          //rowMetadata: rowMetadata,
          //columnMetadata: columnMetadata,
          columnHeader: {
            column: m,
            level: level,
            cell: cell
          }
        };
        info.html = getHeaderFormatter(-2000, cell)(-2000, cell, m.name, m, null /* rowDataItem */, info);
        var header = $("<div role='columnheader' />")
            .html(info.html)
            .attr("id", mkSaneId(m, i))
            .attr("title", info.toolTip)
            .data("column", m)
            .attr("style", cellStyles.length ? cellStyles.join(";") + ";" : null)
            .attr("class", cellCss.join(" "))
            .appendTo(appendTo);
        return header;
      }

      function getColumnColspan(m) {
        var colspan = 0;
        if (m.children) {
          for (var k = 0; k < m.children.length; k++) {
            colspan += getColumnColspan(m.children[k]);
          }
        } else {
          colspan = 1;
        }
        return colspan;
      }

      function createBaseColumnHeader(m, level, cell) {
        var header = createColumnHeader(m, $headers, level, cell);

        if (options.enableColumnReorder || m.sortable) {
          header
            .on('mouseenter', onMouseEnter)
            .on('mouseleave', onMouseLeave);
        }

        if (m.sortable) {
          header.addClass("slick-header-sortable");
          header.append("<span class='slick-sort-indicator' />");
        }

        trigger(self.onHeaderCellRendered, {
          node: header[0],
          column: m,
          cell: cell,
          level: level
        });

        if (options.showHeaderRow) {
          var cellCss = ["ui-state-default", "slick-headerrow-column", "l" + cell, "r" + cell];
          if (m.headerCssClass) cellCss.push(m.headerCssClass);
          var cellStyles = [];
          var info = {
            cellCss: cellCss,
            cellStyles: cellStyles,
            html: "",
            toolTip: m.headerRowToolTip || null,
            colspan: 1,
            rowspan: 1,
            //cellHeight: cellHeight,
            //rowMetadata: rowMetadata,
            //columnMetadata: columnMetadata,
            columnHeader: {
              column: m,
              level: level,
              cell: cell
            }
          };
          info.html = getHeaderRowFormatter(-1000, cell)(-1000, cell, m.initialHeaderRowValue, m, null /* rowDataItem */, info);
          var headerRowCell = $("<div></div>")
              .attr("title", info.toolTip)
              .data("column", m)
              .attr("style", cellStyles.length ? cellStyles.join(";") + ";" : null)
              .attr("class", cellCss.join(" "))
              .appendTo($headerRow);

          trigger(self.onHeaderRowCellRendered, {
            node: headerRowCell[0],
            column: m,
            cell: cell,
            level: level
          });
        }
      }

      if (hasNestedColumns) {
        for (var i = 0; i < nestedColumns.length; i++) {
          var $row;
          var isParent = false;
          var layer = nestedColumns[i];
          if (i + 1 < nestedColumns.length) {
            $row = $("<div class='slick-header-columns slick-header-parents level" + i +"' style='left:-1000px' />").appendTo($headerParents);
            isParent = true;
          }
          for (var j = 0; j < layer.length; j++) {
            var column = layer[j];
            if (isParent) {
              createColumnHeader(column, $row, i, j);
            } else {
              createBaseColumnHeader(column, i, j);
            }
          }
        }
      } else {
        for (var i = 0; i < columns.length; i++) {
          var m = columns[i];
          createBaseColumnHeader(m, 0, i);
        }
      }

      $headers.addClass('level' + (hasNestedColumns ? nestedColumns.length - 1 : 0));

      setSortColumns(sortColumns);
      setupColumnResize();
      if (options.enableColumnReorder) {
        setupColumnReorder();
      }
    }

    function setupColumnSort() {
      $headers.click(function (e) {
        if ($(e.target).hasClass("slick-resizable-handle")) {
          return;
        }

        var $col = $(e.target).closest(".slick-header-column");
        if (!$col.length) {
          return;
        }

        var column = $col.data("column");
        if (column.sortable) {
          if (!getEditorLock().commitCurrentEdit()) {
            return;
          }

          var sortOpts = null;
          var i = 0;
          for (; i < sortColumns.length; i++) {
            if (sortColumns[i].columnId == column.id) {
              sortOpts = sortColumns[i];
              sortOpts.sortAsc = !sortOpts.sortAsc;
              break;
            }
          }

          if ((e.metaKey || e.ctrlKey) && options.multiColumnSort) {
            if (sortOpts) {
              sortColumns.splice(i, 1);
            }
          }
          else {
            if ((!e.shiftKey && !e.metaKey && !e.ctrlKey) || !options.multiColumnSort) {
              sortColumns = [];
            }

            if (!sortOpts) {
              sortOpts = { columnId: column.id, sortAsc: column.defaultSortAsc };
              sortColumns.push(sortOpts);
            } else if (sortColumns.length == 0) {
              sortColumns.push(sortOpts);
            }
          }

          setSortColumns(sortColumns);

          if (!options.multiColumnSort) {
            trigger(self.onSort, {
              multiColumnSort: false,
              sortCol: column,
              sortAsc: sortOpts.sortAsc
            }, e);
          } else {
            trigger(self.onSort, {
              multiColumnSort: true,
              sortCols: $.map(sortColumns, function(col) {
                return {
                  sortCol: columns[getColumnIndex(col.columnId)],
                  sortAsc: col.sortAsc
                };
              })
            }, e);
          }
        }
      });
    }

    function setupColumnReorder() {
      if (!jQuery.isEmptyObject($.data( $headers, $headers.sortable.prototype.widgetFullName ))) {
        $headers.filter(":ui-sortable").sortable("destroy");
      }

      var columnScrollTimer = null;
      var viewportLeft = $viewport.offset().left;

      function scrollColumnsRight() {
        $viewport[0].scrollLeft = $viewport[0].scrollLeft + 10;
      }

      function scrollColumnsLeft() {
        $viewport[0].scrollLeft = $viewport[0].scrollLeft - 10;
      }

      $headers.sortable({
        containment: "parent",
        distance: 3,
        axis: "x",
        cursor: "default",
        tolerance: "intersection",
        helper: "clone",
        placeholder: "slick-sortable-placeholder ui-state-default slick-header-column",
        start: function (e, ui) {
          ui.placeholder.width(ui.helper.outerWidth() - headerColumnWidthDiff);
          trigger(self.onColumnsStartReorder, {e: e, ui: ui});

          $(ui.helper).addClass("slick-header-column-active");
        },
        beforeStop: function (e, ui) {
          $(ui.helper).removeClass("slick-header-column-active");
        },
        sort: function (e, ui) {
          trigger(self.onColumnsReordering, {e: e, ui: ui});

          if (e.originalEvent.pageX > $viewport[0].clientWidth) {
            if (!columnScrollTimer) {
              columnScrollTimer = setInterval(scrollColumnsRight, 100);
            }
          } else if (e.originalEvent.pageX < viewportLeft) {
            if (!columnScrollTimer) {
              columnScrollTimer = setInterval(scrollColumnsLeft, 100);
            }
          } else {
            clearInterval(columnScrollTimer);
            columnScrollTimer = null;
          }
        },
        stop: function (e, ui) {
          clearInterval(columnScrollTimer);
          columnScrollTimer = null;

          if (!getEditorLock().commitCurrentEdit()) {
            $(this).sortable("cancel");
            return;
          }

          var reorderedIds = $headers.sortable("toArray");
          var reorderedColumns = [];
          for (var i = 0; i < reorderedIds.length; i++) {
            var cell = extractCellFromDOMid(reorderedIds[i]);
            reorderedColumns.push(columns[cell]);
          }
          setColumns(reorderedColumns);

          trigger(self.onColumnsReordered, {e: e, ui: ui});
          e.stopPropagation();
          setupColumnResize();
        }
      });
    }

    function setupColumnResize() {
      var $col, j, c, pageX, columnElements, minPageX, maxPageX, firstResizable, lastResizable;
      columnElements = $headers.children();
      columnElements.find(".slick-resizable-handle").remove();
      columnElements.each(function (i, e) {
        assert(columns[i]);
        if (columns[i].resizable) {
          if (firstResizable === undefined) {
            firstResizable = i;
          }
          lastResizable = i;
        }
      });
      if (firstResizable === undefined) {
        return;
      }
      columnElements.each(function (i, e) {
        if (i < firstResizable || (options.forceFitColumns && i >= lastResizable)) {
          return;
        }
        $col = $(e);
        $("<div class='slick-resizable-handle' />")
            .appendTo(e)
            // [KCPT]
            // all touch support here added by KCPT.
            // increase touchable area on touch devices
            // see http://modernizr.github.com/Modernizr/touch.html for discussion of
            // this test as a means to determine that we're running on a touch platform.
            // We also increase the width of the resize area for the last column so that
            // it isn't entirely overlapped/hidden by the divider view.
            .css({ width: 'ontouchstart' in window ? 16 : (i === lastResizable ? 8 : 4) })
            // [\KCPT]
            .bind("dragstart touchstart", function (e, dd) {
              var j, c;
              if (!getEditorLock().commitCurrentEdit()) {
                return false;
              }
              pageX = e.pageX;
              $(this).parent().addClass("slick-header-column-active");
              var shrinkLeewayOnRight = null, stretchLeewayOnRight = null;
              assert(columns.length === columnElements.length);
              // lock each column's width option to current width
              columnElements.each(function (i, e) {
                columns[i].previousWidth = $(e).outerWidth();
              });
              if (options.forceFitColumns) {
                shrinkLeewayOnRight = 0;
                stretchLeewayOnRight = 0;
                // colums on right affect maxPageX/minPageX
                for (j = i + 1; j < columnElements.length; j++) {
                  c = columns[j];
                  assert(c);
                  if (c.resizable) {
                    if (stretchLeewayOnRight !== null) {
                      if (c.maxWidth) {
                        stretchLeewayOnRight += c.maxWidth - c.previousWidth;
                      } else {
                        stretchLeewayOnRight = null;
                      }
                    }
                    shrinkLeewayOnRight += c.previousWidth - Math.max(c.minWidth || 0, absoluteColumnMinWidth);
                  }
                }
              }
              var shrinkLeewayOnLeft = 0, stretchLeewayOnLeft = 0;
              for (j = 0; j <= i; j++) {
                // columns on left only affect minPageX
                c = columns[j];
                assert(c);
                if (c.resizable) {
                  if (stretchLeewayOnLeft !== null) {
                    if (c.maxWidth) {
                      stretchLeewayOnLeft += c.maxWidth - c.previousWidth;
                    } else {
                      stretchLeewayOnLeft = null;
                    }
                  }
                  shrinkLeewayOnLeft += c.previousWidth - Math.max(c.minWidth || 0, absoluteColumnMinWidth);
                }
              }
              if (shrinkLeewayOnRight === null) {
                shrinkLeewayOnRight = 100000;
              }
              if (shrinkLeewayOnLeft === null) {
                shrinkLeewayOnLeft = 100000;
              }
              if (stretchLeewayOnRight === null) {
                stretchLeewayOnRight = 100000;
              }
              if (stretchLeewayOnLeft === null) {
                stretchLeewayOnLeft = 100000;
              }
              maxPageX = pageX + Math.min(shrinkLeewayOnRight, stretchLeewayOnLeft);
              minPageX = pageX - Math.min(shrinkLeewayOnLeft, stretchLeewayOnRight);
              trigger(self.onColumnsStartResize, {e: e}); // onColumnsResizeStart
            })
            .bind("drag touchmove", function (e, dd) {
              var actualMinWidth, d = Math.min(maxPageX, Math.max(minPageX, e.pageX)) - pageX, x;
              var j, c;
              assert(columns.length === columnElements.length);
              if (d < 0) { // shrink column
                x = d;
                for (j = i; j >= 0; j--) {
                  c = columns[j];
                  assert(c);
                  if (c.resizable) {
                    actualMinWidth = Math.max(c.minWidth || 0, absoluteColumnMinWidth);
                    if (x && c.previousWidth + x < actualMinWidth) {
                      x += c.previousWidth - actualMinWidth;
                      c.width = actualMinWidth;
                    } else {
                      c.width = c.previousWidth + x;
                      x = 0;
                    }
                  }
                }

                if (options.forceFitColumns) {
                  x = -d;
                  for (j = i + 1; j < columnElements.length; j++) {
                    c = columns[j];
                    assert(c);
                    if (c.resizable) {
                      if (x && c.maxWidth && (c.maxWidth - c.previousWidth < x)) {
                        x -= c.maxWidth - c.previousWidth;
                        c.width = c.maxWidth;
                      } else {
                        c.width = c.previousWidth + x;
                        x = 0;
                      }
                    }
                  }
                }
              } else { // stretch column
                x = d;
                for (j = i; j >= 0; j--) {
                  c = columns[j];
                  assert(c);
                  if (c.resizable) {
                    if (x && c.maxWidth && (c.maxWidth - c.previousWidth < x)) {
                      x -= c.maxWidth - c.previousWidth;
                      c.width = c.maxWidth;
                    } else {
                      c.width = c.previousWidth + x;
                      x = 0;
                    }
                  }
                }

                if (options.forceFitColumns) {
                  x = -d;
                  for (j = i + 1; j < columnElements.length; j++) {
                    c = columns[j];
                    assert(c);
                    if (c.resizable) {
                      actualMinWidth = Math.max(c.minWidth || 0, absoluteColumnMinWidth);
                      if (x && c.previousWidth + x < actualMinWidth) {
                        x += c.previousWidth - actualMinWidth;
                        c.width = actualMinWidth;
                      } else {
                        c.width = c.previousWidth + x;
                        x = 0;
                      }
                    }
                  }
                }
              }
              applyColumnHeaderWidths();
              updateColumnCaches();
              if (options.syncColumnCellResize) {
                //applyColumnWidths(); -- happens already inside the next statement: updateCanvasWidth(true)
                updateCanvasWidth(true);
              }
              trigger(self.onColumnsResizing, {e: e});
            })
            .bind("dragend touchend", function (e, dd) {
              var newWidth, j, c;
              $(this).parent().removeClass("slick-header-column-active");
              assert(columns.length === columnElements.length);
              for (j = 0; j < columnElements.length; j++) {
                c = columns[j];
                assert(c);
                newWidth = $(columnElements[j]).outerWidth();

                if (c.previousWidth !== newWidth && c.rerenderOnResize) {
                  invalidateAllRows();
                }
              }
              updateCanvasWidth(true);
              handleScroll();
              render();
              trigger(self.onColumnsResized, {e: e});
            })
            .bind("dblclick", function(e) {
                var cell = extractCellFromDOMid($(this).parent().attr('id'));
                var columnDef = columns[cell];
                var aux_width = calculateWordDimensions(columnElements[cell].children[0].innerHTML).width;
                assert(columnDef.values === undefined);
                for (var row = 0, len = getDataLength(); row < len; row++) {
                    var rowDataItem = getDataItem(row);
                    var value = getDataItemValueForColumn(rowDataItem, columnDef);
                    aux_width = Math.max(aux_width, calculateWordDimensions(value.toString()).width);
                }
                columnDef.width = aux_width;

                // TODO: make autosize faster by introducing a bit of heuristic: longer raw string implies wider cell
                // TODO: apply the proper formatter so that we actually get what we will see when the cell is rendered for real

                applyColumnHeaderWidths();
                updateColumnCaches();
                updateCanvasWidth(true);
                render();
                trigger(self.onColumnsResized, {e: e, cell: cell, column: columnDef});
            });
      });
    }

    function calculateWordDimensions(text, escape) {
        if (escape === undefined) {
          escape = true;
        }

        var div = document.createElement('div');
        $(div).css({
            'position': 'absolute',
            'visibility': 'hidden',
            'height': 'auto',
            'width': 'auto',
            'white-space': 'nowrap',
            'font-family': 'Verdana, Arial, sans-serif',
            'font-size': '13px',
            'border': '1px solid transparent',
            'padding': '1px 4px 2px'
        });
        if (escape) {
          $(div).text(text);
        } else {
          div.innerHTML = text;
        }

        document.body.appendChild(div);

        var dimensions = {
          width: jQuery(div).outerWidth() + 30,
          height: jQuery(div).outerHeight()
        };

        div.parentNode.removeChild(div);

        return dimensions;
    }

    function getVBoxDelta($el) {
      var p = ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"];
      var delta = 0;
      $.each(p, function (n, val) {
        delta += parseFloat($el.css(val)) || 0;
      });
      return delta;
    }

    function measureCellPaddingAndBorder() {
      var el;
      var h = ["borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"];
      var v = ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"];
      cellMetrics = {};

      el = $("<div class='ui-state-default slick-header-column' style='visibility:hidden'>-</div>").appendTo($headers);
      headerColumnWidthDiff = headerColumnHeightDiff = 0;
      if (el.css("box-sizing") != "border-box" && el.css("-moz-box-sizing") != "border-box" && el.css("-webkit-box-sizing") != "border-box") {
        $.each(h, function (n, val) {
          headerColumnWidthDiff += parseFloat(el.css(val)) || 0;
        });
        $.each(v, function (n, val) {
          headerColumnHeightDiff += parseFloat(el.css(val)) || 0;
        });
      }
      el.remove();

      var r = $("<div class='slick-row' />").appendTo($canvas);
      el = $("<div class='slick-cell' id='' style='visibility:hidden'>-</div>").appendTo(r);
      cellWidthDiff = cellHeightDiff = 0;
      if (el.css("box-sizing") != "border-box" && el.css("-moz-box-sizing") != "border-box" && el.css("-webkit-box-sizing") != "border-box") {
        $.each(h, function (n, val) {
          cellMetrics[val] = parseFloat(el.css(val)) || 0;
          cellWidthDiff += cellMetrics[val];
        });
        $.each(v, function (n, val) {
          cellMetrics[val] = parseFloat(el.css(val)) || 0;
          cellHeightDiff += cellMetrics[val];
        });
      }
      r.remove();

      absoluteColumnMinWidth = Math.max(headerColumnWidthDiff, cellWidthDiff);
    }

    // See also github issue #223: stylesheet variable is undefined in Chrome
    //
    // This code is based on
    //     http://davidwalsh.name/add-rules-stylesheets
    function createCssRules() {
      $style = $("<style type='text/css' rel='stylesheet' />").appendTo($("head"));
      if ($style[0].styleSheet) { // IE
        $style[0].styleSheet.cssText = "";
      } else {
        // WebKit hack
        $style[0].appendChild(document.createTextNode(""));
      }

      // Add a media (and/or media query) here if you'd like!
      // $style[0].setAttribute("media", "screen")
      // $style[0].setAttribute("media", "@media only screen and (max-width : 1024px)")

      var sheet = $style[0].sheet;
      var rowHeight = options.rowHeight - cellHeightDiff;
      var rules = [
        [".slickgrid-container." + uid + " .slick-header-column", "left: 1000px"],
        [".slickgrid-container." + uid + " .slick-top-panel", "height: " + options.topPanelHeight + "px"],
        [".slickgrid-container." + uid + " .slick-headerrow-columns", "height: " + options.headerRowHeight + "px"],
        [".slickgrid-container." + uid + " .slick-cell", "height:" + rowHeight + "px"],
        [".slickgrid-container." + uid + " .slick-row", "height:" + options.rowHeight + "px"]
      ];

      for (var i = 0; i < columns.length; i++) {
        rules.push([".slickgrid-container." + uid + " .l" + i, ""]);
        rules.push([".slickgrid-container." + uid + " .r" + i, ""]);
      }

      // see also
      //   http://davidwalsh.name/add-rules-stylesheets
      if (sheet) {
        rules.forEach(function (d, i) {
          addCSSRule(sheet, d[0], d[1], i); /* i could have been -1 here as each rule can be appended at the end */
        });
      } else {
        throw new Error("run-time generated slickgrid rules could not be set up");
      }
    }

    function addCSSRule(sheet, selector, rules, index) {
        if (sheet.insertRule) {
            sheet.insertRule(selector + " {" + rules + "}", index);
        } else {
            sheet.addRule(selector, rules, index);
        }
    }

    // Return FALSE when the relevant stylesheet has not been parsed yet
    // (previously slickgrid would throw an exception for this!)
    // otherwise return the style reference.
    function getColumnCssRules(idx) {
      if (!stylesheet) {
        var sheets = document.styleSheets;
        for (var i = 0; i < sheets.length; i++) {
          if ((sheets[i].ownerNode || sheets[i].owningElement) == $style[0]) {
            stylesheet = sheets[i];
            break;
          }
        }

        if (!stylesheet) {
          console.log("########### Cannot find stylesheet.");
          return false;
          //throw new Error("Cannot find stylesheet.");
        }

        // find and cache column CSS rules
        columnCssRulesL = [];
        columnCssRulesR = [];
        var cssRules = (stylesheet.cssRules || stylesheet.rules);
        var matches, columnIdx;
        for (var i = 0; i < cssRules.length; i++) {
          var selector = cssRules[i].selectorText;
          if (matches = /\.l\d+/.exec(selector)) {
            columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
            columnCssRulesL[columnIdx] = cssRules[i];
          } else if (matches = /\.r\d+/.exec(selector)) {
            columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
            columnCssRulesR[columnIdx] = cssRules[i];
          }
        }
      }

      return {
        left: columnCssRulesL[idx],
        right: columnCssRulesR[idx]
      };
    }

    function removeCssRules() {
      $style.remove();
      $style = null;
      stylesheet = null;
    }

    function destroy() {
      getEditorLock().cancelCurrentEdit();

      trigger(self.onBeforeDestroy, {});

      var i = plugins.length;
      while (i--) {
        unregisterPlugin(plugins[i]);
      }

      if (options.enableColumnReorder) {
        $headers.filter(":ui-sortable").sortable("destroy");
      }

      unbindAncestorScrollEvents();
      $container.unbind(".slickgrid");
      removeCssRules();

      $canvas.unbind("draginit dragstart dragend drag");
      $container.empty().removeClass(uid);
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // General

    function trigger(evt, args, e) {
      e = e || new Slick.EventData();
      args = args || {};
      args.grid = self;
      return evt.notify(args, e, self);
    }

    function getEditorLock() {
      return options.editorLock;
    }

    /**
     * @return {EditController} return the SlickGrid internal EditController. The EditController is an object
     *         which provides two functions (methods) who are invoked by the EditorLock object when necessary:
     *             commitCurrentEdit: function() {...}
     *             cancelCurrentEdit: function() {...}
     */
    function getEditController() {
      return editController;
    }

    function getColumnIndex(id) {
      return columnsById[id];
    }

    function autosizeColumns() {
      var i, c,
          widths = [],
          shrinkLeeway = 0,
          total = 0,
          prevTotal,
          availWidth = viewportHasVScroll ? viewportW - scrollbarDimensions.width : viewportW;

      for (i = 0; i < columns.length; i++) {
        c = columns[i];
        widths.push(c.width);
        total += c.width;
        if (c.resizable) {
          shrinkLeeway += c.width - Math.max(c.minWidth, absoluteColumnMinWidth);
        }
      }

      // shrink
      prevTotal = total;
      while (total > availWidth && shrinkLeeway) {
        var shrinkProportion = (total - availWidth) / shrinkLeeway;
        for (i = 0; i < columns.length && total > availWidth; i++) {
          c = columns[i];
          var width = widths[i];
          if (!c.resizable || width <= c.minWidth || width <= absoluteColumnMinWidth) {
            continue;
          }
          var absMinWidth = Math.max(c.minWidth, absoluteColumnMinWidth);
          var shrinkSize = Math.floor(shrinkProportion * (width - absMinWidth)) || 1;
          shrinkSize = Math.min(shrinkSize, width - absMinWidth);
          total -= shrinkSize;
          shrinkLeeway -= shrinkSize;
          widths[i] -= shrinkSize;
        }
        if (prevTotal <= total) {  // avoid infinite loop
          break;
        }
        prevTotal = total;
      }

      // grow
      prevTotal = total;
      while (total < availWidth) {
        var growProportion = availWidth / total;
        for (i = 0; i < columns.length && total < availWidth; i++) {
          c = columns[i];
          var currentWidth = widths[i];
          var growSize;

          if (!c.resizable || c.maxWidth <= currentWidth) {
            growSize = 0;
          } else {
            growSize = Math.min(Math.floor(growProportion * currentWidth) - currentWidth, (c.maxWidth - currentWidth) || 1000000) || 1;
          }
          total += growSize;
          widths[i] += growSize;
        }
        if (prevTotal >= total) {  // avoid infinite loop
          break;
        }
        prevTotal = total;
      }

      var reRender = false;
      for (i = 0; i < columns.length; i++) {
        if (columns[i].rerenderOnResize && columns[i].width != widths[i]) {
          reRender = true;
        }
        columns[i].width = widths[i];
      }

      applyColumnHeaderWidths();
      updateColumnCaches();
      updateCanvasWidth(true);
      if (reRender) {
        invalidateAllRows();
        render();
      }
    }

    /**
     * As the column **header** cells have a 'resize' ability (options.resizable), those
     * header cells cannot use the `position: absolute` + `.l<N> .r<N>` styling that all
     * other cells in the grid (including 'headerRow cells' -- option.showHeaderRow) use
     * as the resize (drag) operation would then require a lot of continuous style
     * recalculations to show the resize action as 'smooth': it would load the dragmove
     * handler overmuch (options.syncColumnCellResize).
     */
    function applyColumnHeaderWidths() {
      if (!initialized) { return; }
      applyNestedColumnHeaderWidths();
      var h;
      for (var i = 0, headers = $headers.children(), ii = headers.length; i < ii; i++) {
        h = $(headers[i]);
        if (h.width() !== columns[i].width - headerColumnWidthDiff) {
          h.width(columns[i].width - headerColumnWidthDiff);
        }
      }
    }

    function applyNestedColumnHeaderWidths() {
      if (!hasNestedColumns) {
        return;
      }
      var nh;

      function computeWidths(columns, depth) {
        var totalWidth = 0;
        for (var i = 0; i < columns.length; i++) {
          var column = columns[i];
          if (column.children) {
            column.width = computeWidths(column.children, depth);
          }
          if (column.spacers) {
            var spacer;
            for (var j = 0; j < column.spacers.length; j++) {
              spacer = column.spacers[j];
              spacer.width = column.width;
            }
          }
          totalWidth += column.width;
        }
        return totalWidth;
      }

      computeWidths(nestedColumns[0], 0);

      for (var j = 0, nestedHeaderRows = $headerParents.children(), jj = nestedHeaderRows.length; j < jj; j++) {
        for (var k = 0, nestedHeaders = $(nestedHeaderRows[j]).children(), kk = nestedHeaders.length; k < kk; k++) {
          nh = $(nestedHeaders[k]);

          if (nh.width() !== nestedColumns[j][k].width - headerColumnWidthDiff) {
            nh.width(nestedColumns[j][k].width - headerColumnWidthDiff);
          }
        }
      }
    }

    /**
     * This function 'tweaks' the generated .l<N> and .r<N> CSS rules, setting their
     * 'left' and 'right' CSS styles to calculated pixel positions.
     *
     * Note that google Chrome, when debugging/inspecting the elements/styles,
     * does NOT show these styles and their values!
     *
     * Also note that this assumes the addressed DOM nodes (cells in columns) have
     *   position: absolute;
     */
    function applyColumnWidths() {
      var x = 0, w, rule;
      for (var i = 0; i < columns.length; i++) {
        w = columns[i].width;

        rule = getColumnCssRules(i);
        if (rule) {
          rule.left.style.left = x + "px";
          rule.right.style.right = (canvasWidth - x - w) + "px";
        }
        x += columns[i].width;
      }
    }

    function setSortColumn(columnId, ascending) {
      setSortColumns([{
        columnId: columnId,
        sortAsc: ascending
      }]);
    }

    function setSortColumns(cols) {
      sortColumns = cols;

      var headerColumnEls = $headers.children();
      headerColumnEls
        .removeClass("slick-header-column-sorted")
        .find(".slick-sort-indicator")
        .removeClass("slick-sort-indicator-asc slick-sort-indicator-desc");

      $.each(sortColumns, function(i, col) {
        if (col.sortAsc == null) {
          col.sortAsc = true;
        }
        var columnIndex = getColumnIndex(col.columnId);
        if (columnIndex != null) {
          headerColumnEls.eq(columnIndex)
            .addClass("slick-header-column-sorted")
            .find(".slick-sort-indicator")
            .addClass(col.sortAsc ? "slick-sort-indicator-asc" : "slick-sort-indicator-desc");
        }
      });
    }

    function getSortColumns() {
      return sortColumns;
    }

    function handleSelectedRangesChanged(e, ranges) {
      selectedRows = [];
      var hash = {};
      for (var i = 0; i < ranges.length; i++) {
        for (var j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
          if (!hash[j]) {  // prevent duplicates
            selectedRows.push(j);
            hash[j] = {};
          }
          for (var k = ranges[i].fromCell; k <= ranges[i].toCell; k++) {
            if (canCellBeSelected(j, k)) {
              hash[j][columns[k].id] = options.selectedCellCssClass;
            }
          }
        }
      }

      setCellCssStyles(options.selectedCellCssClass, hash);

      trigger(self.onSelectedRowsChanged, {rows: getSelectedRows(), e: e, ranges: ranges}, e);
    }

    function getColumns() {
      return columns;
    }

    function updateColumnCaches() {
      // Pre-calculate cell boundaries.
      columnPosLeft = [];
      //columnPosRight = [];
      var x = 0;
      for (var i = 0, ii = columns.length; i < ii; i++) {
        columnPosLeft[i] = x;
        x += columns[i].width;
        //columnPosRight[i] = x;
      }
      // store the last calculated left edge also in [length] as it equals the right edge 'plus one pixel' of the grid:
      // this way we can use a single cache array columnPosLeft[] to store both left and right edges of all columns!
      // Half the storage and less work for the same result!
      columnPosLeft[i] = x;
    }

    function setColumns(columnDefinitions) {
      columns = columnDefinitions;

      columnsById = {};
      for (var i = 0; i < columns.length; i++) {
        var m = columns[i] = $.extend({}, columnDefaults, columns[i]);
        columnsById[m.id] = i;
        if (m.minWidth && m.width < m.minWidth) {
          m.width = m.minWidth;
        }
        if (m.maxWidth && m.width > m.maxWidth) {
          m.width = m.maxWidth;
        }
      }

      updateColumnCaches();

      if (initialized) {
        invalidateAllRows();
        createColumnHeaders();
        removeCssRules();
        createCssRules();
        resizeCanvas();
        applyColumnWidths();   // this one would break as the run-time created style in createCssRules() may not have been parsed by the browser yet! (At least in Chrome/MAC)
        handleScroll();
      }
    }

    function getOptions() {
      return options;
    }

    function setOptions(args) {
      if (!getEditorLock().commitCurrentEdit()) {
        return;
      }

      makeActiveCellNormal();

      if (options.enableAddRow !== args.enableAddRow) {
        invalidateRow(getDataLength());
      }

      options = $.extend(options, args);
      validateAndEnforceOptions();

      $viewport.css("overflow-y", options.autoHeight ? "hidden" : "auto");
      render();
    }

    function validateAndEnforceOptions() {
      if (options.autoHeight) {
        options.leaveSpaceForNewRows = false;
      }
    }

    function setData(newData, scrollToTop) {
      data = newData;
      invalidateAllRows();
      updateRowCount();
      if (scrollToTop) {
        scrollTo(0);
      }
    }

    function getData() {
      return data;
    }

    function getDataLength() {
      if (data.getLength) {
        return data.getLength();
      } else {
        return data.length;
      }
    }

    function getDataLengthIncludingAddNew() {
      return getDataLength() + (options.enableAddRow ? 1 : 0);
    }

    function getDataItem(row) {
      if (data.getItem) {
        return data.getItem(row);
      } else {
        return data[row];
      }
    }

    function getCellValueAndInfo(row, cell, config) {
      config = $.extend({
        value: true,
        node: true,
        height: true,
        uid: true,
        css: true,

        outputPlainText: true
      }, config);

      // if the cell has other coordinates because of row/cell span, update that cell coordinate
      var colspan = 1; // getColspan(row, cell);
      var rowspan = 1; // getRowspan(row, cell);
      var spans = getSpans(row, cell);
      assert(spans ? spans.length === 4 : true);
      assert(spans ? spans[3] >= 1 : true);
      if (spans) {
        row = spans[0];
        cell = spans[1];
        rowspan = span[2];
        colspan = span[3];
      }

      assert(Math.min(columns.length - 1, cell + colspan - 1) === cell + colspan - 1);

      var m = columns[cell],
          rowDataItem = getDataItem(row);

      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, cell);
      // look up by id, then index
      var columnMetadata = rowMetadata && rowMetadata.columns && (rowMetadata.columns[m.id] || rowMetadata.columns[cell]);

      var cellCss = [];
      if (config.css) {
	      for (var key in cellCssClasses) {
	        if (cellCssClasses[key][row] && cellCssClasses[key][row][m.id]) {
	          cellCss.push(cellCssClasses[key][row][m.id]);
	        }
	      }
	  }

      var cellHeight = options.rowHeight - cellHeightDiff;

      var info = {
          cellCss: cellCss,
          cellStyles: [],
          html: "",
          row: row,
          cell: cell,
          colspan: colspan,
          rowspan: rowspan,
          cellHeight: cellHeight,
          isNonStandardCellHeight: false,
          column: m,
          rowDataItem: rowDataItem,
          rowMetadata: rowMetadata,
          columnMetadata: columnMetadata,
          formatterOptions: $.extend({}, options.formatterOptions, m.formatterOptions),
          editorOptions: $.extend({}, options.editorOptions, m.editorOptions),
          outputPlainText: config.outputPlainText || false
      };

      if (config.height) {
        var altCellHeight = getCellHeight(row, rowspan);
        info.isNonStandardCellHeight = (cellHeight != altCellHeight);
        info.cellHeight = cellHeight;
      }

      if (config.uid) {
      	v.uid = mkSaneId(m, cell);
      }
      if (config.node) {
        v.cellNode = getCellNode(row, cell);
      }

      if (rowDataItem && config.value) {
        var value = getDataItemValueForColumn(rowDataItem, m, rowMetadata, columnMetadata);
        info.value = value;
        info.formatter = getFormatter(row, cell);
        info.html = info.formatter(row, cell, value, m, rowDataItem, info);
      }
      return info;
    }

    function getTopPanel() {
      return $topPanel[0];
    }

    function setTopPanelVisibility(visible) {
      if (options.showTopPanel != visible) {
        options.showTopPanel = visible;
        if (visible) {
          $topPanelScroller.slideDown("fast", resizeCanvas);
        } else {
          $topPanelScroller.slideUp("fast", resizeCanvas);
        }
      }
    }

    function setHeaderRowVisibility(visible) {
      if (options.showHeaderRow != visible) {
        options.showHeaderRow = visible;
        if (visible) {
          $headerRowScroller.slideDown("fast", resizeCanvas);
        } else {
          $headerRowScroller.slideUp("fast", resizeCanvas);
        }
      }
    }

    function parseColumns(columnsInput) {
      var maxDepth = 0;
      var resultColumns = [];

      function parse(input, depth) {
        var totalWidth = 0;
        if (depth > maxDepth) {
          maxDepth = depth;
        }
        for (var i = 0; i < input.length; i++) {
          var column = input[i];
          if (column.children) {
            hasNestedColumns = true;
            column.width = parse(column.children, depth + 1);
          } else {
            column = input[i] = $.extend({}, columnDefaults, column);
            columnsById[column.id] = i;
            if (column.minWidth && column.width < column.minWidth) {
              column.width = column.minWidth;
            }
            if (column.maxWidth && column.width > column.maxWidth) {
              column.width = column.maxWidth;
            }
            totalWidth += column.width;
            resultColumns.push(column);
          }
        }
        return totalWidth;
      }

      function addToNested(column, depth) {
        if (!nestedColumns) {
          nestedColumns = [];
        }
        if (!nestedColumns[depth]) {
          nestedColumns[depth] = [];
        }
        nestedColumns[depth].push(column);
      }

      var spacerIndex = 0;
      function splitIntoLayers(input, depth) {
        for (var index = 0; index < input.length; index++) {
          var column = input[index];
          addToNested(column, depth);
          if (column.children) {
            splitIntoLayers(column.children, depth + 1);
          } else {
            var spacer;
            var spacers = [];
            for (var d = depth + 1; d <= maxDepth; d++) {
              spacer = {spacer: true, width: column.width || columnDefaults.width, name: "", id: "spacer" + spacerIndex};
              addToNested(spacer, d);
              spacers.push(spacer);
              spacerIndex++;
            }
            column.spacers = spacers;
          }
        }
      }

      hasNestedColumns = false;
      parse(columnsInput, 0);

      if (maxDepth > 0) {
        splitIntoLayers(columnsInput, 0);
      }

      return resultColumns;
    }

    function getContainerNode() {
      return $container.get(0);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Rendering / Scrolling

    function cacheRowPositions() {
      var len = getDataLength();
      getRowPosition(len - 1);
    }

    function getRowPosition(row) {
      var pos = rowPositionCache[row];
      if (!pos || pos.top == null) {
        var r, top, rowMetadata;
        // do not recurse; loop until we hit the last valid and *complete* cache entry (or row === 0)
        for (r = row; r >= 0; r--) {
          pos = rowPositionCache[r];
          if (!pos) {
            rowMetadata = data.getItemMetadata && data.getItemMetadata(r, false);
            pos = rowPositionCache[r] = {
              height: (rowMetadata && rowMetadata.height > 0) ? rowMetadata.height : options.rowHeight
            };
          } else if (pos.top != null)
            break;
        }
        // we now know that all preceding cache elements (up to and including the [row] entry) have been set up with a valid .height
        // so now all we need to do is update all .top values; all entries' .height is valid hence we can run a very tight loop:
        if (r < 0) {
          pos = {
            top: -pageOffset,
            height: 0
          };
        }
        while (++r <= row) {
          top = pos.top + pos.height;
          pos = rowPositionCache[r];
          pos.top = top;
        }
      }
      return pos;
    }

    function getRowTop(row) {
      assert(row >= 0);
      return getRowPosition(row).top;
    }

    function getRowHeight(row) {
      assert(row >= 0);
      return getRowPosition(row).height;
    }

    function getRowBottom(row) {
      assert(row >= 0);
      var pos = getRowPosition(row);
      return pos.top + pos.height;
    }

    // Return the row index at the given grid pixel coordinate Y.
    //
    // Also return the 'fraction' of the index within the row, i.e.
    // if the Y coordinate points at a spot 25% from the top of the row, then
    // `returnValue.fraction` will be 0.25
    //
    // `returnValue.fraction == 0.0` would identify the top pixel within the row.
    //
    // When the Y coordinate points outside the grid, out-of-range numbers will be produced.
    //
    // The fraction is guaranteed to be less than 1 (value range: [0 .. 1>),
    // unless the Y coordinate points outside the grid.
    function getRowWithFractionFromPosition(maxPosition) {
      assert(maxPosition >= 0);
      var rowsInPosCache = getDataLength();

      if (!rowsInPosCache) {
        return {
          position: 0,
          fraction: 0,
          height: 1
        };
      }

      // perform a binary search through the row cache: O(log2(n)) vs. linear scan at O(n):
      //
      // This first call to getRowTop(rowsInPosCache - 1) is here to help update the row cache
      // at the start of the search; at least for many scenarios where all (or the last) rows
      // have been invalidated:
      if (maxPosition > getRowTop(rowsInPosCache - 1)) {
        // Return the last row in the grid
        return {
          position: rowsInPosCache - 1,
          fraction: 0,
          height: 1
        };
      }

      var l = 0;
      var r = rowsInPosCache - 1;
      var probe, top;
      // before we enter the binary search, we attempt to improve the initial guess + search range
      // using the heuristic that the variable cell height will be close to rowHeight:
      // we perform two probes (at ≈1‰ interval) to save 10 probes (1000 ≈ 2^10) if we are lucky;
      // we 'loose' 1 probe (the second) to inefficiency if we are unlucky (though one may argue
      // that the possibly extremely skewed split point for the first probe is also a loss -- which
      // would be true if the number of rows with non-standard rowHeight is large and/or deviating
      // from that norm options.rowHeight a lot for some rows, thus moving the targets outside the
      // 'is probably within 1‰ of the norm' for most row positions.
      // Alas, for my tested (large!) grids this heuristic gets us very near O(2) vs O(log2(N)).
      // For grids which do not employ custom rowHeight at all, the performance is O(1). I like that!
      //
      // (Yes, this discussion ignores the cost of the rowheight position cache table update which
      // is O(N) on its own but which is also to be treated as 'negligible cost' when amortized over
      // the number of getRowWithFractionFromPosition calls vs. cache invalidation.)
      probe = (maxPosition / options.rowHeight) | 0;
      probe = Math.min(rowsInPosCache - 1, Math.max(0, probe));
      top = getRowTop(probe);
      if (top > maxPosition) {
        r = probe - 1;
        probe = r - 1 - (0.001 * rowsInPosCache) | 0;
        probe = Math.max(0, probe);
        top = getRowTop(probe);
        if (top > maxPosition) {
          r = probe - 1;
        } else if (getRowBottom(probe) > maxPosition) {
          return {
            position: probe,
            fraction: 0
          };
        } else {
          l = probe + 1;
        }
      } else if (getRowBottom(probe) > maxPosition) {
        return {
          position: probe,
          fraction: 0,
          height: options.rowHeight
        };
      } else {
        l = probe + 1;
        probe = l + 1 + (0.001 * rowsInPosCache) | 0;
        probe = Math.min(rowsInPosCache - 1, probe);
        top = getRowTop(probe);
        if (top > maxPosition) {
          r = probe - 1;
        } else if (getRowBottom(probe) > maxPosition) {
          return {
            position: probe,
            fraction: 0,
            height: options.rowHeight
          };
        } else {
          l = probe + 1;
        }
      }
      assert(l <= r || r < 0);

      while (l < r) {
        probe = ((l + r) / 2) | 0; // INT/FLOOR
        top = getRowTop(probe);
        if (top > maxPosition) {
          r = probe - 1;
        } else if (getRowBottom(probe) > maxPosition) {
          l = probe;
          break;
        } else {
          l = probe + 1;
        }
      }
      return {
        position: l,
        fraction: 0,
        height: options.rowHeight
      };
    }

    function scrollTo(y) {
      y = Math.max(y, 0);
      y = Math.min(y, virtualTotalHeight - viewportH + (viewportHasHScroll ? scrollbarDimensions.height : 0));

      var oldOffset = pageOffset;

      page = Math.min(numberOfPages - 1, (pageHeight > 0) ? Math.floor(y / pageHeight) : 0);
      pageOffset = Math.round(page * jumpinessCoefficient);
      var newScrollTop = y - pageOffset;

      if (pageOffset != oldOffset) {
        var range = getVisibleRange(newScrollTop);
        cleanupRows(range);
      }

      if (prevScrollTop != newScrollTop) {
        vScrollDir = (prevScrollTop + oldOffset < newScrollTop + pageOffset) ? 1 : -1;
        $viewport[0].scrollTop = (lastRenderedScrollTop = scrollTop = prevScrollTop = newScrollTop);

        trigger(self.onViewportChanged, {});
      }
    }

    function defaultFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
      if (value == null) {
        return "";
      } else {
        // Safari 6 fix: (value + "") instead of .toString()
        value = "" + value;
  		if (cellMetaInfo.outputPlainText) {
          return value;
        } else {
          return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
      }
    }

    function defaultHeaderFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
      var output = defaultFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo);
	  if (!cellMetaInfo.outputPlainText) {
        // make sure column names with & ampersands and/or < / > less-than/greater-then characters are properly rendered in HTML:
        output = "<span class='slick-column-name'>" + output + "</span>";
      }
      return output;
    }

    function defaultHeaderRowFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
      var output = defaultFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo);
	  if (!cellMetaInfo.outputPlainText) {
        // make sure column names with & ampersands and/or < / > less-than/greater-then characters are properly rendered in HTML:
        output = "<span class='slick-extra-headerrow-column'>" + output + "</span>";
      }
      return output;
    }

    function getFormatter(row, cell) {
      var column = columns[cell];
      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, cell);

      // look up by id, then index
      var columnMetadata = rowMetadata &&
          rowMetadata.columns &&
          (rowMetadata.columns[column.id] || rowMetadata.columns[cell]);

      return (columnMetadata && columnMetadata.formatter) ||
          (rowMetadata && rowMetadata.formatter) ||
          column.formatter ||
          (options.formatterFactory && options.formatterFactory.getFormatter && options.formatterFactory.getFormatter(column, row, cell)) ||
          options.defaultFormatter;
    }

    function getEditor(row, cell) {
      var column = columns[cell];
      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, cell);

      // look up by id, then index
      var columnMetadata = rowMetadata &&
          rowMetadata.columns &&
          (rowMetadata.columns[column.id] || rowMetadata.columns[cell]);

      return (columnMetadata && columnMetadata.editor) ||
          (rowMetadata && rowMetadata.editor) ||
          column.editor ||
          (options.editorFactory && options.editorFactory.getEditor && options.editorFactory.getEditor(column, row, cell)) ||
          options.defaultEditor;
    }

    /**
     * Returns the header cell formatter for the given header row / column
     *
     * @param {Integer} headerRow the header row number; starts numbering at 0 (zero).
     *                  Vanilla SlickGrid only supports a single header row, which is numbered 0 (zero).
     * @param {Integer} cell the header column number; starts numbering at 0 (zero).
     * @return {Function} a Slick.Formatters compatible formatter.
     *                    In order to allow the user to 're-use' basic formatters,
     *                    the row number passed to the formatter will start at -2000 (minus two thousand).
     */
    function getHeaderFormatter(headerRow, cell) {
      var column = columns[cell];
      var rowMetadata = data.getHeaderItemMetadata && data.getHeaderItemMetadata(headerRow, cell);

      // look up by id, then index
      var columnOverrides = rowMetadata &&
          rowMetadata.columns &&
          (rowMetadata.columns[column.id] || rowMetadata.columns[cell]);

      return (columnOverrides && columnOverrides.headerFormatter) ||
          (rowMetadata && rowMetadata.headerFormatter) ||
          column.headerFormatter ||
          (options.formatterFactory && options.formatterFactory.getHeaderFormatter && options.formatterFactory.getHeaderFormatter(column, row, cell)) ||
          options.defaultHeaderFormatter;
    }

    /**
     * Returns the headerRow cell formatter for the given headerRow row / column.
     *
     * The 'headerRow' is the header row shown by SlickGrid when the `option.showHeaderRow` is enabled.
     *
     * @param {Integer} headerRow the header row number; starts numbering at 0 (zero).
     *                  Vanilla SlickGrid only supports a single header row, which is numbered 0 (zero).
     *
     * @param {Integer} cell the header column number; starts numbering at 0 (zero).
     *
     * @return {Function} a Slick.Formatters compatible formatter.
     *                    In order to allow the user to 're-use' basic formatters,
     *                    the row number passed to the formatter will start at -1000 (minus one thousand).
     */
    function getHeaderRowFormatter(headerRow, cell) {
      var column = columns[cell];
      var rowMetadata = data.getHeaderRowItemMetadata && data.getHeaderRowItemMetadata(headerRow, cell);

      // look up by id, then index
      var columnMetadata = rowMetadata &&
          rowMetadata.columns &&
          (rowMetadata.columns[column.id] || rowMetadata.columns[cell]);

      return (columnMetadata && columnMetadata.headerRowFormatter) ||
          (rowMetadata && rowMetadata.headerRowFormatter) ||
          column.headerRowFormatter ||
          (options.formatterFactory && options.formatterFactory.getHeaderRowFormatter && options.formatterFactory.getHeaderRowFormatter(column, row, cell)) ||
          options.defaultHeaderRowFormatter;
    }

    function getEditor(row, cell) {
      var column = columns[cell];
      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, cell);

      // look up by id, then index
      var columnMetadata = rowMetadata &&
          rowMetadata.columns &&
          (rowMetadata.columns[column.id] || rowMetadata.columns[cell]);

      return (columnMetadata && columnMetadata.editor) ||
          (rowMetadata && rowMetadata.editor) ||
          column.editor ||
          (options.editorFactory && options.editorFactory.getEditor && options.editorFactory.getEditor(column, row, cell)) ||
          options.defaultEditor;
    }

    function getDataItemValueForColumn(item, columnDef, rowMetadata, columnMetadata) {
      if (columnMetadata && columnMetadata.dataItemColumnValueExtractor) {
        return columnMetadata.dataItemColumnValueExtractor(item, columnDef, rowMetadata, columnMetadata);
      }
      if (rowMetadata && rowMetadata.dataItemColumnValueExtractor) {
        return rowMetadata.dataItemColumnValueExtractor(item, columnDef, rowMetadata, columnMetadata);
      }
      if (columnDef && columnDef.dataItemColumnValueExtractor) {
        return columnDef.dataItemColumnValueExtractor(item, columnDef, rowMetadata, columnMetadata);
      }
      if (options.dataItemColumnValueExtractor) {
        return options.dataItemColumnValueExtractor(item, columnDef, rowMetadata, columnMetadata);
      }
      return item[columnDef.field];
    }

    function appendRowHtml(stringArray, row, range, dataLength) {
      var d = getDataItem(row);
      var dataLoading = row < dataLength && !d;
      var rowCss = "slick-row" +
          (dataLoading ? " loading" : "") +
          (row === activeRow ? " active" : "") +
          (row % 2 == 1 ? " odd" : " even") +
          " slick-row-" + row;

      if (!d) {
        rowCss += " " + options.addNewRowCssClass;
      }

      var metadata = data.getItemMetadata && data.getItemMetadata(row, false);

      if (metadata && metadata.cssClasses) {
        rowCss += " " + (typeof metadata.cssClasses === 'function' ? metadata.cssClasses(row) : metadata.cssClasses);
      }

      stringArray.push("<div class='ui-widget-content " + rowCss + "' style='top:" + getRowTop(row) + "px" +
        (getRowHeight(row) !== options.rowHeight ? "; height:" + getRowHeight(row) + "px" : "") + "' role='row'");

      appendMetadataAttributes(stringArray, metadata);

      stringArray.push(">");

      var colspan, m, columnData;
      for (var i = 0, ii = columns.length; i < ii; i += colspan) {
        m = columns[i];
        colspan = getColspan(row, i);

        if (getSpanRow(row, i) < row) {
          continue;
        }

        // Do not render cells outside of the viewport.
        assert(Math.min(ii, i + colspan) === i + colspan);
        if (columnPosLeft[i + colspan] > range.leftPx) {
          if (columnPosLeft[i] > range.rightPx) {
            // All columns to the right are outside the range.
            break;
          }

          // look up by id, then index
          columnData = metadata && metadata.columns && (metadata.columns[m.id] || metadata.columns[i]);
          appendCellHtml(stringArray, row, i, metadata, columnData, d);
        }
      }

      if (metadata && metadata.appendHtml) {
        stringArray.push(metadata.appendHtml);
      }

      stringArray.push("</div>");
    }

    function mkCellHtml(row, cell, rowMetadata, columnMetadata, rowDataItem) {
      var m = columns[cell];
      var colspan = getColspan(row, cell);
      var rowspan = getRowspan(row, cell);
      assert(Math.min(columns.length - 1, cell + colspan - 1) === cell + colspan - 1);
      var cellStyles = [];
      var cellCss = ["slick-cell", "l" + cell, "r" + (cell + colspan - 1)];
      if (m.cssClass) {
        cellCss.push(m.cssClass);
      }
      if (colspan > 1) {
        cellCss.push("colspan");
        cellCss.push("colspan" + colspan);
      }
      if (rowspan > 1) {
        cellCss.push("rowspan");
        cellCss.push("rowspan" + rowspan);
      }
      if (columnMetadata && columnMetadata.cssClass) {
        cellCss.push(columnMetadata.cssClass);
      }
      if (columnMetadata && columnMetadata.transparent) {
        cellCss.push("slick-transparent");
      }
      if (row === activeRow && cell === activeCell) {
        cellCss.push("active");
      }

      for (var key in cellCssClasses) {
        if (cellCssClasses[key][row] && cellCssClasses[key][row][m.id]) {
          cellCss.push(cellCssClasses[key][row][m.id]);
        }
      }

      var cellHeight = getCellHeight(row, rowspan);
      if (cellHeight != options.rowHeight - cellHeightDiff) {
        cellStyles.push("height:" + cellHeight + "px");
      }

      // if there is a corresponding row (if not, this is the Add New row or this data hasn't been loaded yet)
      var info = $.extend({}, options.formatterOptions, m.formatterOptions, {
        cellCss: cellCss,
        cellStyles: cellStyles,
        html: "",
        colspan: colspan,
        rowspan: rowspan,
        cellHeight: cellHeight,
        rowMetadata: rowMetadata,
        columnMetadata: columnMetadata
      });
      if (rowDataItem) {
        var value = getDataItemValueForColumn(rowDataItem, m, rowMetadata, columnMetadata);
        // allow the formatter to edit the outer cell's DIV CSS as well:
        info.html = getFormatter(row, cell)(row, cell, value, m, rowDataItem, info);
      }
      return info;
    }

    function appendCellHtml(stringArray, row, cell, rowMetadata, columnMetadata, rowDataItem) {
      var m = columns[cell];
      var fmt = mkCellHtml(row, cell, rowMetadata, columnMetadata, rowDataItem);
      var styles;
      if (fmt.cellStyles.length > 0) {
        styles = "style='" + fmt.cellStyles.join(";") + ";' ";
      } else {
        styles = "";
      }
      stringArray.push("<div class='" + fmt.cellCss.join(" ") + "' " +
                       styles + "aria-describedby='" + mkSaneId(m, cell) +
                       "' tabindex='-1' role='gridcell'");

      appendMetadataAttributes(stringArray, columnMetadata);

      stringArray.push(">");

      stringArray.push(fmt.html);

      stringArray.push("</div>");

      rowsCache[row].cellRenderQueue.push(cell);
    }

    function appendMetadataAttributes(stringArray, metadata) {
      if (metadata) {
        for (var attr in metadata.attributes) {
          stringArray.push(" " + attr + "='" + defaultFormatter(null, null, metadata.attributes[attr]) + "'");
        }
      }
    }

    function cleanupRows(rangeToKeep) {
      for (var i in rowsCache) {
        i = i | 0;
        if (i !== activeRow) {
          if (i < rangeToKeep.top) {
            // do not remove rows with rowspanned cells overlapping rangeToKeep
            if (!cellSpans[i] || i + cellSpans[i].maxRowSpan >= rangeToKeep.top) {
              continue;
            }
          } else if (i < rangeToKeep.bottom) {
            continue;
          }
          removeRowFromCache(i);
        }
      }
    }

    function invalidate() {
      invalidateAllRows();
      updateRowCount();
      render();
    }

    function invalidateAllRows() {
      if (currentEditor) {
        makeActiveCellNormal();
        assert(!currentEditor);
      }
      for (var row in rowsCache) {
        removeRowFromCache(row);
      }
      rowPositionCache = {};
    }

    function removeRowFromCache(row) {
      var cacheEntry = rowsCache[row];
      if (!cacheEntry) {
        return;
      }

      if (rowNodeFromLastMouseWheelEvent == cacheEntry.rowNode) {
        cacheEntry.rowNode.style.display = 'none';
        zombieRowNodeFromLastMouseWheelEvent = rowNodeFromLastMouseWheelEvent;
      } else {
        $canvas[0].removeChild(cacheEntry.rowNode);
      }

      delete rowsCache[row];
      delete postProcessedRows[row];
      renderedRows--;
      counter_rows_removed++;
    }

    function invalidateRows(rows) {
      var i, rl, row, c, span, rowspan, colspan;
      if (!rows || !rows.length) {
        return;
      }
      rows.sort(function(a, b) { return a - b; });
      vScrollDir = 0;
      var dataLength = getDataLength();
      var columnCount = columns.length;
      var invalidateTopFrom = dataLength;
      var invalidateFrom = dataLength;
      var invalidateTo = -1;
      var intersectingCells = {};
      for (i = 0, rl = rows.length; i < rl; i++) {
        row = rows[i];
        if (currentEditor && activeRow === row) {
          makeActiveCellNormal();
          assert(!currentEditor);
        }
        if (rowsCache[row]) {
          removeRowFromCache(row);
        }
        var metadata = data.getItemMetadata && data.getItemMetadata(row, false);
        if (!metadata) {
          continue;
        }
        var spanRow = cellSpans[row];
        if (!spanRow) {
          continue;
        }
        // if the row height changes, all its successors should invalidate their style.top positions
        if (metadata.height && metadata.height != getRowHeight(row)) {
          delete rowPositionCache[row];
          if (row < invalidateTopFrom) {
            invalidateTopFrom = row + 1;
            invalidateTo = dataLength - 1;
          }
          // invalidate rowspan intersecting cells
          for (c = 0; c < columnCount; c += colspan) {
            colspan = 1;
            span = spanRow[c];
            if (span) {
              colspan = span[3];
              if (span[0] != row) {
                (intersectingCells[span[0]] || (intersectingCells[span[0]] = {}))[span[1]] = true;
              }
            }
          }
        }

        // check changes in row/colspans
        for (c = 0; c < columnCount; c += colspan) {
          var columnMetadata = metadata.columns && (metadata.columns[columns[c].id] || metadata.columns[c]);
          colspan = 1;
          if (columnMetadata) {
            rowspan = columnMetadata.rowspan || 1;
            colspan = columnMetadata.colspan || 1;
            span = spanRow[c];
            var oldRowspan = span && span[2] || 1;
            var oldColspan = span && span[3] || 1;
            if (oldRowspan !== rowspan || oldColspan !== colspan) {
              // if spans change, fix pointers to span head cell
              span = rowspan > 1 || colspan > 1 ? [row, c, rowspan, colspan] : undefined;
              for (var rs = row, rsu = row + Math.max(rowspan, oldRowspan); rs < rsu; rs++) {
                for (var cs = c, csu = c + Math.max(colspan, oldColspan) ; cs < csu; cs++) {
                  !span || rs >= row + rowspan || cs >= c + colspan ? delete cellSpans[rs][cs] : cellSpans[rs][cs] = span;
                }
              }
              // adjust invalidate range
              invalidateFrom = Math.min(invalidateFrom, row);
              invalidateTo = Math.max(invalidateTo, row + oldRowspan - 1, row + rowspan - 1);
            }
          }
        }
      }

      for (row = Math.min(invalidateFrom, invalidateTopFrom); row <= invalidateTo; row++) {
        if (row >= invalidateTopFrom) {
          delete rowPositionCache[row].top;
        }
        if (currentEditor && activeRow === row) {
          makeActiveCellNormal();
        }
        if (rowsCache[row]) {
          removeRowFromCache(row);
        }
      }

      for (row in intersectingCells) {
        for (c in intersectingCells[row]) {
          updateCell(+row, +c);
        }
      }
    }

    function invalidateRow(row) {
      invalidateRows([row]);
    }

    function updateCell(row, cell) {
      var cellNode = getCellNode(row, cell);
      if (!cellNode) {
        return;
      }

      var m = columns[cell],
          d = getDataItem(row);
      if (currentEditor && activeRow === row && activeCell === cell) {
        currentEditor.loadValue(d);
      } else {
        // if the cell has other coordinates because of row/cell span, update that cell (which will invalidate this cellNode)
        var spans = getSpans(row, cell);
        assert(spans ? spans.length === 4 : true);
        assert(spans ? spans[3] >= 1 : true);
        if (spans && (spans[0] != row || spans[1] != cell)) {
          updateCell(spans[0], spans[1]);
          return;
        }
        var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, cell);
        // look up by id, then index
        var columnMetadata = rowMetadata && rowMetadata.columns && (rowMetadata.columns[m.id] || rowMetadata.columns[cell]);

        var cellHeight = getCellHeight(row, getRowspan(row, cell));
        if (cellHeight != options.rowHeight) {
          cellNode.style.height = cellHeight + "px";
        } else if (cellNode.style.height) {
          cellNode.style.height = "";
        }

        if (d) {
          var fmt = mkCellHtml(row, cell, rowMetadata, columnMetadata, d);
          var el = $(cellNode);
          el.attr("style", fmt.cellStyles.length ? fmt.cellStyles.join(";") + ";" : null);
          el.attr("class", fmt.cellCss.join(" "));
          el.html(fmt.html);
        } else {
          cellNode.innerHTML = "";
        }
        invalidatePostProcessingResults(row);
      }
    }

    function updateRow(row) {
      var cacheEntry = rowsCache[row];
      if (!cacheEntry) {
        return;
      }

      ensureCellNodesInRowsCache(row);

      var d = getDataItem(row);
      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, false);

      for (var columnIdx in cacheEntry.cellNodesByColumnIdx) {
        if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)) {
          continue;
        }

        columnIdx = columnIdx | 0;
        var m = columns[columnIdx],
            node = cacheEntry.cellNodesByColumnIdx[columnIdx];

        if (row === activeRow && columnIdx === activeCell && currentEditor) {
          currentEditor.loadValue(d);
        } else if (d) {
          // look up by id, then index
          var columnMetadata = rowMetadata && rowMetadata.columns && (rowMetadata.columns[m.id] || rowMetadata.columns[columnIdx]);
          var fmt = mkCellHtml(row, columnIdx, rowMetadata, columnMetadata, d);
          var el = $(node);
          el.attr("style", fmt.cellStyles.length ? fmt.cellStyles.join(";") + ";" : null);
          el.attr("class", fmt.cellCss.join(" "));
          el.html(fmt.html);
        } else {
          node.innerHTML = "";
        }
      }

      invalidatePostProcessingResults(row);
    }

    function getCellHeight(row, rowspan) {
      var cellHeight = options.rowHeight;
      if (rowspan > 1) {
        var rowSpanBottomIdx = row + rowspan - 1;
        cellHeight = getRowBottom(rowSpanBottomIdx) - getRowTop(row);
      } else {
        var rowHeight = getRowHeight(row);
        if (rowHeight != options.rowHeight) {
          cellHeight = rowHeight;
        }
      }
      cellHeight -= cellHeightDiff;
      return cellHeight;
    }

    function getViewportHeight() {
      return parseFloat($.css($container[0], "height", true)) -
        parseFloat($.css($container[0], "paddingTop", true)) -
        parseFloat($.css($container[0], "paddingBottom", true)) -
        parseFloat($.css($headerScroller[0], "height")) - getVBoxDelta($headerScroller) -
        (options.showTopPanel ? options.topPanelHeight + getVBoxDelta($topPanelScroller) : 0) -
        (options.showHeaderRow ? options.headerRowHeight + getVBoxDelta($headerRowScroller) : 0);
    }

    // Returns the size of the content area
    function getContentSize() {
      var canvasWidth = $canvas.width(),
          canvasHeight = $canvas.height(),
          hasVScroll = canvasHeight > $viewport.height(),
          contentWidth = canvasWidth + (hasVScroll ? scrollbarDimensions.width : 0),
          hasHScroll = contentWidth > $viewport.width(),
          contentHeight = canvasHeight + (hasHScroll ? scrollbarDimensions.height : 0);
      return { width: contentWidth, height: contentHeight };
    }

    // Returns the size of the visible area, i.e. between the scroll bars
    function getVisibleSize() {
      var width = $viewport.width(),
          height = $viewport.height(),
          hasHScroll = $canvas.width() > width - scrollbarDimensions.width,
          hasVScroll = $canvas.height() > height - scrollbarDimensions.height;
      width -= hasVScroll ? scrollbarDimensions.width : 0;
      height -= hasHScroll ? scrollbarDimensions.height : 0;
      return { width: width, height: height };
    }

    function resizeCanvas() {
      if (!initialized) { return; }
      if (options.autoHeight) {
        viewportH = getRowBottom(getDataLengthIncludingAddNew());
      } else {
        viewportH = getViewportHeight();
      }

      numVisibleRows = getRowWithFractionFromPosition(viewportH).position;
      viewportW = parseFloat($.css($container[0], "width", true));
      if (!options.autoHeight) {
        $viewport.height(viewportH);
      }

      if (options.forceFitColumns) {
        autosizeColumns();
      }

      cleanUpAndRenderCells(getRenderedRange());
      updateRowCount();
      handleScroll();
      // Since the width has changed, force the render() to reevaluate virtually rendered cells.
      lastRenderedScrollLeft = -1;
      render();
    }

    function updateRowCount() {
      if (!initialized) { return; }

      cacheRowPositions();

      var dataLengthIncludingAddNew = getDataLengthIncludingAddNew();
      var numberOfRows = dataLengthIncludingAddNew +
          (options.leaveSpaceForNewRows ? numVisibleRows - 1 : 0);

      var oldViewportHasVScroll = viewportHasVScroll;
      // with autoHeight, we do not need to accommodate the vertical scroll bar
      viewportHasVScroll = !options.autoHeight && (getRowBottom(numberOfRows - 1) > viewportH);

      makeActiveCellNormal();

      // remove the rows that are now outside of the data range
      // this helps avoid redundant calls to .removeRow() when the size of the data decreased by thousands of rows
      var l = dataLengthIncludingAddNew - 1;
      for (var i in rowsCache) {
        if (i >= l) {
          removeRowFromCache(i);
        }
      }

      if (activeCellNode && activeRow > l) {
        resetActiveCell();
      }

      var rowMax = (options.enableAddRow
        ? getRowBottom(getDataLength())
        : getRowTop(getDataLength()));
      var oldH = scrollableHeight;
      virtualTotalHeight = Math.max(rowMax, viewportH - scrollbarDimensions.height);
      if (virtualTotalHeight < maxSupportedCssHeight) {
        // just one page
        scrollableHeight = pageHeight = virtualTotalHeight;
        numberOfPages = 1;
        jumpinessCoefficient = 0;
      } else {
        // break into pages
        scrollableHeight = maxSupportedCssHeight;
        pageHeight = scrollableHeight / 100;
        numberOfPages = Math.floor(virtualTotalHeight / pageHeight);
        jumpinessCoefficient = (virtualTotalHeight - scrollableHeight) / (numberOfPages - 1);
      }

      if (scrollableHeight !== oldH) {
        $canvas.css("height", scrollableHeight);
        scrollTop = $viewport[0].scrollTop;
      }

      var oldScrollTopInRange = (scrollTop + pageOffset <= virtualTotalHeight - viewportH);

      if (virtualTotalHeight == 0 || scrollTop == 0) {
        page = pageOffset = 0;
      } else if (oldScrollTopInRange) {
        // maintain virtual position
        scrollTo(scrollTop + pageOffset);
      } else {
        // scroll to bottom
        scrollTo(virtualTotalHeight - viewportH);
      }

      if (scrollableHeight != oldH && options.autoHeight) {
        resizeCanvas();
      }

      if (options.forceFitColumns && oldViewportHasVScroll != viewportHasVScroll) {
        autosizeColumns();
      }
      updateCanvasWidth(false);
    }

    function getVisibleRange(viewportTop, viewportLeft) {
      if (viewportTop == null) {
        viewportTop = scrollTop;
      }
      if (viewportLeft == null) {
        viewportLeft = scrollLeft;
      }

      var top = getRowWithFractionFromPosition(viewportTop + pageOffset);
      var bottom = getRowWithFractionFromPosition(viewportTop + pageOffset + viewportH); // test at the first INvisible pixel
      return {
        top: top.position,                          // the first visible row
        bottom: bottom.position + 1,                // first row which is guaranteed to be NOT visible, not even partly
        bottomVisible: bottom.position,             // the last visible row
        bottomVisibleFraction: bottom.fraction,     // the vertical fraction of visibility for the last visible row
        topInvisibleFraction: top.fraction,         // the vertical fraction of *IN*visibility for the first visible row
        topPx: viewportTop,
        bottomPx: viewportTop + viewportH,
        leftPx: viewportLeft,
        rightPx: viewportLeft + viewportW    // availableWidth = viewportHasVScroll ? viewportW - scrollbarDimensions.width : viewportW
      };
    }

    function getRenderedRange(viewportTop, viewportLeft) {
      var range = getVisibleRange(viewportTop, viewportLeft);
      var buffer = getRowWithFractionFromPosition(viewportH).position;
      var minBuffer = 3;

      delete range.topPx;
      delete range.bottomPx;

      if (vScrollDir == -1) {
        range.top -= buffer;
        range.bottom += minBuffer;
      } else if (vScrollDir == 1) {
        range.top -= minBuffer;
        range.bottom += buffer;
      } else {
        range.top -= minBuffer;
        range.bottom += minBuffer;
      }

      range.top = Math.max(0, range.top);
      range.bottom = Math.min(getDataLengthIncludingAddNew() - 1, range.bottom);

      range.leftPx -= viewportW;
      range.rightPx += viewportW;

      range.leftPx = Math.max(0, range.leftPx);
      range.rightPx = Math.min(canvasWidth, range.rightPx);

      return range;
    }

    function ensureCellNodesInRowsCache(row) {
      var cacheEntry = rowsCache[row];
      if (cacheEntry) {
        if (cacheEntry.cellRenderQueue.length) {
          var lastChild = cacheEntry.rowNode.lastChild;
          while (cacheEntry.cellRenderQueue.length) {
            if (lastChild.className.indexOf('slick-cell') >= 0) {
              var columnIdx = cacheEntry.cellRenderQueue.pop();
              cacheEntry.cellNodesByColumnIdx[columnIdx] = lastChild;
            }
            lastChild = lastChild.previousSibling;
          }
        }
      }
    }

    function cleanUpCells(range, row) {
      var totalCellsRemoved = 0;
      var cacheEntry = rowsCache[row];

      // Remove cells outside the range.
      var cellsToRemove = [];
      for (var i in cacheEntry.cellNodesByColumnIdx) {
        // I really hate it when people mess with Array.prototype.
        if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(i)) {
          continue;
        }

        // This is a string, so it needs to be cast back to a number.
        i = i | 0;

        var colspan = getColspan(row, i);
        assert(Math.min(columns.length, i + colspan) === i + colspan);
        if (columnPosLeft[i] > range.rightPx ||
          columnPosLeft[i + colspan] < range.leftPx) {
          if (!(row == activeRow && i == activeCell)) {
            cellsToRemove.push(i);
          }
        }
      }

      var cellToRemove;
      while ((cellToRemove = cellsToRemove.pop()) != null) {
        cacheEntry.rowNode.removeChild(cacheEntry.cellNodesByColumnIdx[cellToRemove]);
        delete cacheEntry.cellNodesByColumnIdx[cellToRemove];
        if (postProcessedRows[row]) {
          delete postProcessedRows[row][cellToRemove];
        }
        totalCellsRemoved++;
      }
    }

    function cleanUpAndRenderCells(range) {
      var cacheEntry;
      var stringArray = [];
      var processedRows = [];
      var cellsAdded;
      var totalCellsAdded = 0;
      var colspan;
      var columnData;

      for (var row = range.top, btm = range.bottom; row <= btm; row++) {
        cacheEntry = rowsCache[row];
        if (!cacheEntry) {
          continue;
        }

        // cellRenderQueue populated in renderRows() needs to be cleared first
        ensureCellNodesInRowsCache(row);

        cleanUpCells(range, row);

        // Render missing cells.
        cellsAdded = 0;

        var metadata = data.getItemMetadata && data.getItemMetadata(row, false);
        metadata = metadata && metadata.columns;

        var d = getDataItem(row);

        // TODO:  shorten this loop (index? heuristics? binary search?)
        for (var i = 0, ii = columns.length; i < ii; i += colspan) {
          // Cells to the right are outside the range.
          if (columnPosLeft[i] > range.rightPx) {
            break;
          }
          colspan = getColspan(row, i);
          var spanRow = getSpanRow(row, i);
          if (spanRow != row) {
            continue;
          }

          // Already rendered.
          if (cacheEntry.cellNodesByColumnIdx[i] != null) {
            continue;
          }

          assert(Math.min(ii, i + colspan) === i + colspan);
          if (columnPosLeft[i + colspan] > range.leftPx) {
            // look up by id, then index
            columnData = metadata && (metadata[columns[i].id] || metadata[i]);
            appendCellHtml(stringArray, row, i, metadata, columnData, d);
            cellsAdded++;
          }
        }

        if (cellsAdded) {
          totalCellsAdded += cellsAdded;
          processedRows.push(row);
        }
      }

      if (!stringArray.length) {
        return;
      }

      var x = document.createElement("div");
      x.innerHTML = stringArray.join("");

      var processedRow;
      var node;
      while ((processedRow = processedRows.pop()) != null) {
        cacheEntry = rowsCache[processedRow];
        var columnIdx;
        while ((columnIdx = cacheEntry.cellRenderQueue.pop()) != null) {
          node = x.lastChild;
          cacheEntry.rowNode.appendChild(node);
          cacheEntry.cellNodesByColumnIdx[columnIdx] = node;
        }
      }
    }

    function renderRows(range) {
      var parentNode = $canvas[0],
          stringArray = [],
          rows = [],
          needToReselectCell = false,
          i, ii, colspan,
          dataLength = getDataLength();

      // collect rows with cell rowspans > 1 and overlapping the range top
      for (ii = 0; ii < columns.length; ii += colspan) {
        i = getSpanRow(range.top, ii);
        colspan = getColspan(i, ii);
        assert(ii + colspan <= columns.length);
        if (i < range.top && !rowsCache[i] && columnPosLeft[ii + colspan] > range.leftPx && columnPosLeft[ii] <= range.rightPx) {
          rows.push(i);

          if (rowsCache[i]) {
            continue;
          }

          // collect not rendered range rows
          renderedRows++;

          // Create an entry right away so that appendRowHtml() can
          // start populatating it.
          rowsCache[i] = {
            rowNode: null,

            // Cell nodes (by column idx).  Lazy-populated by ensureCellNodesInRowsCache().
            cellNodesByColumnIdx: [],

            // Column indices of cell nodes that have been rendered, but not yet indexed in
            // cellNodesByColumnIdx.  These are in the same order as cell nodes added at the
            // end of the row.
            cellRenderQueue: []
          };

          appendRowHtml(stringArray, i, range, dataLength);
          if (activeCellNode && activeRow === i) {
            needToReselectCell = true;
          }
          counter_rows_rendered++;
        }
      }

      // collect not rendered range rows
      for (var i = range.top, ii = range.bottom; i <= ii; i++) {
        if (rowsCache[i]) {
          continue;
        }
        renderedRows++;
        rows.push(i);

        // Create an entry right away so that appendRowHtml() can
        // start populatating it.
        rowsCache[i] = {
          rowNode: null,

          // Cell nodes (by column idx).  Lazy-populated by ensureCellNodesInRowsCache().
          cellNodesByColumnIdx: [],

          // Column indices of cell nodes that have been rendered, but not yet indexed in
          // cellNodesByColumnIdx.  These are in the same order as cell nodes added at the
          // end of the row.
          cellRenderQueue: []
        };

        appendRowHtml(stringArray, i, range, dataLength);
        if (activeCellNode && activeRow === i) {
          needToReselectCell = true;
        }
        counter_rows_rendered++;
      }

      if (!rows.length) { return; }

      var x = document.createElement("div");
      x.innerHTML = stringArray.join("");

      var rowNodes = [];
      for (i = 0, ii = rows.length; i < ii; i++) {
        rowsCache[rows[i]].rowNode = parentNode.appendChild(x.firstChild);
        rowNodes.push(rowsCache[rows[i]]);
        // Safari 6.0.5 doesn't always render the new row immediately.
        // "Touching" the node's offsetWidth is sufficient to force redraw.
        if (isBrowser.safari605) {
          // this is a very costly operation in all browsers, so only run it for those which need it here:
          rowsCache[rows[i]].rowNode.offsetWidth;
        }
      }
      trigger(self.onRowsRendered, { rows: rows, nodes: rowNodes });

      if (needToReselectCell) {
        activeCellNode = getCellNode(activeRow, activeCell);
      }
    }

    function startPostProcessing() {
      if (!options.enableAsyncPostRender) {
        return;
      }
      clearTimeout(h_postrender);
      h_postrender = setTimeout(asyncPostProcessRows, options.asyncPostRenderDelay);
    }

    function invalidatePostProcessingResults(row) {
      delete postProcessedRows[row];
      postProcessFromRow = Math.min(postProcessFromRow, row);
      postProcessToRow = Math.max(postProcessToRow, row);
      startPostProcessing();
    }

    function render() {
      if (!initialized) { return; }
      var visible = getVisibleRange();
      var rendered = getRenderedRange();

      // remove rows no longer in the viewport
      cleanupRows(rendered);

      // add new rows & missing cells in existing rows
      if (lastRenderedScrollLeft != scrollLeft) {
        cleanUpAndRenderCells(rendered);
      }

      // render missing rows
      renderRows(rendered);

      postProcessFromRow = visible.top;
      postProcessToRow = Math.min(getDataLengthIncludingAddNew() - 1, visible.bottom);
      startPostProcessing();

      lastRenderedScrollTop = scrollTop;
      lastRenderedScrollLeft = scrollLeft;
    }

    function handleHeaderRowScroll() {
      var scrollLeft = $headerRowScroller[0].scrollLeft;
      if (scrollLeft != $viewport[0].scrollLeft) {
        $viewport[0].scrollLeft = scrollLeft;
      }
    }

    function handleScroll() {
      scrollTop = $viewport[0].scrollTop;
      scrollLeft = $viewport[0].scrollLeft;
      var vScrollDist = Math.abs(scrollTop - prevScrollTop);
      var hScrollDist = Math.abs(scrollLeft - prevScrollLeft);

      if (hScrollDist) {
        prevScrollLeft = scrollLeft;
        $headerScroller[0].scrollLeft = scrollLeft;
        $topPanelScroller[0].scrollLeft = scrollLeft;
        $headerRowScroller[0].scrollLeft = scrollLeft;
      }

      if (vScrollDist) {
        vScrollDir = prevScrollTop < scrollTop ? 1 : -1;
        prevScrollTop = scrollTop;

        // switch virtual pages if needed
        if (vScrollDist < viewportH) {
          scrollTo(scrollTop + pageOffset);
        } else {
          var oldOffset = pageOffset;
          if (scrollableHeight == viewportH) {
            // see https://github.com/mleibman/SlickGrid/issues/309
            page = numberOfPages - 1;
          } else {
            page = Math.min(numberOfPages - 1, Math.floor(scrollTop * ((virtualTotalHeight - viewportH) / (scrollableHeight - viewportH)) * (1 / pageHeight)));
          }
          pageOffset = Math.round(page * jumpinessCoefficient);
          if (oldOffset != pageOffset) {
            invalidateAllRows();
          }
        }
      }

      if (hScrollDist || vScrollDist) {
        if (h_render) {
          clearTimeout(h_render);
          h_render = null;
        }

        if (Math.abs(lastRenderedScrollTop - scrollTop) > 20 ||
            Math.abs(lastRenderedScrollLeft - scrollLeft) > 20) {
          if (options.forceSyncScrolling || (
              Math.abs(lastRenderedScrollTop - scrollTop) < viewportH &&
              Math.abs(lastRenderedScrollLeft - scrollLeft) < viewportW)) {
            render();
          } else {
            h_render = setTimeout(function () {
		        h_render = null;
            	render();
            }, 50);
          }

          trigger(self.onViewportChanged, {});
        }
      }

      trigger(self.onScroll, {scrollLeft: scrollLeft, scrollTop: scrollTop});
    }

    function asyncPostProcessRows() {
      var dataLength = getDataLength();
      while (postProcessFromRow <= postProcessToRow) {
        var row = (vScrollDir >= 0) ? postProcessFromRow++ : postProcessToRow--;
        var cacheEntry = rowsCache[row];
        if (!cacheEntry || row >= dataLength) {
          continue;
        }

        if (!postProcessedRows[row]) {
          postProcessedRows[row] = {};
        }

        ensureCellNodesInRowsCache(row);
        for (var columnIdx in cacheEntry.cellNodesByColumnIdx) {
          if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)) {
            continue;
          }

          columnIdx = columnIdx | 0;

          var m = columns[columnIdx];
          if (m.asyncPostRender && !postProcessedRows[row][columnIdx]) {
            var node = cacheEntry.cellNodesByColumnIdx[columnIdx];
            if (node) {
              m.asyncPostRender(node, row, getDataItem(row), m);
            }
            postProcessedRows[row][columnIdx] = true;
          }
        }

        h_postrender = setTimeout(asyncPostProcessRows, options.asyncPostRenderDelay);
        return;
      }
    }

    function updateCellCssStylesOnRenderedRows(addedHash, removedHash) {
      var node, columnId, addedRowHash, removedRowHash;
      for (var row in rowsCache) {
        removedRowHash = removedHash && removedHash[row];
        addedRowHash = addedHash && addedHash[row];

        if (removedRowHash) {
          for (columnId in removedRowHash) {
            if (!addedRowHash || removedRowHash[columnId] != addedRowHash[columnId]) {
              node = getCellNode(row, getColumnIndex(columnId));
              if (node) {
                $(node).removeClass(removedRowHash[columnId]);
              }
            }
          }
        }

        if (addedRowHash) {
          for (columnId in addedRowHash) {
            if (!removedRowHash || removedRowHash[columnId] != addedRowHash[columnId]) {
              node = getCellNode(row, getColumnIndex(columnId));
              if (node) {
                $(node).addClass(addedRowHash[columnId]);
              }
            }
          }
        }
      }
    }

    function addCellCssStyles(key, hash) {
      if (cellCssClasses[key]) {
        throw "addCellCssStyles: cell CSS hash with key '" + key + "' already exists.";
      }

      cellCssClasses[key] = hash;
      updateCellCssStylesOnRenderedRows(hash, null);

      trigger(self.onCellCssStylesChanged, { "key": key, "hash": hash });
    }

    function removeCellCssStyles(key) {
      if (!cellCssClasses[key]) {
        return;
      }

      updateCellCssStylesOnRenderedRows(null, cellCssClasses[key]);
      delete cellCssClasses[key];

      trigger(self.onCellCssStylesChanged, { "key": key, "hash": null });
    }

    function setCellCssStyles(key, hash) {
      var prevHash = cellCssClasses[key];

      cellCssClasses[key] = hash;
      updateCellCssStylesOnRenderedRows(hash, prevHash);

      trigger(self.onCellCssStylesChanged, { "key": key, "hash": hash });
    }

    // Note: when you wish to use the returned hash as (edited) input to setCellCssStyles(),
    // then the returned hash is a semi-deep clone (2 levels deep) as otherwise setCellCssStyles()
    // won't be able to see the change. See grid.flashCell() :: toggleCellClass() for an example.
    function getCellCssStyles(key, options) {
      var hash = cellCssClasses[key];
      if (options && options.clone) {
        // clone hash so setCellCssStyles() will be able to see the changes: cloning MUST be 2 levels deep!
        var o = {};
        for (var prop in hash) {
          var s = hash[prop];
          if (s) {
            var d = o[prop] = {};
            for (var p in s) {
              d[p] = s[p];
            }
          }
        }
        hash = o;
      }
      return hash;
    }

    // parameters:
    //   row,cell:    grid cell coordinate
    //   options:
    //     speed:     number of milliseconds one half of each ON/OFF toggle cycle takes (default: 100ms)
    //     times:     number of flash half-cycles to run through (default: 4) - proper 'flashing' requires you to set this to an EVEN number
    //     delay:     0/false: start flashing immediately. true: wait one half-cycle to begin flashing. <+N>: wait N milliseconds to begin flashing.
    //     cssClass:  the class to toggle; when set, this overrides the slickgrid options.cellFlashingCssClass
    //
    // Notes:
    // - when count = 0 or ODD, then the 'flash' class is SET [at the end of the flash period] but never reset!
    function flashCell(row, cell, flash_options) {
      flash_options = $.extend({}, {
        speed: 100,
        times: 4,
        delay: false,
        cssClass: options.cellFlashingCssClass
      }, flash_options);
      var key = "flashing";

      if (rowsCache[row]) {
        var $cell = $(getCellNode(row, cell));

        // and make sure intermediate .render() actions keep the 'flashing' class intact too!
        var id = columns[cell].id;
        var start_state = !$cell.hasClass(flash_options.cssClass);

        function toggleCellClass(times) {
          $cell.queue(function () {
            var hash = getCellCssStyles(key, { clone: true });
            var new_state = !$cell.hasClass(flash_options.cssClass);
            if (new_state) {
              // switch to ON
              if (!hash[row]) {
                hash[row] = {};
              }
              hash[row][id] = flash_options.cssClass;

              $cell.addClass(flash_options.cssClass);
            } else {
              // switch to OFF
              if (hash[row]) {
                delete hash[row][id];
              }

              $cell.removeClass(flash_options.cssClass);
            }
            setCellCssStyles(key, hash);
            execNextFlashPhase(times - 1);
            $cell.dequeue();
          });
        }

        function execNextFlashPhase(times) {
          if (times <= 0) {
            return;
          }
          setTimeout(function () {
            toggleCellClass(times);
          },
          flash_options.speed);
        }

        if (flash_options.delay) {
          setTimeout(function () {
            toggleCellClass(flash_options.times | 0);
          },
          flash_options.delay !== true ? flash_options.delay : flash_options.speed);
        } else {
          toggleCellClass(flash_options.times | 0);
        }
      }
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Interactivity

    // Handle header drags the way body drags are handled, so we set up a parallel
    // set of handlers to the ones used for body drags.
    function handleHeaderDragInit(e, dd) {
      var $header = $(e.target).closest(".slick-header-column", ".slick-header-columns");
      var column = $header && $header.data("column");

      if (!column) {
        return false;
      }

      dd.column = column;
      var retval = trigger(self.onHeaderDragInit, dd, e);
      if (e.isImmediatePropagationStopped()) {
        return retval;
      }

      // if nobody claims to be handling drag'n'drop by stopping immediate propagation,
      // cancel out of it
      return false;
    }

    function handleHeaderDragStart(e, dd) {
      var $header = $(e.target).closest(".slick-header-column", ".slick-header-columns");
      var column = $header && $header.data("column");

      if (!column) {
        return false;
      }

      dd.column = column;
      var retval = trigger(self.onHeaderDragStart, dd, e);
      if (e.isImmediatePropagationStopped()) {
        return retval;
      }

      return false;
    }

    function handleHeaderDrag(e, dd) {
      return trigger(self.onHeaderDrag, dd, e);
    }

    function handleHeaderDragEnd(e, dd) {
      return trigger(self.onHeaderDragEnd, dd, e);
    }

    function handleMouseWheel(e) {
      var rowNode = $(e.target).closest(".slick-row")[0];
      if (rowNode != rowNodeFromLastMouseWheelEvent) {
        if (zombieRowNodeFromLastMouseWheelEvent && zombieRowNodeFromLastMouseWheelEvent != rowNode) {
          $canvas[0].removeChild(zombieRowNodeFromLastMouseWheelEvent);
          zombieRowNodeFromLastMouseWheelEvent = null;
        }
        rowNodeFromLastMouseWheelEvent = rowNode;
      }
    }

    function handleDragInit(e, dd) {
      var cell = getCellFromEvent(e);
      if (!cell || !cellExists(cell.row, cell.cell)) {
        return false;
      }

      var retval = trigger(self.onDragInit, dd, e);
      if (e.isImmediatePropagationStopped()) {
        return retval;
      }

      // if nobody claims to be handling drag'n'drop by stopping immediate propagation,
      // cancel out of it
      return false;
    }

    function handleDragStart(e, dd) {
      var cell = getCellFromEvent(e);
      if (!cell || !cellExists(cell.row, cell.cell)) {
        return false;
      }

      var retval = trigger(self.onDragStart, dd, e);
      if (e.isImmediatePropagationStopped()) {
        return retval;
      }

      return false;
    }

    function handleDrag(e, dd) {
      return trigger(self.onDrag, dd, e);
    }

    function handleDragEnd(e, dd) {
      return trigger(self.onDragEnd, dd, e);
    }

    function handleKeyDown(e) {
      trigger(self.onKeyDown, {row: activeRow, cell: activeCell}, e);
      if (e.isImmediatePropagationStopped()) {
        return;
      }

      var handled;
      if (!e.shiftKey && !e.altKey && !e.ctrlKey) {
        if (e.which == 27) {
          if (!getEditorLock().isActive()) {
            return; // no editing mode to cancel, allow bubbling and default processing (exit without cancelling the event)
          }
          cancelEditAndSetFocus();
        } else if (e.which == 34) {
          navigatePageDown();
          handled = true;
        } else if (e.which == 33) {
          navigatePageUp();
          handled = true;
        } else if (e.which == 37) {
          handled = navigateLeft();
        } else if (e.which == 39) {
          handled = navigateRight();
        } else if (e.which == 38) {
          handled = navigateUp();
        } else if (e.which == 40) {
          handled = navigateDown();
        } else if (e.which == 9) {
          handled = navigateNext();
          } else if (e.which == 13 || e.which == 113 /* [F2] */) {
          if (options.editable) {
            if (currentEditor) {
              // adding new row
              if (activeRow === getDataLength()) {
                navigateDown();
              } else {
                commitEditAndSetFocus();
              }
            } else {
              if (getEditorLock().commitCurrentEdit()) {
                makeActiveCellEditable();
              }
            }
          }
          handled = true;
        }
      } else if (e.which == 9 && e.shiftKey && !e.ctrlKey && !e.altKey) {
        handled = navigatePrev();
      }

      if (handled) {
        // the event has been handled so don't let parent element (bubbling/propagation) or browser (default) handle it
        e.stopPropagation();
        e.preventDefault();
        try {
          e.originalEvent.keyCode = 0; // prevent default behaviour for special keys in IE browsers (F3, F5, etc.)
        }
        // ignore exceptions - setting the original event's keycode throws access denied exception for "Ctrl"
        // (hitting control key only, nothing else), "Shift" (maybe others)
        catch (error) {
        }
      }
    }

    function handleClick(e) {
      if (!currentEditor) {
        // if this click resulted in some cell child node getting focus,
        // don't steal it back - keyboard events will still bubble up
        // IE9+ seems to default DIVs to tabIndex=0 instead of -1, so check for cell clicks directly.
        if (e.target != document.activeElement || $(e.target).hasClass("slick-cell")) {
          var selection = getTextSelection(); // store text-selection and restore it after
          setFocus();
          setTextSelection(selection);
        }
      }

      var cell = getCellFromEvent(e);
      if (!cell || (currentEditor !== null && activeRow == cell.row && activeCell == cell.cell)) {
        return;
      }

      trigger(self.onClick, {row: cell.row, cell: cell.cell}, e);
      if (e.isImmediatePropagationStopped()) {
        return;
      }

      if ((activeCell != cell.cell || activeRow != cell.row) && canCellBeActive(cell.row, cell.cell)) {
        if (!getEditorLock().isActive() || getEditorLock().commitCurrentEdit()) {
          scrollRowIntoView(cell.row, false);
          setActiveCellInternal(getCellNode(cell.row, cell.cell), null);
        }
      }
    }

    function handleContextMenu(e) {
      var $cell = $(e.target).closest(".slick-cell", $canvas);
      if ($cell.length === 0) {
        return;
      }

      // are we editing this cell?
      if (activeCellNode === $cell[0] && currentEditor !== null) {
        return;
      }

      return trigger(self.onContextMenu, {}, e);
    }

    function handleDblClick(e) {
      var cell = getCellFromEvent(e);
      if (!cell || (currentEditor !== null && activeRow == cell.row && activeCell == cell.cell)) {
        return;
      }

      trigger(self.onDblClick, {row: cell.row, cell: cell.cell}, e);
      if (e.isImmediatePropagationStopped()) {
        return;
      }

      if (options.editable) {
        gotoCell(cell.row, cell.cell, 2 /* truthy value which 'wins' over options.asyncEditorLoading: open the editor immediately! */ );
      }
    }

    function handleHeaderMouseEnter(e) {
      return trigger(self.onHeaderMouseEnter, {
        column: $(this).data("column")
      }, e);
    }

    function handleHeaderMouseLeave(e) {
      return trigger(self.onHeaderMouseLeave, {
        column: $(this).data("column")
      }, e);
    }

    function handleHeaderContextMenu(e) {
      var $header = $(e.target).closest(".slick-header-column", ".slick-header-columns");
      var column = $header && $header.data("column");
      trigger(self.onHeaderContextMenu, {column: column}, e);
      // when the right-click context menu event actually was received by any handlers, then we make sure no default browser right-click popup menu shows up as well:
      if (self.onHeaderContextMenu.handlers().length) {
        // http://stackoverflow.com/questions/10483937/need-to-disable-context-menu-on-right-click-and-call-a-function-on-right-click
        e.preventDefault();
        return false;
      }
    }

    function handleHeaderClick(e) {
      var $header = $(e.target).closest(".slick-header-column", ".slick-header-columns");
      var column = $header && $header.data("column");
      if (column) {
        return trigger(self.onHeaderClick, {column: column}, e);
      }
    }

    function handleHeaderDblClick(e) {
      var $header = $(e.target).closest(".slick-header-column", ".slick-header-columns");
      var column = $header && $header.data("column");
      if (column) {
        return trigger(self.onHeaderDblClick, {column: column}, e);
      }
    }

    function handleMouseEnter(e) {
      return trigger(self.onMouseEnter, {}, e);
    }

    function handleMouseLeave(e) {
      return trigger(self.onMouseLeave, {}, e);
    }

    function cellExists(row, cell) {
      // catch NaN, undefined, etc. row/cell values by inclusive checks instead of exclusive checks:
      return (row < getDataLength() && row >= 0 && cell < columns.length && cell >= 0);
    }

    // Return the `{row: ?, cell: ?}` row/column grid coordinate at the given grid pixel coordinate (X, Y).
    //
    // Also return the 'fraction' of the position within the row and column, i.e.
    // if the Y coordinate points at a spot 25% from the top of the row, then
    // `returnValue.rowFraction` will be 0.25
    //
    // `returnValue.rowFraction == 0.0` would identify the top pixel within the row.
    // `returnValue.cellFraction == 0.0` would identify the left-most pixel within the cell.
    //
    // When the coordinate points outside the grid, out-of-range row/cell coordinates will be produced.
    function getCellFromPoint(x, y) {
      var rowInfo = getRowWithFractionFromPosition(y + pageOffset);
      var cell = 0;
      var cellFraction;

      var w = 0;
      var cellWidth = 0;
      for (var i = 0, l = columns.length; i < l && w < x; i++) {
        w += (cellWidth = columns[i].width);
        cell++;
      }

      // calculate fraction from the left edge:
      // (outside the grid range the cell.fraction represents the number of pixels it is out of range)
      x -= w;
      if (x < 0) {
        cell--;
        if (!cellWidth) {
          assert(cell == -1);
          cellWidth = 1;
        }
        x += cellWidth;
        cellFraction = x / cellWidth;
      } else if (x > 0) {
        if (!cellWidth) {
          assert(cell == columns.length);
          cellWidth = 1;
        }
        cellFraction = x / cellWidth;
      }

      return {
        row: rowInfo.position,
        cell: cell,
        rowFraction: rowInfo.fraction,
        cellFraction: cellFraction,
        cellWidth: cellWidth,
        cellHeight: rowInfo.height
      };
    }

    function getCellFromNode(cellNode) {
      // read column number from .l<columnNumber> CSS class
      var cls = /l\d+/.exec(cellNode.className);
      if (!cls) {
        throw "getCellFromNode: cannot get cell - " + cellNode.className;
      }
      return parseInt(cls[0].substr(1, cls[0].length - 1), 10);
    }

    function getRowFromNode(rowNode) {
      for (var row in rowsCache) {
        if (rowsCache[row].rowNode === rowNode) {
          return row | 0;
        }
      }

      return null;
    }

    function getCellFromEvent(e) {
      var $cell = $(e.target).closest(".slick-cell", $canvas);
      if (!$cell.length) {
        return null;
      }

      var row = getRowFromNode($cell[0].parentNode);
      var cell = getCellFromNode($cell[0]);

      if (row == null || cell == null) {
        return null;
      } else {
        return {
          row: row,
          cell: cell
        };
      }
    }

    function getRowFromEvent(e) {
      var $row = $(e.target).closest(".slick-row", $canvas);
      if (!$row.length) {
        return null;
      }
      return getRowFromNode($row[0]);
    }

    function getCellNodeBox(row, cell) {
      if (!cellExists(row, cell)) {
        return null;
      }

      var y1 = getRowTop(row) - pageOffset;
      var y2 = y1 + getRowHeight(row) - 1;
      var x1 = getColumnOffset(cell);
      var x2 = x1 + columns[cell].width;

      return {
        top: y1,
        left: x1,
        bottom: y2,
        right: x2
      };
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Cell switching

    function resetActiveCell() {
      setActiveCellInternal(null, false);
    }

    function setFocus() {
      if (tabbingDirection == -1) {
        $focusSink[0].focus();
      } else {
        $focusSink2[0].focus();
      }
    }

    // This get/set methods are used for keeping text-selection.
    // These don't consider IE because they don't loose text-selection.
    function getTextSelection() {
      var selection = null;
      if (window.getSelection && window.getSelection().rangeCount > 0) {
        selection = window.getSelection().getRangeAt(0);
      }
      return selection;
    }

    function setTextSelection(selection) {
      if (window.getSelection && selection) {
        var target = window.getSelection();
        target.removeAllRanges();
        target.addRange(selection);
      }
    }

    function scrollCellIntoView(row, cell, doPaging, doCenteringY) {
      scrollRowIntoView(row, doPaging, doCenteringY);

      var colspan = getColspan(row, cell);
      var left = columnPosLeft[cell],
          right = columnPosLeft[cell + colspan],
          scrollRight = scrollLeft + viewportW;    // availableWidth = viewportHasVScroll ? viewportW - scrollbarDimensions.width : viewportW

      if (left < scrollLeft) {
        $viewport.scrollLeft(left);
        handleScroll();
        render();
      } else if (right > scrollRight) {
        $viewport.scrollLeft(Math.min(left, right - $viewport[0].clientWidth));
        handleScroll();
        render();
      }
    }

    function setActiveCellInternal(newCell, opt_editMode) {
      if (activeCellNode !== null) {
        makeActiveCellNormal();
        $(activeCellNode).removeClass("active");
        $(activeCellNode).parent().removeClass("active-row");
        if (rowsCache[activeRow]) {
          $(rowsCache[activeRow].rowNode).removeClass("active");
          $(rowsCache[activeRow].rowNode).parent().removeClass("active-row");
        }
      }

      var activeCellChanged = (activeCellNode !== newCell);
      var prevActiveCell = activeCellNode;
      activeCellNode = newCell;

      if (activeCellNode != null) {
        activeRow = activePosY = getRowFromNode(activeCellNode.parentNode);
        activeCell = activePosX = getCellFromNode(activeCellNode);
        if (opt_editMode == null) {
          opt_editMode = (activeRow == getDataLength()) || options.autoEdit;
        }

        $(activeCellNode).addClass("active");
        $(rowsCache[activeRow].rowNode).addClass("active");
        $(activeCellNode).parent().addClass("active-row");
        $(rowsCache[activeRow].rowNode).parent().addClass("active-row");

	    // onActiveCellChanged should fire before we *might* instantiate an editor!
	    // This order of events is important so that the editor-augmented cell instance doesn't get
	    // influenced by any initial onActiveCellChanged that concerns the cell itself.
	    //
	    // It also allows us to renege on the 'cell change' inside this event handler without
	    // too much trouble (or so we can hope)...
	    if (activeCellChanged) {
	      //activeCellNode.focus();
        var e = new Slick.EventData();
	      trigger(self.onActiveCellChanged, {
	      	activeCell: getActiveCell(),
	      	prevActiveCell: prevActiveCell,
	      	editMode:   opt_editMode,
	      }, e);
	      if (e.isImmediatePropagationStopped()) {
	        return;
	      }
	    }

        if (options.editable && opt_editMode && isCellPotentiallyEditable(activeRow, activeCell)) {
          clearTimeout(h_editorLoader);
          h_editorLoader = null;

          // if opt_editMode > 1 then show the editor immediately (this happens for instance when the cell is double-clicked)
          if (options.asyncEditorLoading >= opt_editMode) {
            h_editorLoader = setTimeout(function () {
              makeActiveCellEditable();
            }, options.asyncEditorLoadDelay);
          } else {
            makeActiveCellEditable();
          }
        }
      } else {
        activeRow = activeCell = null;
      }
    }

    function clearTextSelection() {
      if (document.selection && document.selection.empty) {
        try {
          //IE fails here if selected element is not in dom
          document.selection.empty();
        } catch (e) { }
      } else if (window.getSelection) {
        var sel = window.getSelection();
        if (sel && sel.removeAllRanges) {
          sel.removeAllRanges();
        }
      }
    }

    function isCellPotentiallyEditable(row, cell) {
      var dataLength = getDataLength();
      // is the data for this row loaded?
      if (row < dataLength && !getDataItem(row)) {
        return false;
      }

      // are we in the Add New row?  can we create new from this cell?
      if (columns[cell].cannotTriggerInsert && row >= dataLength) {
        return false;
      }

      // does this cell have an editor?
      if (!getEditor(row, cell)) {
        return false;
      }

      return true;
    }

    function makeActiveCellNormal() {
      if (!currentEditor) {
        return;
      }
      // reset the global var as any node.destroy() can trigger additional focusout events which will trigger a commit:
      // only by immediately resetting the global and keeping the 'old' value locally for further processing
      // can we prevent nested invocations of this code (and consequent crashes in jQuery).
      var editor = currentEditor;
      currentEditor = null;
      var e = new Slick.EventData();
      trigger(self.onBeforeCellEditorDestroy, {editor: editor}, e);
      if (e.isImmediatePropagationStopped()) {
        return;
      }
      editor.destroy();

      if (activeCellNode) {
        var d = getDataItem(activeRow);
        $(activeCellNode).removeClass("editable invalid");
        if (d) {
          var column = columns[activeCell];
          var rowMetadata = data.getItemMetadata && data.getItemMetadata(activeRow, activeCell);
          // look up by id, then index
          var columnMetadata = rowMetadata && rowMetadata.columns && (rowMetadata.columns[column.id] || rowMetadata.columns[activeCell]);
          var fmt = mkCellHtml(activeRow, activeCell, rowMetadata, columnMetadata, d);
          var el = $(activeCellNode);
          el.attr("style", fmt.cellStyles.length ? fmt.cellStyles.join(";") + ";" : null);
          el.attr("class", fmt.cellCss.join(" "));
          el.html(fmt.html);
          invalidatePostProcessingResults(activeRow);
        }
      }

      // if there previously was text selected on a page (such as selected text in the edit cell just removed),
      // IE can't set focus to anything else correctly
      if (isBrowser.msie) {
        clearTextSelection();
      }

      getEditorLock().deactivate(editController);
    }

    function makeActiveCellEditable(editor) {
      if (!activeCellNode) {
        return false;
      }
      if (!options.editable) {
        throw "Grid : makeActiveCellEditable : should never get called when options.editable is false";
      }

      // cancel pending async call if there is one
      clearTimeout(h_editorLoader);
      h_editorLoader = null;

      if (!isCellPotentiallyEditable(activeRow, activeCell)) {
        return false;
      }

      var columnDef = columns[activeCell];
      var item = getDataItem(activeRow);
      var rowMetadata = data.getItemMetadata && data.getItemMetadata(activeRow, activeCell);

      // look up by id, then index
      var columnMetadata = rowMetadata &&
          rowMetadata.columns &&
          (rowMetadata.columns[column.id] || rowMetadata.columns[activeCell]);

      var e = new Slick.EventData();
      trigger(self.onBeforeEditCell, {
      	row: activeRow,
      	cell: activeCell,
      	item: item,
      	column: columnDef,
        rowMetadata: rowMetadata,
        columnMetadata: columnMetadata,
      }, e);
      if (e.isImmediatePropagationStopped()) {
        setFocus();
        return false;
      }

      getEditorLock().activate(editController);
      $(activeCellNode).addClass("editable");

      // don't clear the cell if a custom editor is passed through
      if (!editor && options.clearCellBeforeEdit) {
        activeCellNode.innerHTML = "";
      }

      var info = $.extend({}, options.editorOptions, columnDef.editorOptions, {
        grid: self,
        gridPosition: getGridPosition(),
        position: getActiveCellPosition(),
        container: activeCellNode,
        column: columnDef,
        item: item || {},
        rowMetadata: rowMetadata,
        columnMetadata: columnMetadata,
        commitChanges: commitEditAndSetFocus,
        cancelChanges: cancelEditAndSetFocus
      });
      currentEditor = new (editor || getEditor(activeRow, activeCell))(info);

      if (item) {
        currentEditor.loadValue(item);
      }

      serializedEditorValue = currentEditor.serializeValue();

      var cellBox = getActiveCellPosition();
      if (currentEditor.show && currentEditor.hide) {
        if (!cellBox.visible) {
          currentEditor.hide();
        } else {
          currentEditor.show();
        }
      }

      return currentEditor; // this is a truthy return value
    }

    function commitEditAndSetFocus() {
      // if the commit fails, it would do so due to a validation error
      // if so, do not steal the focus from the editor
      if (getEditorLock().commitCurrentEdit()) {
        setFocus();
        if (options.autoEdit) {
          navigateDown();
        }
      }
    }

    function cancelEditAndSetFocus() {
      if (getEditorLock().cancelCurrentEdit()) {
        setFocus();
      }
    }

    function absBox(elem) {
      if (!elem) {
        // produce a box which is positioned way outside the visible area.
        // Note: use values > 1e15 to abuse the floating point artifact
        // where adding small values to such numbers is neglected due
        // to mantissa limitations (e.g. 1e30 + 1 == 1e30)
        return {
          top: 1e38,
          left: 1e38,
          bottom: 1e38,
          right: 1e38,
          width: 0,
          height: 0,
          visible: false // <-- that's the important bit!
        };
      }
      var box = {
        top: elem.offsetTop,
        left: elem.offsetLeft,
        bottom: 0,
        right: 0,
        width: $(elem).outerWidth(),
        height: $(elem).outerHeight(),
        visible: true
      };
      box.bottom = box.top + box.height;
      box.right = box.left + box.width;

      // walk up the tree
      var offsetParent = elem.offsetParent;
      while ((elem = elem.parentNode) != document.body) {
        if (!elem) {
          // when we end up at elem===null, then the elem has been detached
          // from the DOM and all our size calculations are useless:
          // produce a box which is positioned at (0,0) and has a size of (0,0).
          // return {
          //   top: 0,
          //   left: 0,
          //   bottom: 0,
          //   right: 0,
          //   width: 0,
          //   height: 0,
          //   visible: false // <-- that's the important bit!
          // };
          box.visible = false; // <-- that's the important bit!
          return box;
        }
        if (box.visible && elem.scrollHeight != elem.offsetHeight && $(elem).css("overflowY") != "visible") {
          box.visible = box.bottom > elem.scrollTop && box.top < elem.scrollTop + elem.clientHeight;
        }

        if (box.visible && elem.scrollWidth != elem.offsetWidth && $(elem).css("overflowX") != "visible") {
          box.visible = box.right > elem.scrollLeft && box.left < elem.scrollLeft + elem.clientWidth;
        }

        box.left -= elem.scrollLeft;
        box.top -= elem.scrollTop;

        if (elem === offsetParent) {
          box.left += elem.offsetLeft;
          box.top += elem.offsetTop;
          offsetParent = elem.offsetParent;
        }

        box.bottom = box.top + box.height;
        box.right = box.left + box.width;
      }

      return box;
    }

    function getActiveCellPosition() {
      return absBox(activeCellNode);
    }

    function getGridPosition() {
      return absBox($container[0]);
    }

    function handleActiveCellPositionChange() {
      if (!activeCellNode) {
        return;
      }

      var e = new Slick.EventData();
      trigger(self.onActiveCellPositionChanged, {}, e);
      if (e.isImmediatePropagationStopped()) {
        return;
      }

      if (currentEditor) {
        var cellBox = getActiveCellPosition();
        if (currentEditor.show && currentEditor.hide) {
          if (!cellBox.visible) {
            currentEditor.hide();
          } else {
            currentEditor.show();
          }
        }

        if (currentEditor.position) {
          currentEditor.position({
            gridPosition: getGridPosition(),
            position: cellBox,
            container: activeCellNode
          });
        }
      }
    }

    function getCellEditor() {
      return currentEditor;
    }

    function getActiveCell() {
      if (!activeCellNode) {
        return null;
      } else {
        return {row: activeRow, cell: activeCell};
      }
    }

    function getActiveCellNode() {
      return activeCellNode;
    }

    function scrollRowIntoView(row, doPaging, doCentering) {
      var height = viewportH - (viewportHasHScroll ? scrollbarDimensions.height : 0);
      var rowAtTop = getRowTop(row);
      var rowAtBottom = getRowBottom(row) - height;

      // need to center row?
      if (doCentering) {
        var centerOffset = (height - options.rowHeight) / 2;
        scrollTo(rowAtTop - centerOffset);
        render();
      }
      // need to page down?
      if (getRowBottom(row) > scrollTop + viewportH + pageOffset) {
        scrollTo(doPaging ? rowAtTop : rowAtBottom);
        render();
      }
      // or page up?
      else if (getRowTop(row) < scrollTop + pageOffset) {
        scrollTo(doPaging ? rowAtBottom : rowAtTop);
        render();
      }
    }

    function scrollRowToTop(row) {
      scrollTo(getRowTop(row));
      render();
    }

    function scrollPage(dir) {
      var topRow = getRowWithFractionFromPosition(scrollTop + pageOffset);
      var bottomRow = getRowWithFractionFromPosition(scrollTop + pageOffset + viewportH);
      var deltaRows = dir * (bottomRow.position - topRow.position);
      scrollTo(getRowTop(bottomRow.position));
      render();

      if (options.enableCellNavigation && activeRow != null) {
        var row = activeRow + deltaRows;
        var dataLengthIncludingAddNew = getDataLengthIncludingAddNew();
        if (row >= dataLengthIncludingAddNew) {
          row = dataLengthIncludingAddNew - 1;
        }
        if (row < 0) {
          row = 0;
        }

        var cell = 0, prevCell = null;
        var prevActivePosX = activePosX;
        while (cell <= activePosX) {
          if (canCellBeActive(row, cell)) {
            prevCell = cell;
          }
          cell += getColspan(row, cell);
        }

        if (prevCell !== null) {
          setActiveCellInternal(getCellNode(row, prevCell), null);
          activePosX = prevActivePosX;
        } else {
          resetActiveCell();
        }
      }
    }

    function navigatePageDown() {
      scrollPage(1);
    }

    function navigatePageUp() {
      scrollPage(-1);
    }

    function getSpans(row, cell) {
      if (!data.getItemMetadata) {
        return null;
      }
      var col,
          colspan,
          rowspan,
          metadata,
          columnData,
          iRowSpans,
          iCellSpans,
          colCount = columns.length,
          dataLength = getDataLength(),
          rowI,
          rowU;

      for (rowI = cellSpans.length, rowU = row; rowI <= rowU; rowI++) {
        metadata = data.getItemMetadata(rowI, cell);

        // current row might have cell spans filled in prev row iterations
        iRowSpans = cellSpans[rowI] || (cellSpans[rowI] = {
          maxRowSpan: 1
        });

        if (!metadata || !metadata.columns) {
          continue;
        }

        for (var ci = 0; ci < colCount; ci += colspan) {
          col = columns[ci];

          iCellSpans = iRowSpans[ci];

          // the ci-th cell is occupied by a prev cell with row and/or cell span > 1
          if (iCellSpans) {
            colspan = ci - iCellSpans[1] + iCellSpans[3];
            continue;
          }

          // look up by id, then index
          columnData = metadata.columns[col.id] || metadata.columns[ci];
          if (!columnData) {
            colspan = 1;
            continue;
          }

          colspan = columnData.colspan || 1;
          rowspan = columnData.rowspan || 1;
          if (rowspan > dataLength - rowI) {
            rowspan = dataLength - rowI;
          }
          if (colspan === "*") {
            colspan = colCount - ci;
          }
          if (rowspan > iRowSpans.maxRowSpan) {
            iRowSpans.maxRowSpan = rowspan;
          }

          if (rowspan > 1 || colspan > 1) {
            iCellSpans = [rowI, ci, rowspan, colspan];
            // save pointers to span head cell and
            var rowSpanU = rowI + rowspan - 1;
            for (var rs = rowI; rs <= rowSpanU; rs++) {
              for (var cs = ci; cs < ci + colspan; cs++) {
                (cellSpans[rs] || (cellSpans[rs] = {}))[cs] = iCellSpans;
              }
            }
            // need to collect spans for rows overlapped by the cell
            if (rowSpanU > rowU) {
              rowU = rowSpanU;
            }
          }
        }
      }

      return cellSpans[row] && cellSpans[row][cell];
    }

    function getColspan(row, cell) {
      var spans = getSpans(row, cell);
      assert(spans ? spans.length === 4 : true);
      assert(spans ? spans[3] >= 1 : true);
      return spans ? spans[3] - cell + spans[1] : 1;
    }

    function getRowspan(row, cell) {
      var spans = getSpans(row, cell);
      assert(spans ? spans.length === 4 : true);
      assert(spans ? spans[2] >= 1 : true);
      return spans ? spans[2] - row + spans[0] : 1;
    }

    /** Returns the row index of the cell that spans to the cell specified by `row` and `cell`. */
    function getSpanRow(row, cell) {
      var spans = getSpans(row, cell);
      assert(spans ? spans.length === 4 : true);
      return spans ? spans[0] : row;
    }

    /** Returns the column index of the cell that spans to the cell specified by `row` and `cell`. */
    function getSpanCell(row, cell) {
      var spans = getSpans(row, cell);
      assert(spans ? spans.length === 4 : true);
      return spans ? spans[1] : cell;
    }

    function findFirstFocusableCell(row) {
      var cell = 0, spanRow;
      while (cell < columns.length) {
        spanRow = getSpanRow(row, cell);
        if (canCellBeActive(spanRow, cell)) {
          return cell;
        }
        cell += getColspan(row, cell);
      }
      return null;
    }

    function findLastFocusableCell(row) {
      var cell = columns.length - 1;
      var lastFocusableCell = null;
      var spanRow, spanCell;
      while (cell >= 0) {
        spanCell = getSpanCell(row, cell);
        spanRow = getSpanRow(row, cell);
        if (canCellBeActive(spanRow, spanCell)) {
          lastFocusableCell = cell;
          break;
        }
        cell = getSpanCell(row, cell - 1);
      }
      return lastFocusableCell;
    }

    function gotoRight(row, cell, posY, posX) {
      if (cell >= columns.length) {
        return null;
      }

      do {
        cell += getColspan(posY, cell);
      } while (cell < columns.length && !canCellBeActive((row = getSpanRow(posY, cell)), cell));

      if (cell < columns.length) {
        return {
          row: row,
          cell: cell,
          posY: posY,
          posX: cell
        };
      }
      return null;
    }

    function gotoLeft(row, cell, posY, posX) {
      if (cell <= 0) {
        return null;
      }
      do {
        cell = getSpanCell(posY, cell - 1);
        row = getSpanRow(posY, cell);
      } while (cell >= 0 && !canCellBeActive(row, cell));

      if (cell >= 0) {
        return {
          row: row,
          cell: cell,
          posY: posY,
          posX: cell
        };
      }
      return null;
    }

    function gotoDown(row, cell, posY, posX) {
      var dataLengthIncludingAddNew = getDataLengthIncludingAddNew();
      var ub = dataLengthIncludingAddNew;
      do {
        row += getRowspan(row, posX);
      } while (row <= ub && !canCellBeActive(row, cell = getSpanCell(row, posX)));

      if (row <= ub) {
        return {
          row: row,
          cell: cell,
          posY: row,
          posX: posX
        };
      }
      return null;
    }

    function gotoUp(row, cell, posY, posX) {
      if (row <= 0) {
        return null;
      }
      do {
        row = getSpanRow(row - 1, posX);
        cell = getSpanCell(row, posX);
      } while (row >= 0 && !canCellBeActive(row, cell));

      if (row >= 0 && cell < columns.length) {
        return {
          row: row,
          cell: cell,
          posY: row,
          posX: posX
        };
      }
      return null;
    }

    function gotoNext(row, cell, posY, posX) {
      if (row == null && cell == null) {
        row = cell = posY = posX = 0;
        if (canCellBeActive(row, cell)) {
          return {
            row: row,
            cell: cell,
            posY: posY,
            posX: cell
          };
        }
      }

      var pos = gotoRight(row, cell, posY, posX);
      if (!pos) {
        var firstFocusableCell;
        var dataLengthIncludingAddNew = getDataLengthIncludingAddNew();
        while (!pos && ++posY < dataLengthIncludingAddNew) {
          firstFocusableCell = findFirstFocusableCell(posY);
          if (firstFocusableCell !== null) {
            row = getSpanRow(posY, firstFocusableCell);
            pos = {
              row: row,
              cell: firstFocusableCell,
              posY: posY,
              posX: firstFocusableCell
            };
          }
        }
      }
      return pos;
    }

    function gotoPrev(row, cell, posY, posX) {
      if (row == null && cell == null) {
        row = posY = getDataLengthIncludingAddNew() - 1;
        cell = posX = columns.length - 1;
        if (canCellBeActive(row, cell)) {
          return {
            row: row,
            cell: cell,
            posY: posY,
            posX: cell
          };
        }
      }

      var pos = gotoLeft(row, cell, posY, posX);
      if (!pos) {
        var lastSelectableCell;
        while (!pos && --posY >= 0) {
          lastSelectableCell = findLastFocusableCell(posY);
          if (lastSelectableCell !== null) {
            row = getSpanRow(posY, lastSelectableCell);
            pos = {
              row: row,
              cell: lastSelectableCell,
              posY: posY,
              posX: lastSelectableCell
            };
          }
        }
      }
      return pos;
    }

    function navigateRight() {
      return navigate("right");
    }

    function navigateLeft() {
      return navigate("left");
    }

    function navigateDown() {
      return navigate("down");
    }

    function navigateUp() {
      return navigate("up");
    }

    function navigateNext() {
      return navigate("next");
    }

    function navigatePrev() {
      return navigate("prev");
    }

    /**
     * @param {string} dir Navigation direction.
     * @return {boolean} Whether navigation resulted in a change of active cell.
     */
    function navigate(dir) {
      if (!options.enableCellNavigation) {
        return false;
      }

      if (!activeCellNode && dir != "prev" && dir != "next") {
        return false;
      }

      if (!getEditorLock().commitCurrentEdit()) {
        return true;
      }
      setFocus();

      var tabbingDirections = {
        "up": -1,
        "down": 1,
        "left": -1,
        "right": 1,
        "prev": -1,
        "next": 1
      };
      tabbingDirection = tabbingDirections[dir];

      var stepFunctions = {
        "up": gotoUp,
        "down": gotoDown,
        "left": gotoLeft,
        "right": gotoRight,
        "prev": gotoPrev,
        "next": gotoNext
      };
      var stepFn = stepFunctions[dir];
      var pos = stepFn(activeRow, activeCell, activePosY, activePosX);
      if (pos) {
        var isAddNewRow = (pos.row === getDataLength());
        scrollCellIntoView(pos.row, pos.cell, !isAddNewRow);
        setActiveCellInternal(getCellNode(pos.row, pos.cell), null);
        activePosY = pos.posY;
        activePosX = pos.posX;
        return true;
      } else {
        setActiveCellInternal(getCellNode(activeRow, activeCell), null);
        return false;
      }
    }

    function getCellNode(row, cell) {
      if (rowsCache[row]) {
        ensureCellNodesInRowsCache(row);
        return rowsCache[row].cellNodesByColumnIdx[cell];
      }
      return null;
    }

    function setActiveCell(row, cell) {
      if (!initialized) { return; }
      // catch NaN, undefined, etc. row/cell values by inclusive checks instead of exclusive checks:
      if (row < getDataLength() && row >= 0 && cell < columns.length && cell >= 0) {
        if (!options.enableCellNavigation) {
          return;
        }

        scrollCellIntoView(row, cell, false);
        setActiveCellInternal(getCellNode(row, cell), false);
      }
    }

    function canCellBeActive(row, cell) {
      // catch NaN, undefined, etc. row/cell values by inclusive checks instead of exclusive checks:
      if (options.enableCellNavigation && row < getDataLengthIncludingAddNew() && row >= 0 && cell < columns.length && cell >= 0) {
        var column = columns[cell];
        var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, cell);
        if (rowMetadata) {
          var columnMetadata = rowMetadata.columns;
          // look up by id, then index
          columnMetadata = columnMetadata && (columnMetadata[column.id] || columnMetadata[cell]);
          if (columnMetadata) {
            if (columnMetadata.transparent === true) {
              return false;
            }
            if (typeof columnMetadata.focusable === "boolean") {
              return columnMetadata.focusable;
            }
          }

          if (typeof rowMetadata.focusable === "boolean") {
            return rowMetadata.focusable;
          }
        }

        return column.focusable;
      }
      return false;
    }

    function canCellBeSelected(row, cell) {
      // catch NaN, undefined, etc. row/cell values by inclusive checks instead of exclusive checks:
      if (row < getDataLength() && row >= 0 && cell < columns.length && cell >= 0) {
        var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, cell);
        if (rowMetadata && typeof rowMetadata.selectable === "boolean") {
          return rowMetadata.selectable;
        }

        var column = columns[cell];
        // look up by id, then index
        var columnMetadata = rowMetadata && rowMetadata.columns && (rowMetadata.columns[column.id] || rowMetadata.columns[cell]);
        if (columnMetadata && typeof columnMetadata.selectable === "boolean") {
          return columnMetadata.selectable;
        }

        return column.selectable;
      }
      return false;
    }

    function gotoCell(row, cell, forceEdit) {
      if (!initialized) { return; }
      if (!canCellBeActive(row, cell)) {
        return;
      }

      if (!getEditorLock().commitCurrentEdit()) {
        return;
      }

      scrollCellIntoView(row, cell, false);

      var newCell = getCellNode(row, cell);

      // if selecting the 'add new' row, start editing right away
      setActiveCellInternal(newCell, forceEdit || (row === getDataLength()) || options.autoEdit);

      // if no editor was created, set the focus back on the grid
      if (!currentEditor) {
        setFocus();
      }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // IEditor implementation for the editor lock

    function commitCurrentEdit() {
      var item = getDataItem(activeRow);
      var column = columns[activeCell];
      var evt;

      if (currentEditor) {
        if (currentEditor.isValueChanged()) {
          var validationResults = currentEditor.validate();

          if (validationResults.valid) {
            if (activeRow < getDataLength()) {
              evt = self.onCellChange;
            } else {
              item = item || {};
              evt = self.onAddNewRow;
            }
            var editCommand = {
              row: activeRow,
              cell: activeCell,
              item: item,
              column: column,
              editor: currentEditor,
              serializedValue: currentEditor.serializeValue(),
              prevSerializedValue: serializedEditorValue,
              execute: function () {
                this.appliedValue = this.serializedValue;
                this.editor.applyValue(item, this.appliedValue);
                updateRow(this.row);
                this.notify();
              },
              undo: function () {
                this.appliedValue = this.prevSerializedValue;
                this.editor.applyValue(item, this.appliedValue);
                updateRow(this.row);
                this.notify();
              },
              notify: function() {
                trigger(self.onCellChange, this);
              }
            };

            if (options.editCommandHandler) {
              options.editCommandHandler(item, column, editCommand);
            } else {
              editCommand.execute();
            }
            makeActiveCellNormal();

            // check whether the lock has been re-acquired by event handlers
            return !getEditorLock().isActive();
          } else {
            // Re-add the CSS class to trigger transitions, if any.
            $(activeCellNode).removeClass("invalid");
            $(activeCellNode).width();  // force layout
            $(activeCellNode).addClass("invalid");

            var e = new Slick.EventData();
            var retval = trigger(self.onValidationError, {
              row: activeRow,
              cell: activeCell,
              item: item,
              column: column,
              editor: currentEditor,
              prevSerializedValue: serializedEditorValue,

              cellNode: activeCellNode,
              validationResults: validationResults
            }, e);
    		    if (e.isImmediatePropagationStopped()) {
    		      return retval;
    		    }

            currentEditor.focus();
            return false;
          }
        }

        makeActiveCellNormal();
      }
      return true;
    }

    function cancelCurrentEdit() {
      makeActiveCellNormal();
      return true;
    }

    function rowsToRanges(rows) {
      var ranges = [];
      var lastCell = columns.length - 1;
      for (var i = 0; i < rows.length; i++) {
        ranges.push(new Slick.Range(rows[i], 0, rows[i], lastCell));
      }
      return ranges;
    }

    function getSelectedRows() {
      if (!selectionModel) {
        throw "Selection model is not set";
      }
      return selectedRows;
    }

    function setSelectedRows(rows) {
      if (!selectionModel) {
        throw "Selection model is not set";
      }
      selectionModel.setSelectedRanges(rowsToRanges(rows));
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Debug

    this.debug = function ($dst) {
      var s = "";

      s += ("\n" + "counter_rows_rendered:  " + counter_rows_rendered);
      s += ("\n" + "counter_rows_removed:  " + counter_rows_removed);
      s += ("\n" + "renderedRows:  " + renderedRows);
      s += ("\n" + "numVisibleRows:  " + numVisibleRows);
      s += ("\n" + "maxSupportedCssHeight:  " + maxSupportedCssHeight);
      s += ("\n" + "n(umber of pages):  " + numberOfPages);
      s += ("\n" + "(current) page:  " + page);
      s += ("\n" + "page height (pageHeight):  " + pageHeight);
      s += ("\n" + "vScrollDir:  " + vScrollDir);

      if ($dst) {
      	$dst.text(s);
      } else {
      	alert(s);
      }
    };

    // a debug helper to be able to access private members
    this.eval = function (expr) {
      return eval(expr);
    };

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Public API

    $.extend(this, {
      "slickGridVersion": "2.2",

      // Events
      "onScroll": new Slick.Event(),
      "onSort": new Slick.Event(),
      "onHeaderMouseEnter": new Slick.Event(),
      "onHeaderMouseLeave": new Slick.Event(),
      "onHeaderContextMenu": new Slick.Event(),
      "onHeaderClick": new Slick.Event(),
      "onHeaderDblClick": new Slick.Event(),
      "onHeaderCellRendered": new Slick.Event(),
      "onBeforeHeaderCellDestroy": new Slick.Event(),
      "onHeaderRowCellRendered": new Slick.Event(),
      "onBeforeHeaderRowCellDestroy": new Slick.Event(),
      "onMouseEnter": new Slick.Event(),
      "onMouseLeave": new Slick.Event(),
      "onClick": new Slick.Event(),
      "onDblClick": new Slick.Event(),
      "onContextMenu": new Slick.Event(),
      "onKeyDown": new Slick.Event(),
      "onAddNewRow": new Slick.Event(),
      "onValidationError": new Slick.Event(),
      "onCanvasWidthChanged": new Slick.Event(),
      "onViewportChanged": new Slick.Event(),
      "onColumnsStartReorder": new Slick.Event(),
      "onColumnsReordering": new Slick.Event(),
      "onColumnsReordered": new Slick.Event(),
      "onColumnsStartResize": new Slick.Event(), // onColumnsResizeStart
      "onColumnsResizing": new Slick.Event(),
      "onColumnsResized": new Slick.Event(),
      "onCellChange": new Slick.Event(),
      "onBeforeEditCell": new Slick.Event(),
      "onBeforeCellEditorDestroy": new Slick.Event(),
      "onBeforeDestroy": new Slick.Event(),
      "onActiveCellChanged": new Slick.Event(),
      "onActiveCellPositionChanged": new Slick.Event(),
      "onHeaderDragInit": new Slick.Event(),
      "onHeaderDragStart": new Slick.Event(),
      "onHeaderDrag": new Slick.Event(),
      "onHeaderDragEnd": new Slick.Event(),
      "onDragInit": new Slick.Event(),
      "onDragStart": new Slick.Event(),
      "onDrag": new Slick.Event(),
      "onDragEnd": new Slick.Event(),
      "onSelectedRowsChanged": new Slick.Event(),
      "onCellCssStylesChanged": new Slick.Event(),
      "onRowsRendered": new Slick.Event(),

      // Methods
      "registerPlugin": registerPlugin,
      "unregisterPlugin": unregisterPlugin,
      "getColumns": getColumns,
      "setColumns": setColumns,
      "getColumnIndex": getColumnIndex,
      "updateColumnHeader": updateColumnHeader,
      "setSortColumn": setSortColumn,
      "setSortColumns": setSortColumns,
      "getSortColumns": getSortColumns,
      "autosizeColumns": autosizeColumns,
      "getOptions": getOptions,
      "setOptions": setOptions,
      "getData": getData,
      "getDataLength": getDataLength,
      "getDataItem": getDataItem,
      "setData": setData,
      "getSelectionModel": getSelectionModel,
      "setSelectionModel": setSelectionModel,
      "getSelectedRows": getSelectedRows,
      "setSelectedRows": setSelectedRows,
      "getContainerNode": getContainerNode,
      "isInitialized": isInitialized,

      "render": render,
      "invalidate": invalidate,
      "invalidateRow": invalidateRow,
      "invalidateRows": invalidateRows,
      "invalidateAllRows": invalidateAllRows,
      "updateCell": updateCell,
      "updateRow": updateRow,
      "getViewport": getVisibleRange,
      "getRenderedRange": getRenderedRange,
      "getContentSize": getContentSize,
      "getVisibleSize": getVisibleSize,
      "resizeCanvas": resizeCanvas,
      "updateRowCount": updateRowCount,
      "scrollRowIntoView": scrollRowIntoView,
      "scrollRowToTop": scrollRowToTop,
      "scrollCellIntoView": scrollCellIntoView,
      "getCanvasNode": getCanvasNode,
      "focus": setFocus,

      "getCellFromPoint": getCellFromPoint,
      "getCellFromEvent": getCellFromEvent,
      "getRowFromEvent": getRowFromEvent,
      "getActiveCell": getActiveCell,
      "setActiveCell": setActiveCell,
      "getActiveCellNode": getActiveCellNode,
      "getActiveCellPosition": getActiveCellPosition,
      "resetActiveCell": resetActiveCell,
      "editActiveCell": makeActiveCellEditable,
      "commitEditAndSetFocus": commitEditAndSetFocus,
      "cancelEditAndSetFocus": cancelEditAndSetFocus,

      "getCellEditor": getCellEditor,
      "getCellNode": getCellNode,
      "getCellNodeBox": getCellNodeBox,
      "canCellBeSelected": canCellBeSelected,
      "canCellBeActive": canCellBeActive,
      "navigatePrev": navigatePrev,
      "navigateNext": navigateNext,
      "navigateUp": navigateUp,
      "navigateDown": navigateDown,
      "navigateLeft": navigateLeft,
      "navigateRight": navigateRight,
      "navigatePageUp": navigatePageUp,
      "navigatePageDown": navigatePageDown,
      "gotoCell": gotoCell,
      "getTopPanel": getTopPanel,
      "setTopPanelVisibility": setTopPanelVisibility,
      "setHeaderRowVisibility": setHeaderRowVisibility,
      "getHeaderRow": getHeaderRow,
      "getHeaderRowColumn": getHeaderRowColumn,
      "getHeadersColumn": getHeadersColumn,
      "getGridPosition": getGridPosition,
      "flashCell": flashCell,
      "addCellCssStyles": addCellCssStyles,
      "setCellCssStyles": setCellCssStyles,
      "removeCellCssStyles": removeCellCssStyles,
      "getCellCssStyles": getCellCssStyles,

      "handleKeyDown": handleKeyDown,

      "init": finishInitialization,
      "destroy": destroy,

      // IEditor implementation
      "getEditorLock": getEditorLock,
      "getEditController": getEditController
    });

    init();
  }
}(jQuery));
