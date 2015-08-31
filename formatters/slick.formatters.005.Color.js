  // register namespace
  Slick.Formatters.Color = ColorFormatter;

  function ColorFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    assert(cellMetaInfo);
    if (cellMetaInfo.outputPlainText) {
      return value;
    }

    return "<span style='color:" + value  + "'>" + value + "</span>";
  }

