  // register namespace
  Slick.Formatters.Chain = Chain;

  /*
   *  utility for chaining formatters
   */
  function Chain(/* ...formatters */) {
    var formatters = Array.prototype.slice.call(arguments);

    return function(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
      var val = value;
      for (var i in formatters) {
        val = formatters[i](row, cell, val, columnDef, rowDataItem, cellMetaInfo);
      }
      return val;
    };
  }

