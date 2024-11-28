import { Address, createPublicClient, http, toBytes, toFunctionSelector, toHex } from "viem";
import { sepolia } from "viem/chains";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import {
  entryPoint07Address,
  getUserOperationHash
} from "viem/account-abstraction";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless";
import { getAccountNonce } from "permissionless/actions";
import { erc7579Actions } from "permissionless/actions/erc7579";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
  
import {
	OWNABLE_VALIDATOR_ADDRESS,
	getSudoPolicy,
	Session,
	getAccount,
	encodeSmartSessionSignature,
	getOwnableValidatorMockSignature,
	RHINESTONE_ATTESTER_ADDRESS,
	MOCK_ATTESTER_ADDRESS,
	getTrustAttestersAction,
	encodeValidatorNonce,
	getOwnableValidator,
	encodeValidationData,
	getEnableSessionDetails,
    getSmartSessionsValidator
} from '@rhinestone/module-sdk'
  
const rpcUrl = "https://rpc.ankr.com/eth_sepolia"
const pimlicoUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`

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

export const getSessionOwner = () => {
    return  privateKeyToAccount(generatePrivateKey())
}

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
    const ownableValidator = getOwnableValidator({
        owners: [walletClient.account.address],
        threshold: 1,
    })

    return toSafeSmartAccount({
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
        attesters: [
            RHINESTONE_ATTESTER_ADDRESS, // Rhinestone Attester
            MOCK_ATTESTER_ADDRESS, // Mock Attester - do not use in production
          ],
          attestersThreshold: 1,
          validators: [
            {
              address: ownableValidator.address,
              context: ownableValidator.initData,
            },
          ],
    });
};
  
export const getSmartAccountClient = async (
  safeAccount: any
) => {
  const pimlicoClient = getPimlicoClient()
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
  }).extend(erc7579Actions());
};

export const setTrustAttesters = async (
    safeAccount: any,
    smartAccountClient:any,
    pimlicoClient: any
) => {
    const trustAttestersAction = getTrustAttestersAction({
        threshold: 1,
        attesters: [
          RHINESTONE_ATTESTER_ADDRESS, // Rhinestone Attester
          MOCK_ATTESTER_ADDRESS, // Mock Attester - do not use in production
        ],
    })
    console.log('***setTrustAttesters1', {trustAttestersAction})
    const userOpHash1 = await smartAccountClient.sendUserOperation({
        account: safeAccount,
        calls: [
            {
            to: trustAttestersAction.target,
            value: BigInt(0),
            data: trustAttestersAction.callData,
            },
        ],
    })
    console.log('***setTrustAttesters2', {userOpHash1})
    return pimlicoClient.waitForUserOperationReceipt({
        hash: userOpHash1,
    })
} 

export const installSmartSession = async (smartAccountClient:any, pimlicoClient: any, smartSessions:any) => {
    console.log('***installSmartSession1', {smartAccountClient, pimlicoClient, smartSessions})
    const smartSessions2 = getSmartSessionsValidator({})
    const opHash = await smartAccountClient.installModule(smartSessions2)
    console.log('***installSmartSession2', {opHash})
    return pimlicoClient.waitForUserOperationReceipt({
        hash: opHash,
    })
}

export const getSession = (sessionOwner:any) => {  
    // Step 9: https://docs.rhinestone.wtf/module-sdk/using-modules/smart-sessions#create-the-session-to-enable
    const session: Session = {
      sessionValidator: OWNABLE_VALIDATOR_ADDRESS,
      sessionValidatorInitData: encodeValidationData({
        threshold: 1,
        owners: [sessionOwner.address],
      }),
      salt: toHex(toBytes("0", { size: 32 })),
      userOpPolicies: [],
      erc7739Policies: {
        allowedERC7739Content: [],
        erc1271Policies: [],
      },
      actions: [
        {
          actionTarget: "0x6fc7314c80849622b04d943a6714b05078ca2d05" as Address,
          actionTargetSelector: toFunctionSelector("function increment()"),
          actionPolicies: [getSudoPolicy()],
        },
      ],
      chainId: BigInt(sepolia.id),
    };
    return session;
};

export const signSmartSession = async ( safeAccount: any, walletClient:any, session:any) => {
    console.log('**signSmartSession0', {safeAccount, walletClient, 1:walletClient?.account.address});
    const client = getPublicClient();
    console.log('**signSmartSession1', {client, session});
    // Step 10: https://docs.rhinestone.wtf/module-sdk/using-modules/smart-sessions#get-the-session-details
    const account = getAccount({
      address: safeAccount.address,
      type: 'safe',
    })
    console.log('**signSmartSession2', {account});
    const sessionDetails = await getEnableSessionDetails({
      sessions: [session],
      account,
      clients: [client],
    })
    console.log('**signSmartSession3', {sessionDetails});
    // Step 11: https://docs.rhinestone.wtf/module-sdk/using-modules/smart-sessions#have-the-user-sign-the-enable-signature
    const permissionEnableSig = await walletClient.signMessage({
        message: { raw: sessionDetails.permissionEnableHash },
    })
    console.log('**signSmartSession4', {permissionEnableSig});
    sessionDetails.enableSessionData.enableSession.permissionEnableSig = permissionEnableSig
    return sessionDetails
}

export const createUserOperation = async (
    sessionOwner: any,
    safeAccount: any,
    publicClient:any,
    smartAccountClient: any,
    smartSessions:any,
    sessionDetails:any,
    session:any
) => {
    const account = getAccount({
        address: safeAccount.address,
        type: 'safe',
    })
    // Step 12: https://docs.rhinestone.wtf/module-sdk/using-modules/smart-sessions#create-the-useroperation-to-execute
    const nonce = await getAccountNonce(publicClient, {
        address: safeAccount.address,
        entryPointAddress: entryPoint07Address,
        key: encodeValidatorNonce({
            account,
            validator: smartSessions,
        }),
    })
    console.log('***createUserOperation2',nonce)
    const mockSignature = getOwnableValidatorMockSignature({
        threshold: 1,
    })
    console.log('***createUserOperation3',mockSignature)
    sessionDetails.signature = mockSignature
    
    const userOperation = await smartAccountClient.prepareUserOperation({
        account: safeAccount,
        calls: [
            {
            to: session.actions[0].actionTarget,
            value: BigInt(0),
            data: session.actions[0].actionTargetSelector,
            },
        ],
        nonce,
        signature: encodeSmartSessionSignature(sessionDetails),
    })
    console.log('***createUserOperation4',userOperation)
    
    // Step 13: https://docs.rhinestone.wtf/module-sdk/using-modules/smart-sessions#create-the-session-key-signature
    const userOpHashToSign = getUserOperationHash({
        chainId: 11155111,
        entryPointAddress: entryPoint07Address,
        entryPointVersion: '0.7',
        userOperation,
    })
    console.log('***createUserOperation5',userOpHashToSign)
    const signature = await sessionOwner.signMessage({
      message: { raw: userOpHashToSign },
    })
    sessionDetails.signature = signature
    console.log('***createUserOperation6', signature)
    userOperation.signature = encodeSmartSessionSignature(sessionDetails)
    return userOperation
}

export const executeUserOperation = async (smartAccountClient:any, pimlicoClient:any, userOperation:any) => {
    console.log('executeUserOperation**0', userOperation)
    // Step 14: https://docs.rhinestone.wtf/module-sdk/using-modules/smart-sessions#execute-the-useroperation
    const userOpHash = await smartAccountClient.sendUserOperation(userOperation) 
    console.log('executeUserOperation**1', userOpHash)
    const receipt = await pimlicoClient.waitForUserOperationReceipt({
        hash: userOpHash,
    })
    console.log('executeUserOperation**2', receipt)
    return receipt
}
