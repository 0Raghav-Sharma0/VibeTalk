import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import ClerkAuthBridge from "./components/ClerkAuthBridge.jsx";
import { env, assertFrontendEnv } from "./config/env.js";

assertFrontendEnv();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider publishableKey={env.clerkPublishableKey}>
      <BrowserRouter>
        <ClerkAuthBridge>
          <App />
        </ClerkAuthBridge>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);
