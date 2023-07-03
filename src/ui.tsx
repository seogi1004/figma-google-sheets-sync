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

    const onLink = () => {
        window.open("https://docs.google.com/spreadsheets/d/1iYOtMl4nqwtEgBWq4_B0EcIoSB5bc77OOhPzsm79nIc/edit?usp=sharing");
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
          <section>
            <label>Google Sheets URL</label>
            <input type="text" placeholder="(Required)" value={url} onInput={onInputUrl} />
          </section>
          <section>
            <label>Collection Name</label>
            <input type="text" placeholder="(Required)" value={collection} onInput={onInputCollection} />
          </section>
          <section>
            <label>Mode Names</label>
            <input type="text" placeholder="Mode 1,Mode 2,..." value={columns} onInput={onInputColumns} />
          </section>
            <section className={"footer"}>
                <button onClick={onLink}>Open Template Spreadsheet</button>
                { loading ?
                    <button>Now Loading...</button> :
                    <button className="brand" onClick={onSync} disabled={url === '' || collection === ''}>Import & Sync Variables</button>
                }
            </section>
        </main>
    );
}

ReactDOM.createRoot(document.getElementById("react-page")).render(<App />);
