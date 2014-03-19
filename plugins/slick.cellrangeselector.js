(function ($) {
  // register namespace
  $.extend(true, window, {
    Slick: {
      CellRangeSelector: CellRangeSelector
    }
  });


  function CellRangeSelector(options) {
    var _grid;
    var _gridOptions;
    var _$activeCanvas;
    var _dragging;
    var _decorator;
    var _self = this;
    var _handler = new Slick.EventHandler();
    var _defaults = {
      selectionCss: {
        border: "2px dashed blue"
      }
    };

    // Frozen row & column variables
    var _rowOffset;
    var _columnOffset;
    var _isRightCanvas;
    var _isBottomCanvas;

    function init(grid) {
      options = $.extend(true, {}, _defaults, options);
      _decorator = new Slick.CellRangeDecorator(grid, options);
      _grid = grid;
      _gridOptions = _grid.getOptions();
      _handler
        .subscribe(_grid.onDragInit, handleDragInit)
        .subscribe(_grid.onDragStart, handleDragStart)
        .subscribe(_grid.onDrag, handleDrag)
        .subscribe(_grid.onDragEnd, handleDragEnd);
    }

    function destroy() {
      _handler.unsubscribeAll();
    }

    function handleDragInit(e, dd) {
      // Set the active canvas node because the decorator needs to append its
      // box to the correct canvas
      _$activeCanvas = $( _grid.getActiveCanvasNode( e ) );
      _dragging = false;

      var c = _$activeCanvas.offset();

      _rowOffset = 0;
      _columnOffset = 0;
      _isBottomCanvas = _$activeCanvas.hasClass( 'grid-canvas-bottom' );

      if ( _gridOptions.frozenRow > -1 && _isBottomCanvas ) {
        _rowOffset = ( _gridOptions.frozenBottom ) ? $('.grid-canvas-bottom').height() : $('.grid-canvas-top').height();
      }

      _isRightCanvas = _$activeCanvas.hasClass( 'grid-canvas-right' );

      if ( _gridOptions.frozenColumn > -1 && _isRightCanvas ) {
        _columnOffset = $('.grid-canvas-left').width();
      }

      // prevent the grid from cancelling drag'n'drop by default
      e.stopImmediatePropagation();
    }

    function handleDragStart(e, dd) {
      var cell = _grid.getCellFromEvent(e);
      var evt = new Slick.EventData(e);
      var state = _self.onBeforeCellRangeSelected.notify(cell, evt);
      if (state === false ||
          evt.isPropagationStopped() || evt.isImmediatePropagationStopped() ||
          !_grid.canCellBeSelected(cell.row, cell.cell)) {
        return;
      }
      _dragging = true;
      e.stopImmediatePropagation();

      _grid.focus();

      var start = _grid.getCellFromPoint(
          dd.startX - _$activeCanvas.offset().left + _columnOffset,
          dd.startY - _$activeCanvas.offset().top + _rowOffset
      );

      dd.range = {start: start, end: {}};
      dd.currentCell = cell;

      return _decorator.show(new Slick.Range(start.row, start.cell));
    }

    function handleDrag(e, dd) {
      if (!_dragging) {
        return;
      }
      e.stopImmediatePropagation();

      var end = _grid.getCellFromPoint(
          e.pageX - _$activeCanvas.offset().left + _columnOffset,
          e.pageY - _$activeCanvas.offset().top + _rowOffset
      );

      var eventData = {
          range: dd.range,
          currentCell: end
      };
      var evt = new Slick.EventData(e);
      var state = _self.onCellRangeSelectionOngoing.notify(eventData, evt);
      if (state === false ||
          evt.isPropagationStopped() || evt.isImmediatePropagationStopped() ||
          !eventData.currentCell ||
          !_grid.canCellBeSelected(eventData.currentCell.row, eventData.currentCell.cell) ||
          ( !_isRightCanvas && ( eventData.currentCell.cell > _gridOptions.frozenColumn ) ) ||
          ( _isRightCanvas && ( eventData.currentCell.cell <= _gridOptions.frozenColumn ) ) ||
          ( !_isBottomCanvas && ( eventData.currentCell.row >= _gridOptions.frozenRow ) ) ||
          ( _isBottomCanvas && ( eventData.currentCell.row < _gridOptions.frozenRow ) ) ) {
        return;
      }

      dd.range.end = eventData.currentCell;
      _decorator.show(new Slick.Range(dd.range.start.row, dd.range.start.cell, dd.range.end.row, dd.range.end.cell));
    }

    function handleDragEnd(e, dd) {
      if (!_dragging) {
        return;
      }

      _dragging = false;
      e.stopImmediatePropagation();

      _decorator.hide();
      var evt = new Slick.EventData(e);
      _self.onCellRangeSelected.notify({
        range: new Slick.Range(
            dd.range.start.row,
            dd.range.start.cell,
            dd.range.end.row,
            dd.range.end.cell
        )
      }, evt);
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy,

      "onBeforeCellRangeSelected": new Slick.Event(),
      "onCellRangeSelectionOngoing": new Slick.Event(),
      "onCellRangeSelected": new Slick.Event()
    });
  }
})(jQuery);