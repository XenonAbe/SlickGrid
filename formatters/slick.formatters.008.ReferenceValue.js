  // register namespace
  Slick.Formatters.ReferenceValue = ReferenceValueFormatter;

  function ReferenceValueFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    assert(cellMetaInfo);
    var options = cellMetaInfo.options;

    if (cellMetaInfo.outputPlainText) {
      if (value == null) {
        return "";
      } else {
        return "" + value;
      }
    }

    if (options) {
      var match;
      for (var i in options) {
        if (options[i].id === value || options[i].key === value) {
          match = options[i];
          break;
        }
      }

      if (match) {
        return match.value || match.label || value;
      }
    }
    return value;
  }

