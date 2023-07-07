import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./ui.css";

function App() {
    const [loading, setLoading] = React.useState(false);
    const [collection, setCollection] = React.useState("");
    const [url, setUrl] = React.useState("");
    const [columns, setColumns] = React.useState("");
    const [exist, setExist] = React.useState(false);
    const [addCount, setAddCount] = React.useState(0);
    const [modifyCount, setModifyCount] = React.useState(0);
    const [deleteCount, setDeleteCount] = React.useState(0);
    const [isLoaded, setIsLoaded] = React.useState(false);

    const onSync = () => {
        setLoading(true);
        parent.postMessage(
        {
            pluginMessage: {
                type: 'sync',
                collection,
                url,
                columns: columns === '' ? [] : columns.split(',')
            }
        },
        "*"
        );
    };
    const onCheckCollection = (collection) => {
        parent.postMessage(
            {
                pluginMessage: {
                    type: 'check',
                    collection,
                }
            },
            "*"
        );
    }

    const onInputCollection = (e) => {
        setCollection(e.target.value);
        onCheckCollection(e.target.value);
    }
    const onInputUrl = (e) => {
        setUrl(e.target.value);
    }
    const onInputColumns = (e) => {
        setColumns(e.target.value);
    }

    const onLink = () => {
        window.open("https://docs.google.com/spreadsheets/d/1iYOtMl4nqwtEgBWq4_B0EcIoSB5bc77OOhPzsm79nIc/edit?usp=sharing");
    };

    const figmaEventHandler = (e) => {
        const data = e.data.pluginMessage;
        if (data.type === "done") {
            setLoading(false);
        } else if (data.type === "finish") {
            setAddCount(data.add);
            setModifyCount(data.modify);
            setDeleteCount(data.delete);
            setIsLoaded(true);
        } else if (data.type === "update") {
            setCollection(data.collection);
            setUrl(data.url);
            setColumns(data.columns.join(","));
            onCheckCollection(data.collection);
        } else if (data.type === 'check') {
            setExist(data.exist);
            setColumns(data.columns.join(","));
        }
    };

    React.useEffect(() => {
        parent.postMessage(
            { pluginMessage: { type: 'load' } },
            '*'
        );

        addEventListener("message", figmaEventHandler);
        return () => {
            removeEventListener("message", figmaEventHandler);
        }
    }, []);

    return (
        <main>
          <section>
            <label>Google Sheets URL</label>
            <input type="text" placeholder="(Required)" value={url} onInput={onInputUrl} />
          </section>
          <section className={"collection"}>
            <label>Collection Name</label>
            <input type="text" placeholder="(Required)" value={collection} onInput={onInputCollection} />
              { collection !== '' ? <span className={exist ? 'exist' : 'empty'}>{ exist ? 'Exist' : 'Empty'}</span> : <span></span> }
          </section>
          <section>
            <label>Mode Names</label>
            <input type="text" placeholder="Mode 1,Mode 2,..." value={columns} disabled={exist} onInput={onInputColumns} />
          </section>
            <section className="footer">
                {addCount === 0 && modifyCount === 0 && deleteCount === 0 ?
                    <div className="info">{ isLoaded ? "No data has been changed!!" : "" }</div> :
                    <div className="info">
                        <span className="add">{addCount} added</span>
                        <span className="modify">{modifyCount} modified</span>
                        <span className="delete">{deleteCount} deleted</span>
                    </div>
                }
                <button onClick={onLink}>Open Template Spreadsheet</button>
                { loading ?
                    <button className="loading">Now Loading...</button> :
                    <button className="brand" onClick={onSync} disabled={url === '' || collection === ''}>Import & Sync Variables</button>
                }
            </section>
        </main>
    );
}

ReactDOM.createRoot(document.getElementById("react-page")).render(<App />);
