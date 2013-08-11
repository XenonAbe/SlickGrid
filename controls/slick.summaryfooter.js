(function ($) {
  function SlickGridSummaryFooter(dataView, grid, $container) {
    var $status;
    var columnFilters = {};
    var columns;
    var items;
    var columnSummaries = {};

    function handleDataChanged(e, args) {
      var rows = [];
      var length = dataView.getLength();
      for (var i = 0; i < length; i++) {
        rows.push(dataView.getItem(i));
      }

      items = rows;

      constructSummaries();
      constructSummaryFooterUI();
    }

    function init() {
      dataView.onPagingInfoChanged.subscribe(handleDataChanged);

      dataView.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();

        handleDataChanged(e, args);
      });

      grid.onColumnsReordered.subscribe(function (e, obj) {
        columns = grid.getColumns();
        constructSummaryFooterUI();
      });

      grid.onColumnsResized.subscribe(function (e, obj) {
        columns = grid.getColumns();
        constructSummaryFooterUI();
      });

      grid.onScroll.subscribe(function (scrollLeft, scrollTop) {
        //columns = grid.getColumns();
        //constructSummaryFooterUI();
      });

      columns = grid.getColumns();
    }

    function constructSummaries() {
      columnSummaries = {};
      
      var itemsLength = items.length;
      for (var it = 0; it < itemsLength; it++) {
        var row = items[it];

        if (row.__group) {
          if (row.collapsed == 1) {
            var rowsLength = row.rows.length;
            for (var itG = 0; itG < rowsLength; itG++) {
              var groupRow = row.rows[itG];

              var columnsLength = columns.length;
              for (var i = 0; i < columnsLength; i++) {
                var m = columns[i];
                var value = groupRow[m.field];

                if (m.summaryFormatter) {
                  if (!isNaN(value)) {
                    if (!columnSummaries[m.id]) {
                      columnSummaries[m.id] = 0;
                    }

                    columnSummaries[m.id] = columnSummaries[m.id] + value;
                  }
                }
              }
            }
          }
        } else {
          var columnsLength = columns.length;
          for (var i = 0; i < columnsLength; i++) {
            var m = columns[i];
            var value = row[m.field];

            if (m.summaryFormatter) {
              if (!isNaN(value)) {
                if (!columnSummaries[m.id]) {
                  columnSummaries[m.id] = 0;
                }

                columnSummaries[m.id] = columnSummaries[m.id] + value;
              }
            }
          }
        }
      }
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

      var columnsLength = columns.length;
      for (var i = 0; i < columnsLength; i++) {
        var m = columns[i];
        var value = "";

        if (columnSummaries[m.id]) {
          if (m.summaryFormatter) {
            value = m.summaryFormatter(columnSummaries[m.id]);
          }
        }

        var header = $("<div class='ui-state-default slick-footer-column slick-summaryfooter-column' id='" + grid.getUID() + m.id + "_summary' />")
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

    init();
  }

  // Slick.Controls.SummaryFooter
  $.extend(true, window, { Slick:{ Controls:{ SummaryFooter:SlickGridSummaryFooter }}});
})(jQuery);
