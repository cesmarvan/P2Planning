import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { init, Ditto } from "@dittolive/ditto";

// Generate a stable siteID based on localStorage
// This ensures all tabs on the same device use the same peer identity
function getStableSiteID() {
  const key = "ditto_stable_siteid";
  let stored = localStorage.getItem(key);
  
  if (stored) {
    return BigInt(stored);
  }
  
  // Generate a stable ID from userAgent hash, store it
  const ua = navigator.userAgent;
  let hash = 0;
  for (let i = 0; i < ua.length; i++) {
    const char = ua.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Use absolute value and convert to positive number, then to BigInt
  const siteID = BigInt(Math.abs(hash) & 0x7FFFFFFF); // Use lower 31 bits as positive number
  localStorage.setItem(key, siteID.toString());
  return siteID;
}

async function start() {
  // 1. Inicializa WASM
  await init();

  console.log("Initializing Ditto with Cloud WebSocket sync...");

  // 2. Crea instancia de Ditto con onlinePlayground
  // This uses Ditto Cloud for real P2P sync across all devices and tabs

const ditto = new Ditto({
  type: "onlinePlayground",
  appID: "a0284701-fb9c-46ab-add6-572c67197757",
  token: "1a2db5a9-dcd6-4ea1-a3ec-6bc337be7038",
  customAuthURL: "https://i83inp.cloud.dittolive.app",
  enableDittoCloudSync: false
});

ditto.updateTransportConfig((config) => {
  config.connect.websocketURLs.push(
    'wss://i83inp.cloud.dittolive.app'
  );
});

// Disable DQL strict mode so that collection definitions are not required in DQL queries
await ditto.store.execute("ALTER SYSTEM SET DQL_STRICT_MODE = false");

ditto.startSync();
  console.log("Ditto sync started with Cloud WebSocket - connecting to i83inp.cloud.dittolive.app");

  // 4. Pasamos ditto a React como prop global usando createRoot
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<App ditto={ditto} />);
}

start();
