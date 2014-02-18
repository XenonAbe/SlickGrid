
/**
 * A proof-of-concept cell editor with Excel-like range selection and insertion.
 */
function FormulaEditor(args) {
    var _self = this;
    var _editor = new Slick.Editors.Text(args);
    var _selector;

    $.extend(this, _editor);

    function init() {
        // register a plugin to select a range and append it to the textbox
        // since events are fired in reverse order (most recently added are executed first),
        // this will override other plugins like moverows or selection model and will
        // not require the grid to not be in the edit mode
        _selector = new Slick.CellRangeSelector();
        _selector.onCellRangeSelected.subscribe(_self.handleCellRangeSelected);
        args.grid.registerPlugin(_selector);
    }

    this.destroy = function () {
        _selector.onCellRangeSelected.unsubscribe(_self.handleCellRangeSelected);
        args.grid.unregisterPlugin(_selector);
        _editor.destroy();
    };

    this.handleCellRangeSelected = function (e, args) {
        _editor.setDirectValue(
            _editor.serializeValue() +
                " " +
                args.grid.getColumns()[args.range.fromCell].name +
                args.range.fromRow +
                ":" +
                args.grid.getColumns()[args.range.toCell].name +
                args.range.toRow
        );
    };

    init();
}

