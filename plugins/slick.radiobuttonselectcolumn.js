(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "RadiobuttonSelectColumn": RadiobuttonSelectColumn
    }
  });


  function RadiobuttonSelectColumn(options) {
    var _grid;
    var _self = this;
    var _handler = new Slick.EventHandler();
    var _selectedRowsLookup = {};
    var _defaults = {
      columnId: "_radio_selector",
      cssClass: null,
      toolTip: "Select/Deselect All",
      width: 30
    };

    var _options = $.extend(true, {}, _defaults, options);

    function init(grid) {
      _grid = grid;
	  $('div', options.$grid).unbind('keydown.sg-events');
	  $('div[tabindex="0"]', options.$grid).attr('tabindex', '-1');
      _handler
        .subscribe(_grid.onSelectedRowsChanged, handleSelectedRowsChanged)
        .subscribe(_grid.onClick, handleClick);
    }

    function destroy() {
      _handler.unsubscribeAll();
    }

    function handleSelectedRowsChanged(e, args) {
      var selectedRows = _grid.getSelectedRows();
      var lookup = {}, row, i;
      for (i = 0; i < selectedRows.length; i++) {
        row = selectedRows[i];
        lookup[row] = true;
        if (lookup[row] !== _selectedRowsLookup[row]) {
          _grid.invalidateRow(row);
          delete _selectedRowsLookup[row];
        }
      }
      for (i in _selectedRowsLookup) {
        _grid.invalidateRow(i);
      }
      _selectedRowsLookup = lookup;
      _grid.render();
    }

    function handleClick(e, args) {
      // clicking on a row select radio button
	  var $row = $(e.target).closest('.slick-row');
      $row.find(':radio').attr('checked', 'checked').focus();
	  toggleRowSelection($row);
	  var item = _grid.getData().getItem(args.row);
    }

    function toggleRowSelection($row) {
      $('.selRow').removeClass('selRow');
	  $row.addClass('selRow');
    }

    function getColumnDefinition() {
      return {
        id: _options.columnId,
        name: "",
        toolTip: _options.toolTip,
        field: "sel",
        width: _options.width,
        resizable: false,
        sortable: false,
        cssClass: _options.cssClass,
        formatter: radiobuttonSelectionFormatter
      };
    }

    function radiobuttonSelectionFormatter(row, cell, value, columnDef, dataContext) {
      if (dataContext) {
		return _selectedRowsLookup[row]
            ? "<input type='radio' data-id='" + dataContext.id + "' name='cbOpt' checked='checked'>"
            : "<input type='radio' data-id='" + dataContext.id + "' name='cbOpt'>";
      }
      return null;
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy,
      "getColumnDefinition": getColumnDefinition
    });
  }
})(jQuery);