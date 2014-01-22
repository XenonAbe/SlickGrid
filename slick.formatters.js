/***
 * Contains basic SlickGrid formatters.
 *
 * NOTE:  These are merely examples.  You will most likely need to implement something more
 *        robust/extensible/localizable/etc. for your use!
 *
 * @module Formatters
 * @namespace Slick
 */

(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Formatters": {
        "Text": TextFormatter,
        "PercentComplete": PercentCompleteFormatter,
        "PercentCompleteBar": PercentCompleteBarFormatter,
        "YesNo": YesNoFormatter,
        "Checkmark": CheckmarkFormatter,
        "Color": ColorFormatter,
        "BackColor": BackColorFormatter
      }
    }
  });
                                    
  function PercentCompleteFormatter(row, cell, value, columnDef, rowDataItem, colspan, cellCss, cellStyles) {
    if (value == null || value === "") {
      return "-";
    } else if (value < 50) {
      return "<span style='color:red;font-weight:bold;'>" + value + "%</span>";
    } else {
      return "<span style='color:green'>" + value + "%</span>";
    }
  }

  function PercentCompleteBarFormatter(row, cell, value, columnDef, rowDataItem, colspan, cellCss, cellStyles) {
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

    return "<span class='percent-complete-bar' style='background:" + color + ";width:" + value + "%'></span>";
  }

  function YesNoFormatter(row, cell, value, columnDef, rowDataItem, colspan, cellCss, cellStyles) {
    return value ? "Yes" : "No";
  }

  function CheckmarkFormatter(row, cell, value, columnDef, rowDataItem, colspan, cellCss, cellStyles) {
    return value ? "<img src='../images/tick.png'>" : "";
  }

  function ColorFormatter(row, cell, value, columnDef, rowDataItem, colspan, cellCss, cellStyles) {
    return "<span style='color:" + value  + "'>" + value + "</span>";
  }

  function BackColorFormatter(row, cell, value, columnDef, rowDataItem, colspan, cellCss, cellStyles) {
    //return "<span style='background:" + value  + "'>" + value + "</span>";
    cellStyles.push("background:" + value);
    return "<span style='color:black; padding-left: 1px; padding-right: 1px; background-color: rgba(255, 255, 255, 0.4); text-shadow: 1px 1px 3px white; -webkit-box-shadow: 0px 0px 3px 1px rgba(255, 255, 255, 0.4); box-shadow: 0px 0px 3px 1px rgba(255, 255, 255, 0.4);'>" + value + "</span>";
  }

  // identical to the SlickGrid internal defaultFormatter except this one wraps the value in a SPAN tag.
  function TextFormatter(row, cell, value, columnDef, rowDataItem, colspan, cellCss, cellStyles) {
    if (value == null) {
      return "";
    } else {
      // Safari 6 fix: (value + "") instead of .toString()
      value = (value + "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      return "<span>" + value + "</span>";
    }
  }

})(jQuery);
