import Head from "next/head";
import React from "react";
import styles from "./layout.module.css";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <div className={styles.container}>
      <Head>
        <meta
          name="description"
          content="Obtain your Tokemark reward history."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Tokemark Rewards</title>
      </Head>

      <header className={styles.header}>
        <h1>Tokemak Rewards</h1>
      </header>

      <main>{children}</main>
    </div>
  );
}
