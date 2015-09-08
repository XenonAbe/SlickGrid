Find detailed [documentation here] (https://github.com/mleibman/SlickGrid/wiki).

###Extension of 6pac repo

#### This repo made following changes

1. Column configuration have new property `preventClearOnEdit`.
    - This basically prevent the cell content get clear on editor get activate.
    - Helpful in case's like [here](https://github.com/6pac/SlickGrid/issues/11).

2. Now the editor will receive event as second parameter when available.

3. Two new events are added `onInitialize` and `onRendered`.
    - `onInitialize` will be get called when the actual init is finished (in case of lazy init enable it get called after that).
    - `onRendered` will be called after the `render' completes.
    
4. Exposed following 4 methods:
    - `getHeaderWidth` to get the header width.
    - `getCanvasWidth` return the canvas width.
    - `getViewportHeight` return viewport height.
    - `getUID` return the grid ID.

5. Added `minimumContainerHeight` grid option. This is particularly useful when the grid element (container) reveal/show/appear on click (or pragmatically). 
    - Example: carousel in bootstrap where the slides are hidden (have zero height?).
    
6. Implemented the total plugin (footer), its stays at the bottom (make sure to enable `enableAddRow` to prevent the last row hiding).
    - It fire `onRendered` event each time the footer created and recalculated (`onDataviewRefreshed` - DataView {insert, delete etc..}, `onColumnsReordered`, `onColumnsResized` and `onInitialize` Grid).
    - Override `updateSummaryData` method to calculate the total row columns values.
        - It it will receive 3 parameters `items`, `columns` and `callback`.
        - One must call the callback with data (see example in the totals plugin code for example).
    - You can pass `aggregator` for each column in the column definition.
        - Aggregator will receive 4 parameters `{sum: <<values>>, values: [<values>>]}, columnDef, event, args`.
        - It must return the value.

        
#### How to install this package

`bower mslickgrid`


#### Note: If your looking for more features, Angularjs support as well (IE9+, modern browser) I recommend [angulargrid] (http://angulargrid.com/). Its rewritten SlickGrid to support Angular (with/without)

### Original license [MIT] (https://github.com/mleibman/SlickGrid/blob/master/MIT-LICENSE.txt) 