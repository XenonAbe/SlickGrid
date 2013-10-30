
// Note: jQuery appears to have their own assert(), but that one is located in their own private scope so we're fine.

// Note: assert()ions do NOT jump into the debugger but signal failure through throwing an exception when they happen to be triggered inside a Jasmine Test Suite run:
//var unit_tests_exec_state;              // 1: running, 2: completed, 3: never executed and never will (just another kind of 'completed')

function assert(expr, msg, invoke_debugger) {
    if (!expr) {
        if (console && console.log) {
            console.log("@@@@@@ assertion failed: ", arguments, (msg || ""));
        }
        if (window.unit_tests_exec_state === 1) {
            throw new Error("ASSERTION failed: " + (msg || ""));
        } else if (invoke_debugger !== false) {
            debugger;
        }
    }
    return !!expr;
}

