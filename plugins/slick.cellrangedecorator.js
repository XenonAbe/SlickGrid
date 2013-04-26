(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "CellRangeDecorator": CellRangeDecorator
    }
  });

  /***
   * Displays an overlay on top of a given cell range.
   *
   * TODO:
   * Currently, it blocks mouse events to DOM nodes behind it.
   * Use FF and WebKit-specific "pointer-events" CSS style, or some kind of event forwarding.
   * Could also construct the borders separately using 4 individual DIVs.
   *
   * @param {Grid} grid
   * @param {Object} options
   */
  function CellRangeDecorator(grid, options) {
    var _elem;
    var _elem_range;
    var _defaults = {
      borderThickness: 2,
      selectionCss: {
        "zIndex": "9999",
        "border": "2px dashed red"
      }
    };

    options = $.extend(true, {}, _defaults, options);

    function calcRangeBox(range) {
      if (!range) {
        return null;
      }
      var from = grid.getCellNodeBox(range.fromRow, range.fromCell);
      var to = grid.getCellNodeBox(range.toRow, range.toCell);

      // prevent JS crash when trying to decorate header cells, as those would
      // produce from/to == null as .fromRow/.toRow would be < 0:
      if (from && to) {
        return {
          top: from.top,
          left: from.left,
          height: to.bottom - from.top - 2 * options.borderThickness,
          width: to.right - from.left - 2 * options.borderThickness - 1 
        };
      } else {
        // TBD
        return null;
      }
    }

    function show(range) {
      if (!_elem) {
        _elem = $("<div></div>", {css: options.selectionCss})
            .css("position", "absolute")
            .appendTo(grid.getCanvasNode());
      }

      // remember our input range (clone!)
      _elem_range = {
        frowRow: range.fromRow, 
        fromCell: range.fromCell,
        towRow: range.toRow, 
        toCell: range.toCell
      };

      var box = calcRangeBox(range);
      if (box) {
        _elem.css(box);
      } else {
        // TBD
      }

      return _elem;
    }

    function hide() {
      if (_elem) {
        _elem.remove();
        _elem = null;
      }
    }

    function getInfo() {
      return {
        el: _elem,
        range: _elem_range,
        uiRect: calcRangeBox(_elem_range)
      };
    }

    $.extend(this, {
      "show": show,
      "hide": hide,
      "getInfo": getInfo
    });
  }
})(jQuery);