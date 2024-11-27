import { Address, createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import {
  createPaymasterClient,
  entryPoint07Address,
} from "viem/account-abstraction";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless";
// import { erc7579Actions } from "permissionless/actions/erc7579";
// import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
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
  
const rpcUrl = "https://rpc.ankr.com/eth_sepolia"
const pimlicoUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`
export const paymasterUrl = "http://localhost:3000";

export const getPublicClient = () => {
  return createPublicClient({
    transport: http(rpcUrl),
    chain: sepolia,
  });
};
console.log({pimlicoUrl})
export const getPimlicoClient = () => {
  return createPimlicoClient({
    transport: http(pimlicoUrl),
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

export const getSafeAccount = (publicClient:any,walletClient:any) => {
    return toSafeSmartAccount({
        // address: accountAddress,
        client: publicClient,
        owners: [walletClient],
        version: "1.4.1",
        entryPoint: {
          address: entryPoint07Address,
          version: "0.7",
        },
        // safe4337ModuleAddress: "0x7579EE8307284F293B1927136486880611F20002",
        // erc7579LaunchpadAddress: "0x7579011aB74c46090561ea277Ba79D510c6C00ff",
    });
};
  
export const getSmartAccountClient = async (
  safeAccount: any
) => {
  const pimlicoClient = getPimlicoClient()
  console.log('***getSmartAccountClient', {
    account: safeAccount,
    chain: sepolia,
    bundlerTransport: http(pimlicoUrl),
    paymaster: pimlicoClient,
  })
  return createSmartAccountClient({
    account: safeAccount,
    chain: sepolia,
    bundlerTransport: http(pimlicoUrl),
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        return (await pimlicoClient.getUserOperationGasPrice()).fast;
      },
    },
  });
//   .extend(erc7579Actions());
};
