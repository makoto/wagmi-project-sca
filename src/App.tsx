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
  installSmartSession,
  getSession,
  getSessionOwner,
  createUserOperation,
  signSmartSession
} from "./client.tsx"

const publicClient = getPublicClient()
const sessionOwner = getSessionOwner()
const session = getSession(sessionOwner)

function App() {
  const [safeAccount, setSafeAccount] = useState();
  const [smartAccountClient, setSmartAccountClient] = useState();
  const [sessionDetails, setSessionDetails] = useState();
  // const [userOperation, setUserOperation] = useState();
  const [txHashes, setTxHashes] = useState([]);
  
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()
  const pimlicoClient = getPimlicoClient()
  const {data: walletClient} = useWalletClient();
  const smartSessions = getSmartSessionsValidator({
    sessions: [session]
  })
  const fetchData = async () => {
    try {
      const _safeAccount = await getSafeAccount(publicClient, walletClient)
      setSafeAccount(_safeAccount)
      const _smartAccountClient = await getSmartAccountClient(_safeAccount)
      setSmartAccountClient(_smartAccountClient)      

    } 
    catch (error:any) {
      console.log('**fetchData:error', error);
    }
  };

  useEffect(() => {
    fetchData()
  }, [walletClient]); // Empty dependency array means it runs only once when the component mounts

  const sendInstallSmartSessionTx = (
    smartAccountClient:any, pimlicoClient:any, smartSessions:any
  ) => {
    console.log('***1111', smartAccountClient, pimlicoClient)
    installSmartSession(smartAccountClient, pimlicoClient, smartSessions)
    .then((_tx:any) =>  {
      console.log('***1112', _tx)
      setTxHashes(txHashes.concat(_tx.receipt.transactionHash))
    })
  }
  console.log({                
    sessionOwner,
    safeAccount,
    publicClient,
    smartAccountClient,
    smartSessions,
    sessionDetails,
    session,
    pimlicoClient,
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
            <ul>
              <li>
                safe adress: { safeAccount.address}
              </li>
              <li>
                smartAccountClient address {smartAccountClient && smartAccountClient.account && smartAccountClient.account.address }
              </li>
              <li>
                sessionOwner: {sessionOwner && sessionOwner.address}
              </li>
              <li>
                smartSession address: {smartSessions && smartSessions.address}
              </li>
              <li>
                sessionDetails  : {
                  JSON.stringify(sessionDetails, (_, v) => typeof v === 'bigint' ? v.toString() : v)
                }
              </li>
            </ul>

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
                session,
                pimlicoClient,
                0,
                BigInt(0)
              ).then((_txhash)=>{
                console.log({_txhash})
                setTxHashes(txHashes.concat(_txhash.receipt.transactionHash))
              })
            }
            }>
              Increment 1
            </button>
            <h5>Txs</h5>
            <ul>
              {
                txHashes.map(tx => {
                  console.log('**txhashes', tx)
                  return (<li>https://sepolia.etherscan.io/tx/{tx}</li>)
                })
              }
            </ul>
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
