  // register namespace
  Slick.Formatters.Checkmark = CheckmarkFormatter;

  function CheckmarkFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    assert(cellMetaInfo);
    if (cellMetaInfo.outputPlainText) {
      return !!value;
    }

    return value ? "<img src='../images/tick.png'>" : "";
  }

