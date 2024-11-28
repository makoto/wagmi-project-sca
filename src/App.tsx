import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useWalletClient } from 'wagmi'
import {
  getSmartSessionsValidator
} from '@rhinestone/module-sdk'
import {
  getPublicClient,
  getSmartAccountClient,
  getSafeAccount,
  getPimlicoClient,
  setTrustAttesters,
  installSmartSession,
  getSession,
  getSessionOwner,
  createUserOperation,
  signSmartSession,
  executeUserOperation
} from "./client.tsx"

const publicClient = getPublicClient()
const sessionOwner = getSessionOwner()
const session = getSession(sessionOwner)

function App() {
  const [safeAccount, setSafeAccount] = useState();
  const [smartAccountClient, setSmartAccountClient] = useState();
  const [trustedAttesterTxHash, setTrustedAttesterTxHash] = useState();
  const [smartSessionTxHash, setSmartSessionTxHash] = useState();
  const [sessionDetails, setSessionDetails] = useState();
  const [userOperation, setUserOperation] = useState();
  const [executeUserOperationTxHash, setExecuteUserOperationTxHash] = useState();
  
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()
  const pimlicoClient = getPimlicoClient()
  const {data: walletClient} = useWalletClient();
  const smartSessions = getSmartSessionsValidator({})
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

  const sendSetTrustAttestersTx = (
    safeAccount: any, smartAccountClient: any, pimlicoClient: any
  ) => {
    setTrustAttesters(safeAccount,smartAccountClient,pimlicoClient)
    .then((_tx:any) =>  {
      setTrustedAttesterTxHash(_tx.receipt.transactionHash)
    })
  }

  const sendInstallSmartSessionTx = (
    smartAccountClient:any, pimlicoClient:any, smartSessions:any
  ) => {
    console.log('***1111', smartAccountClient, pimlicoClient)
    installSmartSession(smartAccountClient, pimlicoClient, smartSessions)
    .then((_tx:any) =>  {
      console.log('***1112', _tx)
      setSmartSessionTxHash(_tx.receipt.transactionHash)
    })
  }

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
            <h5>
              safe adress: { safeAccount.address}
            </h5>
            <button type="button" onClick={() => sendSetTrustAttestersTx(safeAccount, smartAccountClient, pimlicoClient )}>
              Set trusted attesters
            </button>
            <button type="button" onClick={() => sendInstallSmartSessionTx(smartAccountClient, pimlicoClient, smartSessions )}>
              Install smart session
            </button>
            <button type="button" onClick={() => {
              console.log('***', {safeAccount, walletClient})
              signSmartSession(safeAccount, walletClient, session ).then(_sessionDetails => { 
                console.log('****', {_sessionDetails})
                setSessionDetails(_sessionDetails)
              })
            }
            }>
              Sign smart session
            </button>

            <button type="button" onClick={() => {
              createUserOperation(
                sessionOwner,
                safeAccount,
                publicClient,
                smartAccountClient,
                smartSessions,
                sessionDetails,
                session
              ).then(_userOperation => {
                setUserOperation(_userOperation)
              })
            }
            }>
              Create User Operation
            </button>
            <button type="button" onClick={() => {
              executeUserOperation(smartAccountClient, pimlicoClient, userOperation)
              .then((_txhash)=>{
                console.log({_txhash})
                setExecuteUserOperationTxHash(_txhash.receipt.transactionHash)
              })
            }}>
              Execute user Operation
            </button>
            <h5>Txs</h5>
            {
              trustedAttesterTxHash && (
                `https://sepolia.etherscan.io/tx/${trustedAttesterTxHash}`
              )
            }
            {
              smartSessionTxHash && (
                `https://sepolia.etherscan.io/tx/${smartSessionTxHash}`
              )
            }
            {
              executeUserOperationTxHash && (
                `https://sepolia.etherscan.io/tx/${executeUserOperationTxHash}`
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
