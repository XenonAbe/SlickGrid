  // register namespace
  Slick.Formatters.YesNo = YesNoFormatter;

  function YesNoFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    assert(cellMetaInfo);
    if (cellMetaInfo.outputPlainText) {
      return !!value;
    }

    return value ? "Yes" : "No";
  }

