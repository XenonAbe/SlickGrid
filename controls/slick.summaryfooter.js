(function ($) {
  function SlickGridSummaryFooter(dataView, grid, $container) {
    var $status;
    var columnFilters = {};
    var columns;
    var items;
    var columnSummaries = {};

    function init() {
      grid.onHeaderRowCellRendered.subscribe(function(e, args) {
        updateSummaryFooter(args);
      });

      /*dataView.onPagingInfoChanged.subscribe(function (e, pagingInfo) {
        updateSummaryFooterRowCount(pagingInfo);
      });*/

      dataView.onRowsChanged.subscribe(function (e, args) {
        items = dataView.getItems();

        constructSummaries();

        grid.invalidateRows(args.rows);
        grid.render();

        constructSummaryFooterUI();
      });

      grid.onColumnsReordered.subscribe(function (e, obj) {
        columns = grid.getColumns();
        constructSummaryFooterUI();
      });

      grid.onColumnsResized.subscribe(function (e, obj) {
        columns = grid.getColumns();
        constructSummaryFooterUI();
      });

      columns = grid.getColumns();
    }

    function constructSummaries() {
      for (var it = 0; it < items.length; it++) {
        var row = items[it];

        for (var i = 0; i < columns.length; i++) {
          var m = columns[i];

          if (!isNaN(String(row[m.id]))) {
            if (!columnSummaries[m.id]) {
              columnSummaries[m.id] = 0;
            }

            columnSummaries[m.id] = columnSummaries[m.id] + row[m.id];
          }
        }
      }
      console.log(columnSummaries);
    }

    function constructSummaryFooterUI() {
      $container.empty();

      $headerScroller = $("<div class='slick-footer ui-state-default' style='overflow:hidden;position:relative;' />").appendTo($container);
      $headers = $("<div class='slick-footer-columns' style='left:-1000px' />").appendTo($headerScroller);
      $headers.width(grid.getHeadersWidth());

      /*$headerRowScroller = $("<div class='slick-footerrow ui-state-default' style='overflow:hidden;position:relative;' />").appendTo($container);
      $headerRow = $("<div class='slick-footerrow-columns' />").appendTo($headerRowScroller);
      $headerRowSpacer = $("<div style='display:block;height:1px;position:absolute;top:0;left:0;'></div>")
          .css("width", grid.getCanvasWidth() + grid.getScrollbarDimensions().width + "px")
          .appendTo($headerRowScroller);*/

      $container.children().wrapAll("<div class='slick-summaryfooter' />");

      function onMouseEnter() {
        $(this).addClass("ui-state-hover");
      }

      function onMouseLeave() {
        $(this).removeClass("ui-state-hover");
      }

      $headers.find(".slick-footer-column")
        .each(function() {
          var columnDef = $(this).data("column");
        });
      $headers.empty();
      $headers.width(grid.getHeadersWidth());

      $headers.find(".slick-footerrow-column")
        .each(function() {
          var columnDef = $(this).data("column");
        });
      $headers.empty();

      for (var i = 0; i < columns.length; i++) {
        var m = columns[i];
        var value = "";

        if (columnSummaries[m.id]) {
          if (m.summaryFormatter) {
            value = m.summaryFormatter(columnSummaries[m.id]);
          }
        }

        var header = $("<div class='ui-state-default slick-footer-column slick-summaryfooter-column' id='" + grid.getUID() + m.id + "' />")
            .html("<span class='slick-column-name' title='" + value + "'>" + value + "</span>")
            .width(m.width - grid.getHeaderColumnWidthDiff())
            .attr("title", m.toolTip || "")
            .data("column", m)
            .addClass(m.headerCssClass || "")
            .appendTo($headers);

        //if (options.showHeaderRow) {
          /*var headerRowCell = $("<div class='ui-state-default slick-footerrow-column l" + i + " r" + i + "'></div>")
              .data("column", m)
              .appendTo($headerRow);*/
        //}
      }
    }


    function updateSummaryFooter(args) {
      /*var state = getNavState();

      $container.find(".slick-summaryfooter-nav span").removeClass("ui-state-disabled");
      if (!state.canGotoFirst) {
        $container.find(".ui-icon-seek-first").addClass("ui-state-disabled");
      }
      if (!state.canGotoLast) {
        $container.find(".ui-icon-seek-end").addClass("ui-state-disabled");
      }
      if (!state.canGotoNext) {
        $container.find(".ui-icon-seek-next").addClass("ui-state-disabled");
      }
      if (!state.canGotoPrev) {
        $container.find(".ui-icon-seek-prev").addClass("ui-state-disabled");
      }*/

      $($status).empty();
        $("<input type='text'>")
           .data("columnId", args.column.id)
           .appendTo($status);
    }

    init();
  }

  // Slick.Controls.SummaryFooter
  $.extend(true, window, { Slick:{ Controls:{ SummaryFooter:SlickGridSummaryFooter }}});
})(jQuery);
