(function ($) {
    // register namespace
    $.extend(true, window, {
        "Slick": {
            "Plugins": {
                "TotalsPlugin": TotalsPlugin
            }
        }
    });

    var _scrollOffset = 0,
        _scrollbarWidth = 16,
        _rowHeight = 0,
        _$totalsViewport = null,
        _$totalsRow = null,
        _grid = null,
        _dataView = null,
        _items = [],
        _summaryData = {},
        _columns,
        _aggrLevel; //In case of tree grid some cases need to aggrigate only to some level as each node might be
    // an aggrigation (server side) of its child nodes

    function TotalsPlugin(level) {
        var scrollbarSize = getBrowserScrollSize();
        _scrollbarWidth = scrollbarSize.width;
        _aggrLevel = (level !== null && !isNaN(level * 1)) ? level : null; //only number else null

        var self = this;

        function init(grid) {
            _grid = grid;
            _dataView = grid.getData();
            _rowHeight = grid.getOptions().rowHeight;
            var viewport = grid.getCanvasNode().parentElement,
                width = viewport.offsetWidth;

            if (viewport.scrollHeight > viewport.offsetHeight) {
                width -= _scrollbarWidth;
            }
            _$totalsViewport = $('<div class="slick-viewport totals-viewport">').css({bottom: scrollbarSize.height, width: width});
            _$totalsViewport.insertAfter(viewport);

            _columns = _grid.getColumns();

            appendTotalsRows();

            grid.onColumnsResized.subscribe(function (ev, args) {
                handleColumnsResized(ev, args);
            });

            grid.onColumnsReordered.subscribe(function (ev, args) {
                _columns = _grid.getColumns();
                handleColumnsReordered(ev, args)
            });

            grid.onScroll.subscribe(function (ev, args) {
                handleScroll(ev, args)
            });

            _dataView.onRowCountChanged.subscribe(function (e, args) {
                handleDataChange();
            });

            _dataView.onRowsChanged.subscribe(function (e, args) {
                handleDataChange();
            });

            grid.onViewportChanged.subscribe(function (ev, args) {
                _columns = _grid.getColumns();
                appendTotalsRows(ev, args);
            });
        }

        function handleDataChange() {
            var rows = [], len = _dataView.getLength();
            for (var i = 0; i < len; i++) {
                rows.push(_dataView.getItem(i));
            }
            _items = rows;
            updateSummaryData();
        }

        function updateSummaryData() {
            _summaryData = {}; //Clean up previous data first

            var it = 0, len = _items.length, i = 0, colen = _columns.length;
            for (; it < len; it++) {
                var row = _items[it],
                    column;
                if(_aggrLevel !== null) {
                    if(row.level === _aggrLevel) {
                        for (i = 0; i < colen; i++) {
                            column = _columns[i];
                            var value = row[column.field];

                            if (value !== '' && value !== null && !isNaN(value * 1)) {
                                if (typeof _summaryData[column.id] === 'undefined') {
                                    _summaryData[column.id] = {sum: 0, values: []};
                                }
                                _summaryData[column.id].sum += (value * 1);
                                _summaryData[column.id].values.push(value * 1);
                            }
                        }
                    }
                } else {
                    for (i = 0; i < colen; i++) {
                        column = _columns[i];
                        var value = row[column.field];

                        if (value !== '' && value !== null && !isNaN(value * 1)) {
                            if (typeof _summaryData[column.id] === 'undefined') {
                                _summaryData[column.id] = {sum: 0, values: []};
                            }
                            _summaryData[column.id].sum += (value * 1);
                            _summaryData[column.id].values.push(value * 1);
                        }
                    }
                }

            }
        }

        function appendTotalsRows(ev, args) {
            var width = (args ? args.grid : _grid).getCanvasNode().offsetWidth;

            var $totalsRow = $('<div class="ui-widget-content slick-row totals"></div>').css({position: 'relative', width: width});
            var $cell;

            for (var i = 0, l = _columns.length; i < l; i++) {
                var column = _columns[i],
                    value = column.aggregator ? column.aggregator(_summaryData[column.id], column, ev, args) : '\u00A0';
                $cell = $('<div class="slick-cell"></div>').addClass('l' + i + ' r' + i);
                $cell.text(value);
                $totalsRow.append($cell);
            }

            _$totalsViewport.empty().append($totalsRow);
            _$totalsRow = $totalsRow;
            self.onTotalsRowRendered.notify(_$totalsViewport, ev, args);
        }

        function handleColumnsResized(ev, args) {
            var canvas = args.grid.getCanvasNode();
            var viewport = canvas.parentElement;
            var top = (viewport.scrollWidth > viewport.offsetWidth) ? _rowHeight + _scrollbarWidth : _rowHeight;
            _$totalsRow.width(canvas.scrollWidth);
            _$totalsViewport.css('top', top * -1 + 'px')
        }

        function handleColumnsReordered(ev, args) {
            appendTotalsRows(ev, args);
        }

        function handleScroll(ev, args) {
            if (_scrollOffset != args.scrollLeft) {
                _scrollOffset = args.scrollLeft;
                _$totalsRow.css('left', _scrollOffset * -1);
            }
        }

        function getBrowserScrollSize() {
            var css = {
                border: 'none',
                height: '200px',
                margin: '0',
                padding: '0',
                width: '200px'
            };

            var inner = $('<div>').css($.extend({}, css));
            var outer = $('<div>').css($.extend({
                left: '-1000px',
                overflow: 'scroll',
                position: 'absolute',
                top: '-1000px'
            }, css)).append(inner).appendTo('body')
                .scrollLeft(1000)
                .scrollTop(1000);

            var scrollSize = {
                height: (outer.offset().top - inner.offset().top) || 0,
                width: (outer.offset().left - inner.offset().left) || 0
            };

            outer.remove();
            return scrollSize;
        }

        function toggleTotalsRow(show) {
            if(show) {
                _$totalsViewport.show();
            } else {
                _$totalsViewport.hide();
            }
        }

        function destroy() {
            _$totalsViewport.remove();
        }

        function refresh(ev, args) {
            _columns = (args ? args.grid.getData() : _grid).getColumns();
            appendTotalsRows(ev, args);
        }

        $.extend(this, {
            init: init,
            destroy: destroy,
            onTotalsRowRendered: new Slick.Event(),
            toggleTotalsRow: toggleTotalsRow,
            refresh: refresh
        });
    }
})(jQuery);