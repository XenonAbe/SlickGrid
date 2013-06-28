(function ($) {
  $.extend(true, window, {
    Slick: {
      Data: {
        HiddenItemMetadataProvider: HiddenItemMetadataProvider
      }
    }
  });


  /***
   * Provides item metadata for hidden rows produced by the DataView.
   * This metadata overrides the default behavior and formatting of those rows so that they appear and function
   * correctly when processed by the grid.
   *
   * Allows rows to 'show' as hidden on the grid as opposed to being completely invisible as implemented with a filter. This way,
   * click event can be handled on the 'hidden' row.
   *
   * This class also acts as a grid plugin providing event handlers to hide & unhide rows.
   * If "grid.registerPlugin(...)" is not called, hide & unhide will not work.
   *
   * @class GroupItemMetadataProvider
   * @module Data
   * @namespace Slick.Data
   * @constructor
   * @param options
   */
  function HiddenItemMetadataProvider(options) {
    var _grid;
    var _dblClickPrompt = '';
    var _defaults = {
      firstHiddenItemCssClass: "slick-first-hidden-row",
      trailingHiddenItemCssClass: "slick-trailing-hidden-row",
      hiddenItemCssClass: "slick-hidden-row"
    };

    options = $.extend(true, {}, _defaults, options);

    function defaultHiddenCellFormatter(row, cell, value, columnDef, item) {

      return "<span class='" + options.hiddenItemCssClass + "'></span>";
    }

    function init(grid) {
      _grid = grid;
      _grid.onDblClick.subscribe(handleGridDblClick);
      _grid.onCellChange.subscribe(handleGridCellChange);

    }

    function destroy() {
      if (_grid) {
        _grid.onDblClick.unsubscribe(handleGridDblClick);
        _grid.onCellChange.unsubscribe(handleGridCellChange);
      }
    }

    /*An editor may have hidden the row*/
    function handleGridCellChange(e, args) {
      var data = this.getData(args.item);
      data.updateRowHiddenState(e, _grid, args.item);
    }

    /*Raise hidden double clicked to allow for unhiding actions*/
    function handleGridDblClick(e, args) {
      var item = this.getDataItem(args.row);
      var target = $(e.target)[0];
      if (item && target && target.parentElement && $(target.parentElement).hasClass(options.hiddenItemCssClass)) {
        var data = this.getData(args.item);
        data.handleHiddenRowDblClick(e, args.grid, args.row);
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }

    function getHiddenRowMetadata(item, rowIndex, rows) {
      var previousRow = rows[rowIndex - 1];
      if (previousRow.__group) {
        previousRow = rows[rowIndex - 2];
      }

      var cssClasses = options.hiddenItemCssClass;
      if (previousRow && previousRow.__hidden) {
        cssClasses = cssClasses + ' ' + options.trailingHiddenItemCssClass;
      } else {
        cssClasses = cssClasses + ' ' + options.firstHiddenItemCssClass;
      }

      return {
        selectable: false,
        focusable: false,
        cssClasses: cssClasses,
        titleText: 'Double click to unhide rows.',
        columns: {
          0: {
            colspan: "*",
            formatter: defaultHiddenCellFormatter,
            editor: null
          }
        }
      };
    }

    return {
      "init": init,
      "destroy": destroy,
      "getHiddenRowMetadata": getHiddenRowMetadata
    };
  }
})(jQuery);