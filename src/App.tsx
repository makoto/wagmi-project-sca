import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useWalletClient } from 'wagmi'
import {
  getPublicClient,
  getSmartAccountClient,
  getSafeAccount,
} from "./client.tsx"
const publicClient = getPublicClient()

function App() {
  const [safeAccount, setSafeAccount] = useState();
  const [smartAccountClient, setSmartAccountClient] = useState();
  const [txHash, setTxHash] = useState();
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()

  const {data: walletClient} = useWalletClient();

  const fetchData = async () => {
    try {
      console.log('**fetchData1', {walletClient});
      const _safeAccount = await getSafeAccount(publicClient, walletClient)
      console.log('**fetchData2', {_safeAccount});
      setSafeAccount(_safeAccount)
      const _smartAccountClient = await getSmartAccountClient(_safeAccount)
      console.log('**fetchData3', {_smartAccountClient});
      setSmartAccountClient(_smartAccountClient)
    } 
    catch (error:any) {
      console.log('**fetchData:error', error);
    }
  };

  useEffect(() => {
    fetchData()
    
  }, [walletClient]); // Empty dependency array means it runs only once when the component mounts

  const sendTx = (_smartAccountClient) => {
    console.log(1, _smartAccountClient)
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
