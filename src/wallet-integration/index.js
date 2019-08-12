// import WalletConnect from "@walletconnect/browser";
import WalletConnectProvider from '@walletconnect/web3-provider'
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal'

let WCP

async function ConnectWalletConnect({
  bridge = 'https://bridge.walletconnect.org',
  qrcode,
  onUri,
  onSessionUpdate,
  onDisconnect
}) {
  // Create a walletConnector
  const walletConnectProvider = new WalletConnectProvider({
    bridge,
    qrcode,
    onUri,
    onSessionUpdate,
    onDisconnect
  })

  // set global
  const { wc: walletConnector } = walletConnectProvider

  // Check if connection is already established
  if (!walletConnector.connected) {
    // create new session
    await walletConnector.createSession()

    // get uri for QR Code modal
    const uri = walletConnector.uri
    // display QR Code modal
    WalletConnectQRCodeModal.open(uri, () => {
      console.log('QR Code Modal closed')
    })

    await walletConnectProvider.enable()

    WalletConnectQRCodeModal.close()
    WCP = walletConnectProvider
    return { walletConnectProvider, walletConnector, WalletConnectQRCodeModal }
  }

  if (walletConnector.connected && WCP) {
    console.debug('WalletConnect connected')
    return { walletConnectProvider: WCP }
  }
}

export function startWalletListeners({
  walletConnector,
  WalletConnectQRCodeModal
}) {
  let chainId
  // Subscribe to connection events
  walletConnector.on('connect', async (error, payload) => {
    if (error) {
      throw error
    }

    // Close QR Code Modal
    WalletConnectQRCodeModal.close()
  })

  walletConnector.on('session_update', (error, payload) => {
    if (error) {
      throw error
    }

    // Get updated accounts and chainId
    console.debug('Session update:', payload)

    if (payload.params[0].chainId !== chainId) {
      chainId = payload.params[0].chainId
      window.location.reload()
    }
  })

  walletConnector.on('disconnect', (error, payload) => {
    if (error) {
      throw error
    }

    // Delete walletConnector
    console.debug('Disconnect!', payload)
    window.location.reload()
  })
}

export default ConnectWalletConnect
