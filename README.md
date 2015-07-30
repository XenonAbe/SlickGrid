Find detailed [documentation here] (https://github.com/mleibman/SlickGrid/wiki).

## This repo made following changes

1. Column configuration have new property `preventClearOnEdit`.
    - This basically prevent the cell content get clear on editor get activate.
    - Helpful in case's like [here](https://github.com/6pac/SlickGrid/issues/11).

2. Now the editor will receive event as second parameter when available.

3. Two new events are added `finishedInitialization' and `finishedRendering'.
    - `finishedInitialization` will be get called when the actual init is finished (in case of lazy init enable it get called after that).
    - `finishedRendering` will be called after the `render' completes.
    
4. Exposed following 4 methods:
    - `getHeaderWidth` to get the header width.
    - `getCanvasWidth` return the canvas width.
    - `getViewportHeight` return viewport height.
    - `getUID` return the grid ID.

5. Added `minimumContainerHeight` grid option. This is particularly useful when the grid element (container) reveal/show/appear on click (or pragmatically). 
    - Example: carousel in bootstrap where the slides are hidden (have zero height?).
    
    
## How to install

`bower mslickgrid`


#### Note: If your looking for more features, Angularjs support as well (IE9+, modern browser) I recommend [angulargrid] (http://angulargrid.com/). Its rewritten SlickGrid to support Angular (with/without)

### Original license [MIT] (https://github.com/mleibman/SlickGrid/blob/master/MIT-LICENSE.txt) 