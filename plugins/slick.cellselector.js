(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "CellSelector": CellSelector
    }
  });


  function CellSelector(options) {
    var _grid;
    var _canvas;
    var _dragging;
    var _decorator;
    var _self = this;
    var _handler = new Slick.EventHandler();

    function init(grid) {
      options = $.extend(true, {}, options);
      _decorator = new Slick.CellRangeDecorator(grid, options);
      _grid = grid;
      _canvas = _grid.getCanvasNode();
    }

    function destroy() {
      _handler.unsubscribeAll();
    }

	$.extend(this, {
      "init": init,
      "destroy": destroy,

      "onBeforeCellSelected": new Slick.Event(),
      "onCellSelected": new Slick.Event()
    });
  }
})(jQuery);