// import WalletConnect from "@walletconnect/browser";
import WalletConnectProvider from '@walletconnect/web3-provider'
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal'

let WCP

async function ConnectWalletConnect({
  bridge = 'https://bridge.walletconnect.org',
  qrcode,
  onUri
}) {
  // Create a walletConnector
  const walletConnectProvider = new WalletConnectProvider({
    bridge,
    qrcode
  })

  // set global
  const { wc: walletConnector } = walletConnectProvider

  // eslint-disable-next-line
  window.wc = walletConnector
  WCP = walletConnectProvider

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

  if (walletConnector.connected && WCP) {
    console.debug('WalletConnect connected')
    return {
      walletConnectProvider: WCP,
      walletConnector,
      WalletConnectQRCodeModal
    }
  }
}

export function startWalletListeners({
  walletConnector,
  WalletConnectQRCodeModal,
  onSessionUpdate,
  onDisconnect
}) {
  let chainId
  // Subscribe to connection events
  walletConnector.on('connect', async (error, payload) => {
    console.log('walletConnector.on(connect)', error, payload)
    if (error) {
      throw error
    }

    // Close QR Code Modal
    WalletConnectQRCodeModal.close()
  })

  walletConnector.on('session_update', (error, payload) => {
    console.log('walletConnector.on(session_update)', error, payload)
    if (error) {
      throw error
    }

    // Get updated accounts and chainId
    console.debug('Session update:', payload)

    // if (payload.params[0].chainId !== chainId) {
    //   chainId = payload.params[0].chainId
    //   window.location.reload()
    // }

    onSessionUpdate && onSessionUpdate()
  })

  walletConnector.on('disconnect', (error, payload) => {
    console.log('walletConnector.on(disconnect)', error, payload)
    if (error) {
      throw error
    }

    // Delete walletConnector
    console.debug('Disconnect!', payload)
    // window.location.reload()

    onDisconnect && onDisconnect()
  })
}

export default ConnectWalletConnect
