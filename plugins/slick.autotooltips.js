(function ($) {
  // Register namespace
  $.extend(true, window, {
    Slick: {
      AutoTooltips: AutoTooltips
    }
  });

  /**
   * AutoTooltips plugin to show/hide tooltips when columns are too narrow to fit content.
   * @constructor
   * @param {boolean}  [options.enableForCells=true]        - Enable tooltip for grid cells
   * @param {boolean}  [options.enableForHeaderCells=false] - Enable tooltip for header cells
   * @param {number}   [options.maxToolTipLength=0]         - The maximum length for a tooltip
   * @param {function} [options.getTooltip]                 - Produces the tooltip text; empty if no tooltip should be shown
   */
  function AutoTooltips(options) {
    var _grid;
    var _self = this;
    var _defaults = {
      enableForCells: true,
      enableForHeaderCells: false,
      maxToolTipLength: 0,
      getTooltip: function (info) {
        var text, headertext;
        if (info.$node.innerWidth() < info.$node[0].scrollWidth) {
          text = $.trim(info.$node.text());
          if (info.options.maxToolTipLength && text.length > info.options.maxToolTipLength) {
            text = text.substr(0, info.options.maxToolTipLength - 3) + "...";
          }
        } else {
          text = "";
        }
        if (info.inHeader) {
          headertext = info.column.toolTip;
          if (!headertext) {
            headertext = info.column.longName ? info.column.longName : info.column.name;
          }
          if (headertext) {
            text = headertext;
          }
        }        
        return text;
      }
    };

    /**
     * Initialize plugin.
     */
    function init(grid) {
      options = $.extend(true, {}, _defaults, options);
      _grid = grid;
      if (options.enableForCells) _grid.onMouseEnter.subscribe(handleMouseEnter);
      if (options.enableForHeaderCells) _grid.onHeaderMouseEnter.subscribe(handleHeaderMouseEnter);
    }

    /**
     * Destroy plugin.
     */
    function destroy() {
      if (options.enableForCells) _grid.onMouseEnter.unsubscribe(handleMouseEnter);
      if (options.enableForHeaderCells) _grid.onHeaderMouseEnter.unsubscribe(handleHeaderMouseEnter);
    }

    /**
     * Handle mouse entering grid cell to add/remove tooltip.
     * @param {jQuery.Event} e - The event
     */
    function handleMouseEnter(e) {
      var cell = _grid.getCellFromEvent(e);
      if (cell) {
        var $node = $(_grid.getCellNode(cell.row, cell.cell));
        var columnDef = _grid.getColumns()[cell.cell];
        assert(columnDef);
        assert($node.length === 1);
        var text = options.getTooltip({
            inHeader: false,
            row: cell.row,
            cell: cell.cell,
            columnDef: columnDef,
            $node: $node,
            options: options
        });
        $node.attr("title", text);
      }
    }

    /**
     * Handle mouse entering header cell to add/remove tooltip.
     * @param {jQuery.Event} e     - The event
     * @param {object} args.column - The column definition
     */
    function handleHeaderMouseEnter(e, args) {
      var columnDef = args.column,
          $node = $(e.target).closest(".slick-header-column");
      assert(columnDef);
      if (!columnDef.toolTip) {
        var columnDef = _grid.getColumns()[cell.cell];
        assert($node.length === 1);
        var text = options.getTooltip({
            inHeader: true,
            columnDef: columnDef,
            $node: $node,
            options: options
        });
        $node.attr("title", text);
      }
    }

    // Public API
    $.extend(this, {
      "init": init,
      "destroy": destroy
    });
  }
})(jQuery);
