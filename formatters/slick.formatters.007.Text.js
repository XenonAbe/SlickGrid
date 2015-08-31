  // register namespace
  Slick.Formatters.Text = TextFormatter;

  // identical to the SlickGrid internal defaultFormatter except this one wraps the value in a SPAN tag.
  function TextFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    assert(cellMetaInfo);
    if (value == null) {
      return "";
    } else {
      if (cellMetaInfo.outputPlainText) {
        return "" + value;
      }
      // Safari 6 fix: (value + "") instead of .toString()
      value = (value + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return "<span>" + value + "</span>";
    }
  }

