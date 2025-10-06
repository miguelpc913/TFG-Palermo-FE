import { isValidAutomergeUrl, type AutomergeUrl } from "@automerge/react";
import { TaskList } from "./components/TaskList";
import { DocumentList } from "./components/DocumentList";
import { useHash } from "react-use";
import { SyncControls } from "./components/SyncControls";

function App({ docUrl }: { docUrl: AutomergeUrl }) {
  const [hash, setHash] = useHash();
  const cleanHash = hash.slice(1); // Remove the leading '#'
  const selectedDocUrl =
    cleanHash && isValidAutomergeUrl(cleanHash) ? (cleanHash as AutomergeUrl) : null;

  return (
    <>
      <header>
        <h1>Automerge Task List</h1>
      </header>

      <main>
        <div className="document-list">
          <DocumentList
            docUrl={docUrl}
            onSelectDocument={url => {
              if (url) {
                setHash(url);
              } else {
                setHash("");
              }
            }}
            selectedDocument={selectedDocUrl}
          />
        </div>
        <div className="task-list">
          {selectedDocUrl ? <TaskList docUrl={selectedDocUrl} /> : null}
        </div>
      </main>

      <footer>
        <SyncControls docUrl={docUrl} />
        <p className="footer-copy">Powered by Automerge + Vite + React + TypeScript</p>
      </footer>
    </>
  );
}

export default App;
