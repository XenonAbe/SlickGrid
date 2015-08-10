/*jslint Slick*/
'use strict';
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
        _scrollbarSize,
        _aggrLevel; //In case of tree grid some cases need to aggrigate only to some level as each node might be
    // an aggrigation (server side) of its child nodes

    function TotalsPlugin(options) {
        _scrollbarSize = getBrowserScrollSize();
        _scrollbarWidth = _scrollbarSize.width;
        _aggrLevel = (options.level !== null && !isNaN(options.level * 1)) ? options.level : null; //only number else null

        var self = this;

        function init(grid) {
            var viewport = grid.getCanvasNode().parentElement;

            _grid = grid;
            _dataView = grid.getData();
            _rowHeight = grid.getOptions().rowHeight;
            _columns = _grid.getColumns();


            _$totalsViewport = $('<div class="slick-viewport totals-viewport">');
            _$totalsViewport.insertAfter(viewport);

            grid.onInitialize.subscribe(function (ev, args) {
                var width = viewport.offsetWidth;
                if (viewport.scrollHeight > viewport.offsetHeight) {
                    width -= _scrollbarWidth;
                }

                _$totalsViewport.css({width: width, bottom: options.bottom || 16});

                handleDataChange(ev, args);
            });

            grid.onColumnsResized.subscribe(function (ev, args) {
                handleColumnsResized(ev, args);
            });

            grid.onColumnsReordered.subscribe(function (ev, args) {
                _columns = _grid.getColumns();
                handleColumnsReordered(ev, args);
            });

            grid.onScroll.subscribe(function (ev, args) {
                handleScroll(ev, args);
            });

            _dataView.onRowCountChanged.subscribe(function (ev, args) {
                handleDataChange(ev, args);
                updateWidth();
            });

            grid.onViewportChanged.subscribe(function (ev, args) {
                _columns = _grid.getColumns();
                appendTotalsRows(ev, args);
            });
        }

        function handleDataChange(ev, args) {
            var rows = [], len = _dataView.getLength();
            for (var i = 0; i < len; i++) {
                rows.push(_dataView.getItem(i));
            }
            _items = rows;
            updateSummaryData(ev, args);
        }

        function updateSummaryData(ev, args) {
            _summaryData = {}; //Clean up previous data first

            var it = 0, len = _items.length, i = 0, colen = _columns.length, value;
            for (; it < len; it++) {
                var row = _items[it],
                    column;
                if (_aggrLevel !== null) {
                    if (row.level === _aggrLevel) {
                        for (i = 0; i < colen; i++) {
                            column = _columns[i];
                            value = row[column.field];

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
                        value = row[column.field];

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
            appendTotalsRows(ev, args);
        }

        function appendTotalsRows(ev, args) {
            var viewport = (args && args.grid ? args.grid : _grid).getCanvasNode(),
                width = viewport.offsetWidth,
                mergeCols = options.mergeColumns;

            var $totalsRow = $('<div class="ui-widget-content slick-row totals"></div>').css({position: 'relative', width: width});
            var $cell, column, value;

            for (var i = 0, l = _columns.length; i < l; i++) {
                column = _columns[i];
                value = column.aggregator ? column.aggregator(_summaryData[column.id], column, ev, args) : '\u00A0';
                $cell = $('<div class="slick-cell slick-header-columns"></div>').addClass('l' + i + ' r' + i + ' f-' + column.id);
                $cell.text(value);
                $totalsRow.append($cell);
            }

            _$totalsViewport.empty().append($totalsRow);
            _$totalsRow = $totalsRow;

            self.onTotalsRowRendered.notify(_$totalsViewport, ev, args);

            if (mergeCols && mergeCols.length > 0) {
                var from, to;
                for (var i = 0; i < mergeCols.length; i++) {
                    from = $totalsRow.find('.f-' + mergeCols[i].from);
                    to = $totalsRow.find('.f-' + mergeCols[i].to);
                    if (from.length > 0 && to.length > 0) {
                        to.css({left: from.css('left')}).addClass(mergeCols[i].cssClass || '');
                        if (mergeCols[i].html) {
                            to.html(mergeCols[i].html);
                        }
                    }
                }
            }
        }


        function handleColumnsResized(ev, args) {
            var canvas = args.grid.getCanvasNode();
            _$totalsRow.width(canvas.scrollWidth);
        }

        function handleColumnsReordered(ev, args) {
            appendTotalsRows(ev, args);
        }

        function handleScroll(ev, args) {
            if (_scrollOffset !== args.scrollLeft) {
                _scrollOffset = args.scrollLeft;
                _$totalsRow.css('left', _scrollOffset * -1);
            } else if (_$totalsRow) {
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
            if (show) {
                _$totalsViewport.show();
            } else {
                _$totalsViewport.hide();
            }
        }

        function destroy() {
            _$totalsViewport.remove();
        }


        function getNode() {
            return _$totalsViewport;
        }

        function refresh(ev, args) {
            _columns = (args ? args.grid.getData() : _grid).getColumns();
            var viewport = _grid.getCanvasNode().parentElement;
            if (viewport.scrollHeight > viewport.offsetHeight) {
                _$totalsViewport.css({'bottom': (options.bottom || 16) - _scrollbarSize.height + 1});
            }
            updateWidth();

            appendTotalsRows(ev, args);
        }

        function updateWidth() {
            var viewport = _grid.getCanvasNode().parentElement;
            var width = viewport.offsetWidth;
            if (viewport.scrollWidth > width) {
                width -= _scrollbarSize.width;
            }
            _$totalsViewport.width(width);
        }

        $.extend(this, {
            init: init,
            destroy: destroy,
            onTotalsRowRendered: new Slick.Event(),
            toggleTotalsRow: toggleTotalsRow,
            refresh: refresh,
            getNode: getNode
        });
    }
})(jQuery);