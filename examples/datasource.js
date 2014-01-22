(function(window, $, undefined) {
  "use strict";

  function getDataItems(count, columns) {
    var items = [], colCount = columns.length;
    for (var i = 0; i < count; i++) {
      var item = {
        id: i,
        title: 'Value ' + i
      };
      for (var c = 0; c < colCount; c++) {
        item[c] = (Math.random() * Math.pow(10, Math.random() * 3));
      }
      items.push(item);
    }
    return items;
  }

  var maxNestLevels = 2;

  function createColumns(count, nestLevels, formatter) {
    (typeof nestLevels == "number" && nestLevels >= 0 && nestLevels <= maxNestLevels) || (nestLevels = 0);
    (typeof count == "number") || (count = 5);
    formatter || (formatter = rowCellValueFormatter);

    function fill(arr, cnt, lvl) {
      var childCnt = cnt * (maxNestLevels - lvl + 1);
      for (var i = 0; i < cnt; i++) {
        var col = {
          id: 'col_lvl_' + lvl + '_' + i,
          name: colName(lvl, i)
        };
        if (lvl > 0)
          fill(col.children = [], childCnt, lvl - 1);
        else {
          col.width = 80;
          col.formatter = formatter;
          col.index = root.leafs.length;
          root.leafs.push(col);
        }
        arr.push(col);
      }
    }

    var root = [];
    root.leafs = [];
    fill(root, count, nestLevels);

    return root;
  }

  function rowCellValueFormatter(row, cell, value, columnDef, dataContext) {
    return '<div class="cellValue">' + dataContext[columnDef.index].toFixed(2) + '</div><div class="valueComment">' + row + '.' + cell + '</div>';
  }

  var metrics = [
    'Revenue Growth',
    'Pricing Policy',
    'Policy Index',
    'Expense Control',
    'Excess Cash',
    'Net Trade Cycle',
    'Cost of Capital'
  ];

  function colName(lvl, idx) {
    switch (lvl) {
      case 2:
        var d = new Date(2013, 5, 1);
        d.setDate(idx + 1);
        return d.toLocaleDateString();
      case 1:
        return 'Issuer ' + idx;
      default:
        return metrics[idx % metrics.length];
    }
  }

  window.slickGridTests = {
    createColumns: createColumns,
    getDataItems: getDataItems
  };

})(window, $);