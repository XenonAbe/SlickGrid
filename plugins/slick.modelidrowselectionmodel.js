(function ($) {
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

        function getFlattenedSelection(dataSelection) {
            var flattenedData = [], item, length = dataSelection.length;
            for (var i = 0; i < length; i++) {
                item = dataSelection[i];
                if (isGroup(item)) {
                    arrayConcat(flattenedData, flattenGroupRowHierarchy(item));
                } else {
                    flattenedData.push(item);
                }
            }
            return flattenedData;
        }

        function flattenGroupRowHierarchy(item) {
            var flattenedRows = [];

            // var groups, group, len, index, groupResults;
            // var groupLen, groupIndex;
            var group, len, groupResults, groupIndex;

            /// the item passed in was a data row
            if (!isGroup(item) && !isGroupTotals(item)) {
                return [item];
            }

            /// the item passed in was a group with rows
            if (item.rows && item.rows.length) {
                return arrayConcat([item], item.rows);
            }

            /// the item apssed in was a group with groups
            if (item.groups && item.groups.length) {

                if (item.groups.length && !item.rows.length) {
                    flattenedRows.push(item);
                }

                len = item.groups.length;
                for (groupIndex = 0; groupIndex < len; groupIndex++) {
                    group = item.groups[groupIndex];

                    groupResults = flattenGroupRowHierarchy(group);
                    arrayConcat(flattenedRows, groupResults);
                }
            }

            return flattenedRows;
        }

        function isGroup(item) {
            return item instanceof Slick.Group;
        }

        function setSelectedUniqueIds(ids) {
            var rowPositionIds;
            _selectedUniqueIds = arrayConcat([], ids);
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
                if ($.isFunction(_dataView.mapIdsToRows)) {
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
                    var ids = getSelectionInGroup(selection, dataView);
                    _allSelected = false;
                    setSelectedUniqueIds(ids);

                    dataView.refresh();
                }

                e.preventDefault();
                e.stopPropagation();
            }
        }

        function itemMatcher(isGroup) {
            return function (item, index) {
                if (isGroup) {
                    return item instanceof Slick.Group || item instanceof Slick.GroupTotals;
                }
                return !(item instanceof Slick.Group) && !(item instanceof Slick.GroupTotals);
            };
        }

        function arrayConcat(a1) {
            a1 = a1 || [];
            var index = 1, anotherArr;

            while (anotherArr = arguments[index++]) {
                anotherArr.forEach(function (item) { a1.push(item); });
            }

            return a1;
        }

        function getSelectionInGroup(absoluteSelection, dataView) {
            if (!$.isArray(absoluteSelection) || !absoluteSelection.length) {
                return absoluteSelection;
            }
            var reletiveIds = [];

            var selectedItems = absoluteSelection.map(function (id) { return dataView.getItem(id); });
            var idProperty = dataView.getIdProperty();

            reletiveIds = $.grep(selectedItems, itemMatcher(false)).map(function (item) { return item[idProperty]; });
            var groupRows = $.grep(selectedItems, itemMatcher(true));

            var ids = getIdsFromGroups(groupRows, idProperty);
            arrayConcat(reletiveIds, ids);

            return reletiveIds;
        }

        function getIdsFromGroups(groups, idProperty) {
            if (!($.isArray(groups) && groups.length)) {
                return [];
            }

            var ids = [], groupIds;
            var group, length = groups.length, index;

            for (index = 0; index < length; index++) {
                group = groups[index];
                groupIds = getIdsFromGroup(group, idProperty);
                arrayConcat(ids, groupIds);
            }
            return ids;
        }

        function getIdsFromGroup(group, idProperty) {
            var ids = [];

            if (!group) {
                return ids;
            }

            if ($.isArray(group.rows) && group.rows.length) {
                ids = group.rows.map(function (item) { return item[idProperty]; });
            }

            var groupIds = getIdsFromGroups(group.groups, idProperty);
            arrayConcat(ids, groupIds);

            return ids;
        }

        function sortAsc(a, b) {
            return a - b;
        }

        function getItemFromPositionId(positionId) {
            return _grid.getDataItem(positionId);
        }

        function handleClick(e) {
            var cell = _grid.getCellFromEvent(e);
            var dataView = _grid.getData();
            var ids;

            if (!cell || !_grid.canCellBeActive(cell.row, cell.cell)) {
                return false;
            }

            var selection = rangesToRows(_ranges);
            var idx = $.inArray(cell.row, selection);

            if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
                selection = [cell.row];
                ids = getSelectionInGroup(selection, dataView);
            }
            else if (_grid.getOptions().multiSelect) {
                if (e.ctrlKey || e.metaKey) {
                    if (idx === -1) {
                        selection.push(cell.row);
                        _grid.setActiveCell(cell.row, cell.cell);
                    } else {
                        selection = $.grep(selection, function (o, i) {
                            return (o !== cell.row);
                        });
                        _grid.setActiveCell(cell.row, cell.cell);
                    }
                    ids = getSelectionInGroup(selection, dataView);
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
                    selection.sort(sortAsc);
                    var dataSelection = selection.map(getItemFromPositionId);
                    var flattenedData = $.grep(getFlattenedSelection(dataSelection),
                        function (item) {
                            return !(item instanceof Slick.GroupTotals);
                        });

                    var lastData = dataView.getItem(to);

                    if (isGroup(_grid.getDataItem(to))) {
                        var flattenedLastGroup = getFlattenedSelection([_grid.getDataItem(to)]);
                        lastData = flattenedLastGroup[flattenedLastGroup.length - 1];
                    }

                    var passedLastData = false;
                    ids = $.grep(flattenedData, function (item) {
                        if (passedLastData) {
                            return false;
                        }
                        if (lastData === item) {
                            passedLastData = true;
                        }
                        return true;
                    }).map(function (item) {
                        return item[dataView.getIdProperty()];
                    });

                    _grid.setActiveCell(cell.row, cell.cell);
                }
            }

            _allSelected = false;
            setSelectedUniqueIds(ids);

            dataView.refresh();
            e.stopImmediatePropagation();
            return true;
        }
    }
})(jQuery);
