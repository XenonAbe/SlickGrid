(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "CellCopyManager": CellCopyManager
    }
  });


  function CellCopyManager(options) {
    var _grid;
    var _self = this;
    var _copiedRanges;    // keeps track of the last marked (Ctrl-C copied) range
    var _options = options || {};
    var _copiedCellStyleLayerKey = _options.copiedCellStyleLayerKey || "copy-manager";
    var _copiedCellStyle = _options.copiedCellStyle || "copied";

    var keyCodes = {
      'C':67,
      'V':86,
      'X':88,
      'ESC':27
    }

    function init(grid) {
      _grid = grid;
      _grid.onKeyDown.subscribe(handleKeyDown);
    }

    function destroy() {
      _grid.onKeyDown.unsubscribe(handleKeyDown);
    }

    function handleKeyDown(e, args) {
      var ranges;
      if (!_grid.getEditorLock().isActive()) {
        if (e.which == keyCodes.ESC) {
          if (_copiedRanges) {
            e.preventDefault();
            clearCopySelection();
            _self.onCopyCancelled.notify({
              ranges: _copiedRanges,
              rangeIsCopied: _copiedRanges.copy
            });
            _copiedRanges = null;
          }
        }

        // Control+C / Control+X  -- these have the same effect on initial range
        if ((e.which == keyCodes.C || e.which == keyCodes.X) && (e.ctrlKey || e.metaKey)) {
          ranges = _grid.getSelectionModel().getSelectedRanges();

          // also remember whether this was Ctrl-C (copy) or Ctrl-X (cut):
          ranges.copy = (e.which == keyCodes.C);

          if (ranges.length != 0) {
            e.preventDefault();
            _copiedRanges = ranges;
            markCopySelection(ranges);
            _self.onCopyCells.notify({ranges: ranges, rangeIsCopied: ranges.copy });

            return false;
          }
        }

        // Control+V
        if (e.which == keyCodes.V && (e.ctrlKey || e.metaKey)) {
          if (_copiedRanges) {
            e.preventDefault();
            ranges = _grid.getSelectionModel().getSelectedRanges();
            _self.onPasteCells.notify({
              from: _copiedRanges,
              to: ranges,
              rangeIsCopied: _copiedRanges.copy,
              rangeDataFromExternalSource: false
            });
            // allow for Ctrl-C, Ctrl-V, Ctrl-V, ... repeated paste sequences to be all 'internal' based on that single Ctrl-C copied range!
            //
            // the ctrl-X effect is to delete original range at the first ctrl-V, so no repeat performance for that one though!
            if (!_copiedRanges.copy) {
              clearCopySelection();
              _copiedRanges = null;
            }
          }

          return false;
        }
      }
    }

    function markCopySelection(ranges) {
      clearCopySelection();

      var columns = _grid.getColumns();
      var hash = {};
      for (var i = 0; i < ranges.length; i++) {
        for (var j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
          hash[j] = {};
          for (var k = ranges[i].fromCell; k <= ranges[i].toCell && k < columns.length; k++) {
            hash[j][columns[k].id] = _copiedCellStyle;
          }
        }
      }
      _grid.setCellCssStyles(_copiedCellStyleLayerKey, hash);
    }

    function clearCopySelection() {
      _grid.removeCellCssStyles(_copiedCellStyleLayerKey);
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy,
      "clearCopySelection": clearCopySelection,
      "handleKeyDown": handleKeyDown,

      "onCopyCells": new Slick.Event(),
      "onCopyCancelled": new Slick.Event(),
      "onPasteCells": new Slick.Event()
    });
  }
})(jQuery);