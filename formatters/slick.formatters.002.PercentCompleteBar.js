  // register namespace
  Slick.Formatters.PercentCompleteBar = PercentCompleteBarFormatter;

  function PercentCompleteBarFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    if (value == null || value === "") {
      return "";
    }

    var color;

    if (value < 30) {
      color = "red";
    } else if (value < 70) {
      color = "silver";
    } else {
      color = "green";
    }

    assert(cellMetaInfo);
    if (cellMetaInfo.outputPlainText) {
      return "" + value + "%";
    }

    return "<span class='percent-complete-bar' style='background:" + color + ";width:" + value + "%'></span>";
  }
