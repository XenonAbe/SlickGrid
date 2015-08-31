  // register namespace
  Slick.Formatters.Concatenator = Concatenator;

  function Concatenator(fields, separator) {
    if (typeof separator === 'undefined') {
      separator = ' ';
    }
    if (typeof fields === 'string') {
      fields = fields.split(',');
    }
    var len = fields.length;

    return function(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
      var result = [];
      var data;
      for (var i = 0; i < len; i++) {
        data = rowDataItem[ fields[i] ];
        if (data != null) {
          result.push(data);
        }
      }
      return result.join(separator);
    };
  }

