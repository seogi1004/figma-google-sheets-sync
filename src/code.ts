async function fetchGoogleSheets(url) {
  const response = await fetch(url + '&majorDimension=COLUMNS');
  const json = await response.json();
  return json.values;
}

function createCollection(name, columns, columnCount) {
  const collection = figma.variables.createVariableCollection(name);
  columns.forEach((col, colIndex) => {
    if (colIndex < columnCount) {
      if (colIndex === 0)
        collection.renameMode(collection.modes[0].modeId, col.trim());
      else
        collection.addMode(col.trim());
    }
  })
  return collection;
}

function createToken(collection, type, name, values, payload) {
  const token = figma.variables.createVariable(name, collection.id, type);
  values.forEach((value, index) => {
    token.setValueForMode(collection.modes[index].modeId, value);
  });

  payload.add += 1;
  return token;
}

function updateToken(collection, type, token, values, payload) {
  let isModified = false;
  values.forEach((value, index) => {
    const modeId = collection.modes[index].modeId;
    if (token.valuesByMode[modeId] !== value) {
      token.setValueForMode(modeId, value);
      isModified = true;
    }
  });

  if (isModified) payload.modify += 1;
  return token;
}

figma.showUI(__html__, { themeColors: true, width: 360, height: 380 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'cancel') {
    figma.closePlugin();
  } else if (msg.type === 'load') {
    const url = await figma.clientStorage.getAsync(`${figma.currentPage.id}:url`);
    const collection = await figma.clientStorage.getAsync(`${figma.currentPage.id}:collection`);
    const columns = await figma.clientStorage.getAsync(`${figma.currentPage.id}:columns`);

    if (url !== undefined && collection !== undefined && columns !== undefined) {
      figma.ui.postMessage({
        type: 'update', url, collection, columns
      });
    }
  } else if (msg.type === 'check') {
    const collections = figma.variables.getLocalVariableCollections();
    let collection = collections.find((collection) => collection.name === msg.collection);
    figma.ui.postMessage({
      type: 'check', exist: collection !== undefined, columns: collection !== undefined ? collection.modes.map((mode) => mode.name) : []
    });
  } else if (msg.type === 'sync') {
    const payloadForFinish = {
      type: 'finish', add: 0, modify: 0, delete: 0, changed: false
    };
    let origin = [];
    let columns = [];

    try {
      origin = await fetchGoogleSheets(msg.url);
      if (origin === undefined) {
        alert("The data does not exist, please check the data in your Google Sheet.");
        return;
      }
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
      if (columns.length !== columnCount) {
        alert("The number of collection modes and the number of data columns are different.");
        return;
      }

      const variableMap = {};

      // 현재 컬렉션에 있는 변수 맵에 저장
      collection.variableIds.forEach((id) => {
        const variable = figma.variables.getVariableById(id);
        variableMap[variable.name] = {
          variable,
          modified: false,
        };
      })

      // 변수 맵에 있으면 수정, 없으면 추가
      keys.forEach((key, rowIndex) => {
        const values = [];
        const newKey = key.split(".").join("_");

        columns.forEach((_, colIndex) => {
          if (colIndex < columnCount) {
            values.push(origin[colIndex + 1][rowIndex]);
          }
        });
        if (variableMap[newKey]) {
          updateToken(collection, "STRING", variableMap[newKey].variable, values, payloadForFinish);
          variableMap[newKey].modified = true;
        } else {
          createToken(collection, "STRING", newKey, values, payloadForFinish);
        }
      });

      // 변수 맵에 수정된게 없으면 삭제
      Object.keys(variableMap).forEach((key) => {
        if (!variableMap[key].modified) {
          variableMap[key].variable.remove();
          payloadForFinish.delete += 1;
        }
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
        createToken(collection, "STRING", key.split(".").join("_"), values, payloadForFinish);
      });
    }

    // 변경된 모드 개수 전송하기
    figma.ui.postMessage(payloadForFinish);

    // 설정 정보 저장하기
    await figma.clientStorage.setAsync(`${figma.currentPage.id}:url`, msg.url);
    await figma.clientStorage.setAsync(`${figma.currentPage.id}:collection`, msg.collection);
    await figma.clientStorage.setAsync(`${figma.currentPage.id}:columns`, columns);
  }
};
