  // register namespace
  Slick.Formatters.Date = DateFormatter;

  /*
   *  depends on Moment.js
   *  (http://momentjs.com/)
   */
  function DateFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    var options = $.extend({
        format: 'YYYY-MM-DD HH:mm:ss'
    }, cellMetaInfo.options);

    if (cellMetaInfo.outputPlainText) {
      if (value == null) {
        return "";
      } else if (value.toISOString) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
        return value.toISOString();
      }
      return "" + value;
    }

    if (value == null || value === "") {
      return "";
    } else if (value && typeof moment !== 'undefined') {
      return moment(value).format(options.format);
    } else if (value.toISOString) {
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
      return value.toISOString();
    } else {
      return "" + value;
    }
  }

