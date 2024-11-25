import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import {  entryPoint07Address } from "viem/account-abstraction"
import { toSafeSmartAccount } from "permissionless/accounts"
import { useWalletClient } from 'wagmi'

function App() {
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()
  const pimlicoUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`

  console.log(1, import.meta.env)
  console.log(2, sepolia)
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http("https://rpc.ankr.com/eth_sepolia"),
  })
  console.log(3, publicClient)
  const pimlicoClient = createPimlicoClient({
    transport: http(pimlicoUrl),
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
  })
  console.log(4, {pimlicoClient, account})
  const owner = useWalletClient()
  console.log(5, {owner})
  toSafeSmartAccount({
    client: publicClient,
    owners:[owner],
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    }, // global entrypoint
    version: "1.4.1",
  }).then((a)=> console.log('**then', a))
  .catch((e)=> console.log('**error', e))
  

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
