async function fetchGoogleSheets(url) {
  const response = await fetch(url + '&majorDimension=COLUMNS');
  const json = await response.json();
  return json.values;
}

function createCollection(name, columns, columnCount) {
  const collection = figma.variables.createVariableCollection(name);
  columns.forEach((col, colIndex) => {
    if (colIndex < columnCount) {
      collection.addMode(col.trim());
    }
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

function updateToken(collection, type, token, values) {
  values.forEach((value, index) => {
    token.setValueForMode(collection.modes[index].modeId, value);
  });
  return token;
}

figma.showUI(__html__, { themeColors: true, width: 360, height: 380 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'cancel') {
    figma.closePlugin();
  } else if (msg.type === 'load') {
    const url = await figma.clientStorage.getAsync("google-sheet-sync:url");
    const collection = await figma.clientStorage.getAsync("google-sheet-sync:collection");
    const columns = await figma.clientStorage.getAsync("google-sheet-sync:columns");

    if (url !== undefined && collection !== undefined && columns !== undefined) {
      figma.ui.postMessage({ type: 'update', url, collection, columns });
    }
  } else if (msg.type === 'check') {
    const collections = figma.variables.getLocalVariableCollections();
    let collection = collections.find((collection) => collection.name === msg.collection);
    figma.ui.postMessage({ type: 'check', exist: collection !== undefined });
  } else if (msg.type === 'sync') {
    let origin = [];
    let columns = [];

    try {
      origin = await fetchGoogleSheets(msg.url);
    } catch(e) {
      alert("The Google Sheet URL is invalid.");
    } finally {
      figma.ui.postMessage({ type: 'done' });
    }

    // 컬럼 개수가 맞지 않을 경우
    if (msg.columns.length === 0) {
      for (let i = 1; i < origin.length; i++) {
        columns.push('Mode ' + i);
      }
    } else {
      columns = msg.columns;
    }

    // 여기서부터 컬렉션 생성 및 데이터 동기화
    const collections = figma.variables.getLocalVariableCollections();
    let collection = collections.find((collection) => collection.name === msg.collection);

    const columnCount = origin.length - 1;
    const keys = origin[0];

    if (collection !== undefined) {
      const variableMap = {};
      collection.variableIds.forEach((id) => {
        const variable = figma.variables.getVariableById(id);
        variableMap[variable.name] = variable;
      })

      keys.forEach((key, rowIndex) => {
        const values = [];
        columns.forEach((_, colIndex) => {
          if (colIndex < columnCount) {
            values.push(origin[colIndex + 1][rowIndex]);
          }
        });
        if (variableMap[key])
          updateToken(collection, "STRING", variableMap[key], values)
      });
    } else {
      collection = createCollection(msg.collection, columns, columnCount);

      keys.forEach((key, rowIndex) => {
        const values = [];
        columns.forEach((_, colIndex) => {
          if (colIndex < columnCount) {
            values.push(origin[colIndex + 1][rowIndex]);
          }
        });
        createToken(collection, "STRING", key.split(".").join("_"), values)
      });
    }

    // 설정 정보 저장하기
    await figma.clientStorage.setAsync("google-sheet-sync:columns", columns);
    await figma.clientStorage.setAsync("google-sheet-sync:url", msg.url);
    await figma.clientStorage.setAsync("google-sheet-sync:collection", msg.collection);

    figma.closePlugin();
  }
};
