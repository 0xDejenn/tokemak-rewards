import "normalize.css/normalize.css";
import "../styles/globals.css";
import "../styles/design_tokens.css"
import type { AppProps } from "next/app";

function TokemakRewards({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default TokemakRewards;
