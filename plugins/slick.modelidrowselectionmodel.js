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


        function getFlattenedSelectionFromRowIds(rowIds) {
            var items = $.grep(rowIds.map(function (id) { return _grid.getDataItem(id); }), function (item) { return !isGroupTotals(item); });
            return getFlattenedSelection(items);
        }

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
        function isGroupTotals(item) {
            return item instanceof Slick.GroupTotals;
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
                selectionObj.clear();
                selectionObj.setItem(new LastSelected(data.row));
                selectionObj.toggle($.grep(getFlattenedSelectionFromRowIds([data.row]), function (item) { return !isGroup(item); }).map(function (item) { return item[_grid.getData().getIdProperty()]; }));
                setSelectedUniqueIds(selectionObj.getUniqueIds());
            }
        }

        function arrayConcat(a1) {
            a1 = a1 || [];
            var index = 1, anotherArr;

            while (anotherArr = arguments[index++]) {
                anotherArr.forEach(function (item) { a1.push(item); });
            }

            return a1;
        }

        function SelectionObj() {
            var lastItem = undefined;
            var uniqueIds = [];
            var uniqueIdLookup = {};
            var distance = 0;

            this.toggle = toggle;
            this.getUniqueIds = getUniqueIds;
            this.clear = clear;
            this.getItem = getItem;
            this.setItem = setItem;
            this.incrementDistance = incrementDistance;
            this.decrementDistance = decrementDistance;
            this.clearDistance = clearDistance;
            this.getDistance = getDistance;

            function getDistance() { return distance; }
            function clearDistance() { distance = 0; }
            function incrementDistance() { distance++; }
            function decrementDistance() { distance--; }
            function getItem() { return lastItem; }
            function setItem(item) { lastItem = item; }
            function getUniqueIds() { return uniqueIds; }
            function clear() { uniqueIds = []; uniqueIdLookup = {}; distance = 0; }
            function toggle(ids, forceAdd, forceRemove) {
                var missingIds = missing(ids);
                if (forceRemove || (missingIds.length === 0 && !forceAdd)) {
                    removeIds(ids);
                } else {
                    addIds(missingIds);
                }
            }

            function addIds(ids) {
                var index = ids.length, id;
                while (index--) {
                    id = ids[index];
                    if (uniqueIdLookup[id] !== true) {
                        uniqueIdLookup[id] = uniqueIds.length;
                        uniqueIds.push(id);
                    }
                }
            }

            function removeIds(ids) {
                var index = ids.length, uniqueIdsIndex, id;
                while (index--) {
                    id = ids[index];
                    uniqueIdsIndex = uniqueIdLookup[id];
                    if (uniqueIdsIndex >= 0) {
                        uniqueIds.splice(uniqueIdsIndex, 1);
                        uniqueIdLookup = toLookup(uniqueIds);
                    }
                }
            }

            function toLookup(list) {
                var hash = {}
                list.forEach(addToHash);
                return hash;

                function addToHash(item, index) {
                    hash[item] = index;
                }
            }

            function missing(ids) {
                var missingIds = [], idsIndex = ids.length, id;
                while (idsIndex--) {
                    id = ids[idsIndex];
                    if (uniqueIdLookup[id] === undefined) {
                        missingIds.push(id);
                    }
                }
                return missingIds;
            }
        }

        function LastSelected(rowId) {
            this.rowId = rowId;
        }

        var selectionObj = new SelectionObj();

        function buildArray(p1, p2) {
            var high = Math.max(p1, p2);
            var low = Math.min(p1, p2);
            var list = [high];
            while (low - high) {
                list.push(low++);
            }
            return list;
        }

        function handleKeyDown(e) {
            var dataView = _grid.getData();
            var shiftItemRow = selectionObj.getItem();
            if (shiftItemRow && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && (e.which == 38 || e.which == 40)) {

                var active;
                if (e.which == 40) { //down
                    selectionObj.incrementDistance();
                } else { //up
                    selectionObj.decrementDistance();
                }
                active = selectionObj.getDistance() + shiftItemRow.rowId;

                if (active < 0) {
                    selectionObj.incrementDistance();
                    active++;
                } else if (active >= _grid.getDataLength()) {
                    selectionObj.decrementDistance();
                    active--;
                }

                var top = Math.min(shiftItemRow.rowId, active);
                var bottom = Math.max(shiftItemRow.rowId, active);

                _grid.setActiveCell(active, 0);

                if (e.which === 40 && active <= shiftItemRow.rowId) { // down arrow clicked
                    // remove the selection from the item above the highest
                    selectionObj.toggle($.grep(getFlattenedSelectionFromRowIds([active - 1]), function (item) { return !isGroup(item); }).
                        map(function (item) { return item[dataView.getIdProperty()]; })
                        , undefined, true);
                } else if (e.which === 38 && active >= shiftItemRow.rowId) { // up arrow clicked
                    // remove the selection from the item below the lowest
                    selectionObj.toggle($.grep(getFlattenedSelectionFromRowIds([active + 1]), function (item) { return !isGroup(item); }).
                        map(function (item) { return item[dataView.getIdProperty()]; })
                        , undefined, true);
                }

                _grid.scrollRowIntoView(active);
                console.log(top, bottom);
                selectionObj.toggle($.grep(getFlattenedSelectionFromRowIds(buildArray(top, bottom)), function (item) { return !isGroup(item); }).
                    map(function (item) { console.log(item); return item[dataView.getIdProperty()]; })
                    , true);
                _allSelected = false;
                setSelectedUniqueIds(selectionObj.getUniqueIds());

                dataView.refresh();

                e.preventDefault();
                e.stopPropagation();
            } else if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
                selectionObj.clear();
            } else if (!e.shiftKey) {
                selectionObj.clearDistance();
            }
        }

        function handleClick(e) {
            selectionObj.clearDistance();
            var cell = _grid.getCellFromEvent(e);
            if (!cell || !_grid.canCellBeActive(cell.row, cell.cell)) {
                return false;
            }

            var dataView = _grid.getData();
            var selectedItems = [dataView.getItem(cell.row)];
            var selectedItemIds = $.grep(getFlattenedSelection(selectedItems), function (item) { return !isGroup(item) && !(item instanceof Slick.GroupTotals); }).map(function (item) { return item[dataView.getIdProperty()]; });

            if (selectionObj.getItem() === undefined) {
                selectionObj.setItem(new LastSelected(cell.row));
            }

            if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
                selectionObj.clear();
                selectionObj.toggle(selectedItemIds);
                selectionObj.setItem(new LastSelected(cell.row));
            }
            else if (_grid.getOptions().multiSelect) {
                if (e.ctrlKey || e.metaKey) {
                    selectionObj.toggle(selectedItemIds);
                    selectionObj.setItem(new LastSelected(cell.row));
                } else {
                    var highPosition = Math.max(selectionObj.getItem().rowId, cell.row);
                    var lowPosition = Math.min(selectionObj.getItem().rowId, cell.row);
                    var rowIds = [];
                    while (highPosition - lowPosition) {
                        rowIds.push(lowPosition++);
                    }
                    rowIds.push(highPosition);
                    selectedItems = rowIds.map(function (rowId) { return dataView.getItem(rowId); });
                    selectedItemIds = $.grep(getFlattenedSelection(selectedItems), function (item) { return !isGroup(item) && !(item instanceof Slick.GroupTotals); }).map(function (item) { return item[dataView.getIdProperty()]; });
                    selectionObj.toggle(selectedItemIds);
                }
            }

            _grid.setActiveCell(cell.row, cell.cell);
            _allSelected = false;
            setSelectedUniqueIds(selectionObj.getUniqueIds());

            dataView.refresh();
            e.stopImmediatePropagation();
            return true;
        }
    }
})(jQuery);
