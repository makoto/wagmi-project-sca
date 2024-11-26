import { Address, createPublicClient, http } from "viem";
import { bundlerUrl, paymasterUrl } from "./constants";
import { sepolia } from "viem/chains";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import {
  createPaymasterClient,
  entryPoint07Address,
} from "viem/account-abstraction";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless";
import { erc7579Actions } from "permissionless/actions/erc7579";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
	// getSmartSessionsValidator,
	// OWNABLE_VALIDATOR_ADDRESS,
	// getSudoPolicy,
	// Session,
	// getClient,
	// getAccount,
	// encodeSmartSessionSignature,
	// getOwnableValidatorMockSignature,
	RHINESTONE_ATTESTER_ADDRESS,
	MOCK_ATTESTER_ADDRESS,
	getTrustAttestersAction,
	// encodeValidatorNonce,
	// getOwnableValidator,
	// encodeValidationData,
	// getEnableSessionDetails,
  } from '@rhinestone/module-sdk'
  
const pimlicoUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`
const rpcUrl = "https://rpc.ankr.com/eth_sepolia"

export const getPublicClient = () => {
  return createPublicClient({
    transport: http(rpcUrl),
    chain: sepolia,
  });
};

export const getPimlicoClient = () => {
  return createPimlicoClient({
    transport: http(bundlerUrl),
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
  });
};

export const getTrustAttestersActionWithAttesters = () => {
    return getTrustAttestersAction({
        threshold: 1,
        attesters: [
          RHINESTONE_ATTESTER_ADDRESS, // Rhinestone Attester
          MOCK_ATTESTER_ADDRESS, // Mock Attester - do not use in production
        ],
    })
} 

createPimlicoClient({
    transport: http(pimlicoUrl),
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
  })

export const getPaymasterClient = () => {
  return createPaymasterClient({
    transport: http(paymasterUrl),
  });
};

export const getSmartAccountClient = async ({
//   accountAddress,
  walletClient
}: {
//   accountAddress: Address;
  walletClient: any;
}) => {
  const publicClient = getPublicClient();
  const pimlicoClient = getPimlicoClient();
  const paymasterClient = getPaymasterClient();

  const safeAccount = await toSafeSmartAccount({
    // address: accountAddress,
    client: publicClient,
    owners: [walletClient],
    version: "1.4.1",
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
    safe4337ModuleAddress: "0x7579EE8307284F293B1927136486880611F20002",
    erc7579LaunchpadAddress: "0x7579011aB74c46090561ea277Ba79D510c6C00ff",
  });

  return createSmartAccountClient({
    account: safeAccount,
    chain: sepolia,
    bundlerTransport: http(bundlerUrl),
    paymaster: paymasterClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        return (await pimlicoClient.getUserOperationGasPrice()).fast;
      },
    },
  });
//   .extend(erc7579Actions());
};
