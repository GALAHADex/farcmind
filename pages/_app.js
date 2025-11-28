import "@/styles/globals.css";
import { useEffect } from "react";
import { actions } from "@farcaster/frame-sdk";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    actions.ready(); // Farcaster mini app içerik hazır sinyali
  }, []);

  return <Component {...pageProps} />;
}
