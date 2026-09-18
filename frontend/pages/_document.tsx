import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon: SVG first (crisp at any size, modern browsers), .ico
            as the universal fallback every browser/crawler still tries
            by default even without a <link> tag pointing at it. */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <meta name="theme-color" content="#7c3aed" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
