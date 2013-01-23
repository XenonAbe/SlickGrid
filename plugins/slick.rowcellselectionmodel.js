(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "RowCellSelectionModel": RowCellSelectionModel
    }
  });

  function RowCellSelectionModel(options) {
    var _grid;
    var _canvas;
    var _ranges = [];
    var _self = this;
    var _selector = new Slick.CellSelector();
	var _handler = new Slick.EventHandler();
    var _inHandler;
    var _options;
    var _defaults = {
      selectActiveCell: true,
	  selectActiveRow: true
    };

    function init(grid) {
      _options = $.extend(true, {}, _defaults, options);
      _grid = grid;
      _canvas = _grid.getCanvasNode();
      _grid.onActiveCellChanged.subscribe(handleActiveCellChange);
      grid.registerPlugin(_selector);
      _selector.onCellSelected.subscribe(handleCellSelected);
      _selector.onBeforeCellSelected.subscribe(handleBeforeCellSelected);
	  _handler.subscribe(_grid.onActiveCellChanged, wrapHandler(handleActiveCellChange));
      _handler.subscribe(_grid.onKeyDown, wrapHandler(handleKeyDown));
      _handler.subscribe(_grid.onClick, wrapHandler(handleClick));
    }

    function destroy() {
      _grid.onActiveCellChanged.unsubscribe(handleActiveCellChange);
      _selector.onCellSelected.unsubscribe(handleCellSelected);
      _selector.onBeforeCellSelected.unsubscribe(handleBeforeCellSelected);
      _grid.unregisterPlugin(_selector);
	   _handler.unsubscribeAll();
    }
	
	function wrapHandler(handler) {
      return function () {
        if (!_inHandler) {
          _inHandler = true;
          handler.apply(this, arguments);
          _inHandler = false;
        }
      };
    }

    function rangesToRows(ranges) {
      var rows = [];
      for (var i = 0; i < ranges.length; i++) {
        for (var j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
          rows.push(j);
        }
      }
      return rows;
    }

    function rowsToRanges(rows) {
      var ranges = [];
      var lastCell = _grid.getColumns().length - 1;
      for (var i = 0; i < rows.length; i++) {
        ranges.push(new Slick.Range(rows[i], 0, rows[i], lastCell));
      }
      return ranges;
    }

    function getRowsRange(from, to) {
      var i, rows = [];
      for (i = from; i <= to; i++) {
        rows.push(i);
      }
      for (i = to; i < from; i++) {
        rows.push(i);
      }
      return rows;
    }

    function getSelectedRows() {
      return rangesToRows(_ranges);
    }

    function setSelectedRows(rows) {
      setSelectedRanges(rowsToRanges(rows));
    }

    function handleKeyDown(e) {
      var activeRow = _grid.getActiveCell();
      if (activeRow && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && (e.which == 38 || e.which == 40)) {
        var selectedRows = getSelectedRows();
        selectedRows.sort(function (x, y) {
          return x - y
        });

        if (!selectedRows.length) {
          selectedRows = [activeRow.row];
        }

        var top = selectedRows[0];
        var bottom = selectedRows[selectedRows.length - 1];
        var active;

        if (e.which == 40) {
          active = activeRow.row < bottom || top == bottom ? ++bottom : ++top;
        } else {
          active = activeRow.row < bottom ? --bottom : --top;
        }

        if (active >= 0 && active < _grid.getDataLength()) {
          _grid.scrollRowIntoView(active);
          _ranges = rowsToRanges(getRowsRange(top, bottom));
          setSelectedRanges(_ranges);
        }

        e.preventDefault();
        e.stopPropagation();
      }
    }

    function handleClick(e) {
      var cell = _grid.getCellFromEvent(e);
      if (!cell || !_grid.canCellBeActive(cell.row, cell.cell)) {
        return false;
      }

      var selection = rangesToRows(_ranges);
      var idx = $.inArray(cell.row, selection);

      if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
        return false;
      }
      else if (_grid.getOptions().multiSelect) {
        if (idx === -1 && (e.ctrlKey || e.metaKey)) {
          selection.push(cell.row);
          _grid.setActiveCell(cell.row, cell.cell);
        } else if (idx !== -1 && (e.ctrlKey || e.metaKey)) {
          selection = $.grep(selection, function (o, i) {
            return (o !== cell.row);
          });
          _grid.setActiveCell(cell.row, cell.cell);
        } else if (selection.length && e.shiftKey) {
          var last = selection.pop();
          var from = Math.min(cell.row, last);
          var to = Math.max(cell.row, last);
          selection = [];
          for (var i = from; i <= to; i++) {
            if (i !== last) {
              selection.push(i);
            }
          }
          selection.push(last);
          _grid.setActiveCell(cell.row, cell.cell);
        }
      }

      _ranges = rowsToRanges(selection);
      setSelectedRanges(_ranges);
      e.stopImmediatePropagation();

      return true;
    }

    function removeInvalidRanges(ranges) {
      var result = [];

      for (var i = 0; i < ranges.length; i++) {
        var r = ranges[i];
        if (_grid.canCellBeSelected(r.fromRow, r.fromCell) && _grid.canCellBeSelected(r.toRow, r.toCell)) {
          result.push(r);
        }
      }

      return result;
    }

    function setSelectedRanges(ranges) {
      _ranges = removeInvalidRanges(ranges);
      _self.onSelectedRangesChanged.notify(_ranges);
    }

    function getSelectedRanges() {
      return _ranges;
    }

    function handleBeforeCellSelected(e, args) {
      if (_grid.getEditorLock().isActive()) {
        e.stopPropagation();
        return false;
      }
    }

    function handleCellSelected(e, args) {
      setSelectedRanges([args.range]);
    }

    function handleActiveCellChange(e, args) {
	  if (_options.selectActiveRow && data.row != null) {
        setSelectedRanges([new Slick.Range(data.row, 0, data.row, _grid.getColumns().length - 1)]);
      }
    }

    $.extend(this, {
      "getSelectedRows": getSelectedRows,
      "setSelectedRows": setSelectedRows,

      "getSelectedRanges": getSelectedRanges,
      "setSelectedRanges": setSelectedRanges,

      "init": init,
      "destroy": destroy,

      "onSelectedRangesChanged": new Slick.Event()
    });
  }
})(jQuery);