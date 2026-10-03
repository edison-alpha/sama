import { bsc, bscTestnet } from "viem/chains";

export const BSC_CHAIN_ID = 56;
export const BSC_TESTNET_CHAIN_ID = 97;

/** Sama runs on exactly one network per deployment. Mainnet needs an explicit build-time switch (PRD §6.1). */
export const SAMA_CHAIN_ID = Number(process.env.NEXT_PUBLIC_SAMA_CHAIN_ID ?? BSC_TESTNET_CHAIN_ID) === BSC_CHAIN_ID ? BSC_CHAIN_ID : BSC_TESTNET_CHAIN_ID;

export const samaChain = SAMA_CHAIN_ID === BSC_CHAIN_ID ? bsc : bscTestnet;
export const isTestnet = SAMA_CHAIN_ID === BSC_TESTNET_CHAIN_ID;

export const EXPLORER = isTestnet ? "https://testnet.bscscan.com" : "https://bscscan.com";
export const FAUCET_URL = "https://www.bnbchain.org/en/testnet-faucet";

export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const txLogsUrl = (hash: string) => `${EXPLORER}/tx/${hash}#eventlog`;
export const addressUrl = (address: string) => `${EXPLORER}/address/${address}`;
export const blockUrl = (block: string | number | bigint) => `${EXPLORER}/block/${block}`;
