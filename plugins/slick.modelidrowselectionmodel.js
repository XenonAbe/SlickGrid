(function ($, angular) {
    $.extend(true, window, {
        "Slick": {
            "ModelIdRowSelectionModel": ModelIdRowSelectionModel
        }
    });

    function ModelIdRowSelectionModel(options) {
        var _grid, _inHandler, _options;
        var _ranges = [], _selectedUniqueIds = [];
        var _self = this;
        var _allSelected = false;
        var _handler = new Slick.EventHandler();
        var _nonSelected = [new Slick.Range(0, 1, 0, 1)];
        var _defaults = { selectActiveRow: true };

        $.extend(this, {
            "getSelectedRows": getSelectedRows,
            "setSelectedRows": setSelectedRows,

            "getSelectedRanges": getSelectedRanges,
            "setSelectedRanges": setSelectedRanges,

            setSelectedUniqueIds: setSelectedUniqueIds,
            getSelectedUniqueIds: getSelectedUniqueIds,

            deselectAll: deselectAll,
            selectAll: selectAll,
            allSelected: allSelected,

            "init": init,
            "destroy": destroy,

            "onSelectedRangesChanged": new Slick.Event()
        });

        function setSelectedUniqueIds(ids) {
            var rowPositionIds;
            _selectedUniqueIds = angular.copy(ids);
            if (allSelected()) {
                var dataView = _grid.getData();
                var getIdList = function (item) { return item[dataView.getIdProperty()]; };
                var idList = dataView.getItems().map(getIdList);
                rowPositionIds = uniqueIdsToRowIds(idList);
            } else {
                rowPositionIds = uniqueIdsToRowIds(_selectedUniqueIds);
            }

            _ranges = rowsToRanges(rowPositionIds);
            if (_ranges.length === 0) {
                _ranges = _nonSelected;
            }
            _self.onSelectedRangesChanged.notify(_ranges);
        }

        function getSelectedUniqueIds() {
            return _selectedUniqueIds;
        }

        function init(grid) {
            _options = $.extend(true, {}, _defaults, options);
            _grid = grid;
            _handler.subscribe(_grid.onActiveCellChanged,
                wrapHandler(handleActiveCellChange));
            _handler.subscribe(_grid.onKeyDown,
                wrapHandler(handleKeyDown));
            _handler.subscribe(_grid.onClick,
                wrapHandler(handleClick));
        }

        function destroy() {
            _handler.unsubscribeAll();
        }

        function getSelectedRows() {
            return rangesToRows(_ranges);
        }

        function setSelectedRows() {
            updateSelection();
        }

        function setSelectedRanges() {
            updateSelection();
        }
        function getSelectedRanges() {
            return _ranges;
        }

        function uniqueIdsToRowIds(rows) {
            var _newRows = [];
            if (_grid.getData()) {
                var _dataView = _grid.getData();
                if (angular.isFunction(_dataView.mapIdsToRows)) {
                    _newRows = _dataView.mapIdsToRows(rows);
                }
            }
            return _newRows;
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

        function updateSelection() {
            setSelectedUniqueIds(_selectedUniqueIds);
        }

        function allSelected() {
            return _allSelected;
        }

        function selectAll() {
            _allSelected = true;
            setSelectedUniqueIds([]);
        }

        function deselectAll() {
            _ranges = [];
            _selectedUniqueIds = [];
            _allSelected = false;
            setSelectedUniqueIds([]);
        }

        function handleActiveCellChange(e, data) {
            if (_options.selectActiveRow && data.row != null) {
                _allSelected = false;
                setSelectedUniqueIds(data.grid.getData().mapRowsToIds([data.row]));
            }
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
                    var selection = getRowsRange(top, bottom);
                    var dataView = _grid.getData();
                    var ids = dataView.mapRowsToIds(selection);
                    _allSelected = false;
                    setSelectedUniqueIds(ids);
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
                selection = [cell.row];
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

            var dataView = _grid.getData();
            var ids = dataView.mapRowsToIds(selection);
            _allSelected = false;
            setSelectedUniqueIds(ids);
            e.stopImmediatePropagation();
            return true;
        }
    }
})(jQuery, angular);
