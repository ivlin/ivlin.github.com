const callbacks = {};
const selections = {};

var THEME = "LIGHT";

export function registerChangeCallback(callbackName, callback) {
    if (callbacks[callbackName] == undefined) {
        callbacks[callbackName] = [];
    }
    callbacks[callbackName].push(callback);
}

export function triggerCallback(callbackName) {
    if (callbacks[callbackName] != undefined) {
        callbacks[callbackName].forEach((fn)=>fn());
    }
}

export function deleteSelection(graphName) {
    if (graphName in selections) {
        selections[graphName].forEach((p) => {
            p.selected--;
        });
        delete(selections[graphName]);
    }
}

export function addSelection(graphName, points) {
    deleteSelection(graphName);
    points.forEach((p) =>{
        p.selected++;
    });
    selections[graphName] = points
}

export function getSelectionCount() {
    return Object.keys(selections).length;
}

export function resetSelections() {
    for (let name in selections) {
        deleteSelection(name)
    }

    for (let callback in callbacks) {
        triggerCallback(callback)
    }
}

export function toggleTheme() {
    if (THEME == "DARK") {
        THEME = "LIGHT";
    } else {
        THEME = "DARK";
    }
}

export function getTheme() {
    return THEME;
}