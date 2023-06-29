import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./ui.css";

function App() {
    const [loading, setLoading] = React.useState(false);
    const [collection, setCollection] = React.useState("");
    const [url, setUrl] = React.useState("");
    const [columns, setColumns] = React.useState("");

    React.useEffect(() => {
        parent.postMessage(
            { pluginMessage: { type: 'load' } },
            '*'
        );
    }, []);

    const onSync = () => {
        setLoading(true);
        parent.postMessage(
        { pluginMessage: { type: 'sync', collection, url, columns: columns.split(',') } },
        "*"
        );
    };

    const onInputCollection = (e) => {
        setCollection(e.target.value);
    }
    const onInputUrl = (e) => {
        setUrl(e.target.value);
    }
    const onInputColumns = (e) => {
        setColumns(e.target.value);
    }

    const onCancel = () => {
        parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");
    };

    addEventListener("message", (e) => {
        const data = e.data.pluginMessage;
        if (data.type === "done") {
            setLoading(false);
        } else if (data.type === "update") {
            setCollection(data.collection);
            setUrl(data.url);
            setColumns(data.columns.join(","));
        }
    })
    return (
        <main>
          <header>
            <h2>Google Sheets Sync</h2>
          </header>
          <section>
            <input id="input" type="text" placeholder="(Required)" value={url} onInput={onInputUrl} />
            <label htmlFor="input">Google Sheets URL</label>
          </section>
          <section>
            <input id="input" type="text" placeholder="(Required)" value={collection} onInput={onInputCollection} />
            <label htmlFor="input">Collection Name</label>
          </section>
          <section>
            <input id="input" type="text" placeholder="Mode 1,Mode 2,..." value={columns} onInput={onInputColumns} />
            <label htmlFor="input">Mode Names</label>
          </section>
            { loading ?
                <footer>Loading...</footer> :
                <footer>
                    <button className="brand" onClick={onSync} disabled={url === '' || collection === ''}>Sync</button>
                    <button onClick={onCancel}>Cancel</button>
                </footer>
            }
        </main>
    );
}

ReactDOM.createRoot(document.getElementById("react-page")).render(<App />);
