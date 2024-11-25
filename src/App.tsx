import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import {  entryPoint07Address } from "viem/account-abstraction"
import { toSafeSmartAccount } from "permissionless/accounts"
import { useWalletClient } from 'wagmi'
import { createSmartAccountClient } from "permissionless"
const pimlicoUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http("https://rpc.ankr.com/eth_sepolia"),
})
const pimlicoClient = createPimlicoClient({
  transport: http(pimlicoUrl),
  entryPoint: {
    address: entryPoint07Address,
    version: "0.7",
  },
})

function App() {
  const [safeAccount, setSafeAccount] = useState();
  const [smartAccountClient, setSmartAccountClient] = useState();
  const [txHash, setTxHash] = useState();
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()

  const {data: walletClient} = useWalletClient();

  if(!safeAccount){
    toSafeSmartAccount({
      client: publicClient,
      owners:[walletClient],
      entryPoint: {
        address: entryPoint07Address,
        version: "0.7",
      }, // global entrypoint
      version: "1.4.1",
    }).then((_safeAccount)=>  {
      setSafeAccount(_safeAccount)
      console.log('**then')
      console.log({_safeAccount})
      const _smartAccountClient = createSmartAccountClient({
        account: _safeAccount,
        chain: sepolia,
        bundlerTransport: http(pimlicoUrl),
        paymaster: pimlicoClient,
        userOperation: {
          estimateFeesPerGas: async () => {
            return (await pimlicoClient.getUserOperationGasPrice()).fast
          },
        },
      })
      setSmartAccountClient(_smartAccountClient)
      console.log('**then2', _smartAccountClient)
    })
    .catch((e)=> console.log('**error', e))  
  }
  const sendTx = (_smartAccountClient) => {
    console.log(1, _smartAccountClient)
    // if(smartAccountClient){
    //   console.log(12, smartAccountClient)
    // }
    _smartAccountClient.sendTransaction({
      to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      value: 0n,
      data: "0x1234",
    }).then((_tx:any) =>  {
      setTxHash(_tx)
    })
  }

  console.log(10, {
    walletClient,
    smartAccountClient,
    safeAccount
  })
  return (
    <>
      <div>
        <h2>Account</h2>

        <div>
          status: {account.status}
          <br />
          addresses: {JSON.stringify(account.addresses)}
          <br />
          chainId: {account.chainId}
        </div>

        {account.status === 'connected' && (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
        {safeAccount && (
          <div>
            safe adress: { safeAccount.address}
            <button type="button" onClick={() => sendTx(smartAccountClient)}>
              Send Tx
            </button>
            {
              txHash && (
                `https://sepolia.etherscan.io/tx/${txHash}`
              )
            }
          </div>
        )}


      </div>

      <div>
        <h2>Connect</h2>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        <div>{status}</div>
        <div>{error?.message}</div>
      </div>
    </>
  )
}

export default App
