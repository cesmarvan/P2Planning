import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

import { init, Ditto } from "@dittolive/ditto";

async function start() {
  // 1. Inicializa WASM
  await init();

  // 2. Crea instancia de Ditto
  const identity = {
    type: "offlinePlayground",
    appID: "a0284701-fb9c-46ab-add6-572c67197757",
    // Note: 'token', 'customAuthURL' and 'enableDittoCloudSync' are
    // specific to other identity types; keep them out of the
    // offlinePlayground identity while debugging.
  };

  console.log("Creating Ditto with identity:", identity);

  // Some Ditto SDK versions expect the identity object directly
  // instead of `{ identity: identity }`.
  const ditto = new Ditto(identity);

  ditto.updateTransportConfig((config) => {
  config.connect.websocketURLs.push(
    'wss://i83inp.cloud.dittolive.app'
  );
});

await ditto.store.execute("ALTER SYSTEM SET DQL_STRICT_MODE = false");

  // 3. Inicia sincronización
  ditto.startSync();

  // 4. Pasamos ditto a React como prop global
  ReactDOM.render(<App ditto={ditto} />, document.getElementById("root"));
}

start();
