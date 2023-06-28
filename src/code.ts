async function fetchGoogleSheets(url) {
  const response = await fetch(url + '&majorDimension=COLUMNS');
  const json = await response.json();
  return json.values;
}

function createCollection(name, columns) {
  const collection = figma.variables.createVariableCollection(name);
  columns.forEach((col) => {
    collection.addMode(col.trim());
  })
  collection.removeMode(collection.modes[0].modeId);
  return collection;
}

function createToken(collection, type, name, values) {
  const token = figma.variables.createVariable(name, collection.id, type);
  values.forEach((value, index) => {
    token.setValueForMode(collection.modes[index].modeId, value);
  });
  return token;
}

figma.showUI(__html__, { themeColors: true, height: 400 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'cancel') {
    figma.closePlugin();
  } else if (msg.type === 'load') {
    const url = await figma.clientStorage.getAsync("google-sheet-sync:url");
    const collection = await figma.clientStorage.getAsync("google-sheet-sync:collection");
    const columns = await figma.clientStorage.getAsync("google-sheet-sync:columns");

    if (url !== undefined && collection !== undefined && columns !== undefined) {
      figma.ui.postMessage({type: 'update', url, collection, columns});
    }
  } else if (msg.type === "sync") {
    let origin = [];

    try {
      origin = await fetchGoogleSheets(msg.url);
    } catch(e) {
      alert("The Google Sheet URL is invalid.");
    } finally {
      figma.ui.postMessage({ type: 'done' });
    }

    if (origin.length - 1 !== msg.columns.length) {
      alert("The number of columns you set is different from the Google Sheets result.");
    } else {
      const collections = figma.variables.getLocalVariableCollections();
      let collection = collections.find((collection) => collection.name === msg.collection);
      if (collection !== undefined) collection.remove();

      collection = createCollection(msg.collection, msg.columns);
      const keys = origin[0];
      keys.forEach((key, rowIndex) => {
        const values = [];
        msg.columns.forEach((_, colIndex) => {
          values.push(origin[colIndex + 1][rowIndex]);
        });
        createToken(collection, "STRING", key.split(".").join("_"), values)
      });

      await figma.clientStorage.setAsync("google-sheet-sync:url", msg.url);
      await figma.clientStorage.setAsync("google-sheet-sync:collection", msg.collection);
      await figma.clientStorage.setAsync("google-sheet-sync:columns", msg.columns);

      figma.closePlugin();
    }
  }
};
