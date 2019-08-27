import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { ApolloProvider } from 'react-apollo'
import 'core-js/es/object'
import App from 'App'
import { setupENS, getWeb3 } from '@ensdomains/ui'
import { SET_ERROR } from 'graphql/mutations'

import WalletConnectProvider from '@walletconnect/web3-provider'
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal'

import {
  useInjectedProvider,
  setupApolloClient
} from './wallet-integration/injected'

import { GlobalStateProvider } from 'globalState'
import 'globalStyles'
import { setupClient } from 'apolloClient'

import ConnectWalletConnect, {
  startWalletListeners
} from './wallet-integration'

// ============================================================== //
// Line 9 of `setupENS`
// await setupWeb3({ customProvider, reloadOnAccountsChange })
// ============================================================== //

/* ============================================================== //
// replace in `setupWeb3` line 18 (custom provider logic)

  if (customProvider) {
    //for testing
    provider = new ethers.providers.Web3Provider(customProvider)
    signer = provider.getSigner()
    return { provider, signer }
  }
// and move this logic above
if (provider) {
  
// ============================================================== */

const ApolloConnector = ({ apolloClient }) => {
  const { client, resetClient } = useInjectedProvider(apolloClient)

  const [providers, setProviders] = useState({
    injected: false,
    wc: false
  })
  console.log('providers', providers)

  const connectToWC = useCallback(async () => {
    const {
      walletConnectProvider,
      walletConnector,
      WalletConnectQRCodeModal
    } = await connectToWalletConnect()
    startWalletListeners({
      walletConnector,
      WalletConnectQRCodeModal,
      onDisconnect: () => {
        resetClient(
          window.ethereum || (window.web3 && window.web3.currentProvider)
        )
      },
      onSessionUpdate: () => {
        resetClient()
      }
    })
    console.info('CONNECTED:WC', walletConnectProvider)

    resetClient(walletConnectProvider)
    setProviders(providers => ({
      ...providers,
      wc: { provider: walletConnectProvider, connector: walletConnector }
    }))
  }, [resetClient])

  const disconnectFromWC = useCallback(() => {
    console.log('providers.wc', providers.wc)
    window.wc && window.wc.killSession()
    setProviders(providers => ({
      ...providers,
      wc: false
    }))
  }, [providers.wc])

  window.connectToWC = connectToWC
  window.disconnectFromWC = disconnectFromWC

  const extraFunctions = useMemo(
    () => ({
      connectToWC,
      disconnectFromWC
    }),
    [connectToWC, disconnectFromWC]
  )

  return (
    <ApolloProvider client={client}>
      <GlobalStateProvider extra={extraFunctions}>
        <App />
      </GlobalStateProvider>
    </ApolloProvider>
  )
}

window.addEventListener('load', async () => {
  const client = await setupApolloClient()

  ReactDOM.render(
    <ApolloConnector apolloClient={client} />,
    document.getElementById('root')
  )
})

async function connectToWalletConnect({
  bridge = 'https://bridge.walletconnect.org',
  qrcode,
  onUri
} = {}) {
  // Create a walletConnector
  const walletConnectProvider = new WalletConnectProvider({
    bridge,
    qrcode
  })

  // set global
  const walletConnector = walletConnectProvider.wc

  // eslint-disable-next-line
  window.wc = walletConnector
  window.WCP = walletConnectProvider

  console.log('walletConnector.connected', walletConnector.connected)
  // Check if connection is already established
  if (!walletConnector.connected) {
    // create new session
    await walletConnector.createSession()

    // get uri for QR Code modal
    const uri = walletConnector.uri
    onUri && onUri(uri)
    // display QR Code modal
    WalletConnectQRCodeModal.open(uri, () => {
      console.log('QR Code Modal closed')
    })

    const accounts = await walletConnectProvider.enable()
    console.log('accounts', accounts)

    WalletConnectQRCodeModal.close()
    return { walletConnectProvider, walletConnector, WalletConnectQRCodeModal }
  }

  if (walletConnector.connected && window.WCP) {
    console.debug('WalletConnect connected')
    return {
      walletConnectProvider: window.WCP,
      walletConnector,
      WalletConnectQRCodeModal
    }
  }
}

// window.addEventListener('load', async () => {
//   let client
//   try {
//     window.client = client = await setupClient()
//     await setupENS({ reloadOnAccountsChange: true })
//   } catch (e) {
//     console.log(e)
//     await client.mutate({
//       mutation: SET_ERROR,
//       variables: { message: e.message }
//     })
//   }
//   ReactDOM.render(
//     <ApolloProvider client={client}>
//       <GlobalStateProvider>
//         <App />
//       </GlobalStateProvider>
//     </ApolloProvider>,
//     document.getElementById('root')
//   )
// })

// window.addEventListener('load', async () => {
//   let client
//   try {
//     window.client = client = await setupClient()
//     const {
//       walletConnectProvider: customProvider,
//       walletConnector,
//       WalletConnectQRCodeModal
//     } = await ConnectWalletConnect({
//       qrcode: true,
//       onUri: uri => console.debug('WalletConnect URI!', uri),
//       onSessionUpdate: e => console.debug('Session update!', e),
//       onDisconnect: () => {
//         console.warn('WalletConnect - Disconnected!')

//         window.location.reload()
//       }
//     })
//     console.debug('Custom Provider ==>', customProvider)
//     startWalletListeners({
//       walletConnector,
//       WalletConnectQRCodeModal,
//       onSessionUpdate: () => client && client.resetStore(),
//     })
//     await setupENS({ customProvider, reloadOnAccountsChange: true })
//   } catch (e) {
//     console.log(e)
//     await client.mutate({
//       mutation: SET_ERROR,
//       variables: { message: e.message }
//     })
//   }
//   ReactDOM.render(
//     <ApolloProvider client={client}>
//       <GlobalStateProvider>
//         <App />
//       </GlobalStateProvider>
//     </ApolloProvider>,
//     document.getElementById('root')
//   )
// })
