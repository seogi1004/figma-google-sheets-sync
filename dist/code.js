({480:function(){var e=this&&this.__awaiter||function(e,o,t,i){return new(t||(t=Promise))((function(n,l){function c(e){try{s(i.next(e))}catch(e){l(e)}}function a(e){try{s(i.throw(e))}catch(e){l(e)}}function s(e){var o;e.done?n(e.value):(o=e.value,o instanceof t?o:new t((function(e){e(o)}))).then(c,a)}s((i=i.apply(e,o||[])).next())}))};function o(e,o,t,i){const n=figma.variables.createVariable(t,e.id,o);return i.forEach(((o,t)=>{n.setValueForMode(e.modes[t].modeId,o)})),n}figma.showUI(__html__,{themeColors:!0,width:360,height:380}),figma.ui.onmessage=t=>e(this,void 0,void 0,(function*(){if("cancel"===t.type)figma.closePlugin();else if("load"===t.type){const e=yield figma.clientStorage.getAsync("google-sheet-sync:url"),o=yield figma.clientStorage.getAsync("google-sheet-sync:collection"),t=yield figma.clientStorage.getAsync("google-sheet-sync:columns");void 0!==e&&void 0!==o&&void 0!==t&&figma.ui.postMessage({type:"update",url:e,collection:o,columns:t})}else if("check"===t.type){let e=figma.variables.getLocalVariableCollections().find((e=>e.name===t.collection));figma.ui.postMessage({type:"check",exist:void 0!==e})}else if("sync"===t.type){let i=[],n=[];try{i=yield function(o){return e(this,void 0,void 0,(function*(){const e=yield fetch(o+"&majorDimension=COLUMNS");return(yield e.json()).values}))}(t.url)}catch(e){alert("The Google Sheet URL is invalid.")}finally{figma.ui.postMessage({type:"done"})}if(0===t.columns.length)for(let e=1;e<i.length;e++)n.push("Mode "+e);else n=t.columns;let l=figma.variables.getLocalVariableCollections().find((e=>e.name===t.collection));const c=i.length-1,a=i[0];if(void 0!==l){const e={};l.variableIds.forEach((o=>{const t=figma.variables.getVariableById(o);e[t.name]=t})),a.forEach(((t,a)=>{const s=[],r=t.split(".").join("_");n.forEach(((e,o)=>{o<c&&s.push(i[o+1][a])})),e[r]?function(e,o,t,i){i.forEach(((o,i)=>{t.setValueForMode(e.modes[i].modeId,o)}))}(l,0,e[r],s):o(l,"STRING",r,s)}))}else l=function(e,o,t){const i=figma.variables.createVariableCollection(e);return o.forEach(((e,o)=>{o<t&&i.addMode(e.trim())})),i.removeMode(i.modes[0].modeId),i}(t.collection,n,c),a.forEach(((e,t)=>{const a=[];n.forEach(((e,o)=>{o<c&&a.push(i[o+1][t])})),o(l,"STRING",e.split(".").join("_"),a)}));yield figma.clientStorage.setAsync("google-sheet-sync:columns",n),yield figma.clientStorage.setAsync("google-sheet-sync:url",t.url),yield figma.clientStorage.setAsync("google-sheet-sync:collection",t.collection),figma.closePlugin()}}))}})[480]();