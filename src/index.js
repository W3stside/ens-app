import React from 'react'
import ReactDOM from 'react-dom'
import { ApolloProvider } from 'react-apollo'
import 'core-js/es/object'
import App from 'App'
import { setupENS } from '@ensdomains/ui'
import { SET_ERROR } from 'graphql/mutations'

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
  
// ============================================================== */

window.addEventListener('load', async () => {
  let client
  try {
    client = await setupClient()
    const {
      walletConnectProvider: customProvider,
      walletConnector,
      WalletConnectQRCodeModal
    } = await ConnectWalletConnect({
      qrcode: true,
      onUri: uri => console.debug('WalletConnect URI!', uri),
      onSessionUpdate: e => console.debug('Session update!', e),
      onDisconnect: () => {
        console.warn('WalletConnect - Disconnected!')

        window.location.reload()
      }
    })
    console.debug('Custom Provider ==>', customProvider)
    startWalletListeners({ walletConnector, WalletConnectQRCodeModal })
    await setupENS({ customProvider, reloadOnAccountsChange: true })
  } catch (e) {
    console.log(e)
    await client.mutate({
      mutation: SET_ERROR,
      variables: { message: e.message }
    })
  }
  ReactDOM.render(
    <ApolloProvider client={client}>
      <GlobalStateProvider>
        <App />
      </GlobalStateProvider>
    </ApolloProvider>,
    document.getElementById('root')
  )
})
