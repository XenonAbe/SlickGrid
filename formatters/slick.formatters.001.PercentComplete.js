  // register namespace
  Slick.Formatters.PercentComplete = PercentCompleteFormatter;

  function PercentCompleteFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    assert(cellMetaInfo);
    if (cellMetaInfo.outputPlainText) {
      if (value == null || value === "") {
        return "";
      } else {
        return "" + value + "%";
      }
    }

    if (value == null || value === "") {
      return "-";
    } else if (value < 50) {
      return "<span style='color:red;font-weight:bold;'>" + value + "%</span>";
    } else {
      return "<span style='color:green'>" + value + "%</span>";
    }
  }
