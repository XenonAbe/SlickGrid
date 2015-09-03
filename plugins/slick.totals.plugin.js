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


    function TotalsPlugin(options) {

        var _grid,
            $totalContainer = $('<div class="totals-container"></div>'),
            $totalRow = $('<div class="slick-header-columns"></div>').appendTo($totalContainer),
            _canvas,
            items = [],
            summaryData = {}, columns = [], self = this;

        function init(grid) {

            columns = grid.getColumns();
            _grid = grid;
            _canvas = grid.getCanvasNode();

            if (_canvas) {
                $totalContainer
                    .appendTo(_canvas.parentElement)
                    .height(grid.getOptions().rowHeight);
            }

            grid.onInitialize.subscribe(function (ev, args) {

                if(!_grid) {
                    _grid = args.grid;
                    _canvas = args.grid.getCanvasNode();
                    $totalContainer.appendTo(_canvas.parentElement);
                    columns = grid.getColumns();
                }
                handleDataChange(ev, args);
            });

            grid.onColumnsResized.subscribe(function (ev, args) {
                columns = _grid.getColumns();
                updateSummaryData(ev, args);
            });

            grid.onColumnsReordered.subscribe(function (ev, args) {
                columns = _grid.getColumns();
                updateSummaryData(ev, args);
            });

            grid.onScroll.subscribe(function (ev, args) {
                $totalContainer.css({bottom: args.scrollTop * -1});
            });

            grid.getData().onDataviewRefreshed.subscribe(function (ev, args) {
                args = args.grid ? args : {grid: _grid, dataView: args};
                handleDataChange(ev, args);
            });
        }

        function handleDataChange(ev, args) {
            var dv = args.grid.getData(),
                len = dv.getLength(), i = 0;

            items = [];
            for (; i < len; i++) {
                items.push(dv.getItem(i));
            }

            updateSummaryData(ev, args);
        }

        function updateSummaryData(ev, args) {
            summaryData = {}; //Clean up previous data;

            var i = 0, value, row, column, col = 0, entry;

            for (; row = items[i++];) {
                column = null;
                if (($.isNumeric(row.level) && $.isNumeric(options.level)) ? row.level == options.level : true) {
                    for (; column = columns[col++];) {
                        value = row[column.field];
                        if ($.isNumeric(value)) {
                            entry = (summaryData[column.id] || {sum: 0, values: []});
                            entry.sum += value * 1;
                            entry.values.push(value * 1);
                            summaryData[column.id] = entry;
                        }
                    }
                }
            }

            appendColumns(ev, args);
        }

        function appendColumns(ev, args) {
            var width = _canvas.offsetWidth,
                mergeCols = options.columnsToMerge,
                $cell, column, value, i = 0;

            $totalRow.css({position: 'relative', width: width}).empty();

            for (; column = columns[i];) {
                value = column.aggregator ? column.aggregator(summaryData[column.id], column, ev, args) : '\u00A0';
                $('<div class="slick-cell slick-header-column"></div>')
                    .addClass('l' + i + ' r' + i + ' total-' + column.id)
                    .html('<span class="slick-column-name">' + value + '</span>')
                    .appendTo($totalRow);
                i++;
            }

            self.onRendered.notify($totalContainer, ev, args);

            if (mergeCols && mergeCols.length) {
                var from, to, col;
                i = 0;
                for (; col = mergeCols[i++];) {
                    from = $totalRow.find('.total-' + col.from);
                    to = $totalRow.find('.total-' + col.to);
                    if (from.length && to.length) {
                        to.css({left: parseInt(from.css('left'), 10)})
                            .addClass(col.cssClass || '')
                            .html(col.content.text || '\u00A0');
                    } else if(to.length > 0) {
                        to.html(col.content.text || '\u00A0');
                    } else if (from.length) {
                        from.html(col.content.text || '\u00A0');
                    }
                }
            }
        }

        function destroy() {
            $totalContainer.off('**').empty().remove();
            $totalContainer = null;
        }

        function show() {
            $totalContainer.show();
        }

        function hide() {
            $totalContainer.hide();
        }

        function refresh(ev, args) {
            columns = _grid.getColumns();
            args = args || {grid: _grid};
            handleDataChange(ev, args);
        }

        $.extend(this, {
            init: init,
            destroy: destroy,
            onRendered: new Slick.Event(),
            show: show,
            hide: hide,
            refresh: refresh
        });
    }
})(jQuery);