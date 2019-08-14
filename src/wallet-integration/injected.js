import { useEffect, useMemo, useCallback, useState, useRef } from 'react'
import { setupENS, getWeb3 } from '@ensdomains/ui'
import { setupClient } from 'apolloClient'

export const setupApolloClient = async web3provider => {
  console.debug('setupApolloClient with provider', web3provider || 'default')
  await setupENS({
    reloadOnAccountsChange: false,
    customProvider: web3provider
  })
  const client = await setupClient()
  window.client = client
  // have to re-setup the whole ENS, because its registrar's address depends on networkId
  // which depends on provider set
  return client
}

export const setupListeners = (provider, event2cb = {}) => {
  if (!provider.on) return null

  return Object.entries(event2cb).reduce((accum, [ev, cb]) => {
    provider.on(ev, cb)

    accum[ev] = () => provider.off && provider.off(ev, cb)
    return accum
  }, {})
}

export const cancelListeners = (event2cancel = {}) => {
  Object.values(cancelListeners).forEach(cb => cb())
}

export const useInjectedProvider = apolloClient => {
  const [client, setClient] = useState(apolloClient)
  const cancellers = useRef([])

  const resetClient = useCallback(
    async web3provider => {
      console.debug('web3provider', web3provider)
      client.stop()
      await client.resetStore()

      const newClient = await setupApolloClient(web3provider)

      setClient(newClient)
      console.debug('Set new client')
    },
    [client]
  )

  // const connectToWC = useCallback(async () => {
  //     const { walletConnectProvider, walletConnector, WalletConnectQRCodeModal } = await connectToWalletConnect()
  //     startWalletListeners({
  //         walletConnector, WalletConnectQRCodeModal, onDisconnect: () => {
  //             resetClient(undefined, { cache: false })
  //         }, onSessionUpdate: () => {
  //             resetClient(undefined, { cache: true })
  //         }
  //     })
  //     console.info('CONNECTED:WC', walletConnectProvider)

  //     resetClient(walletConnectProvider, { cache: false })
  // }, [resetClient])

  const accountsChanged = useCallback(
    p => {
      console.info('EVENT::accountsChanged', p)
      resetClient()
    },
    [resetClient]
  )

  useEffect(() => {
    if (window.ethereum && window.ethereum.on) {
      const cancellables = setupListeners(window.ethereum, {
        accountsChanged
      })

      return () => cancelListeners(cancellables)
    }
  }, [])

  // useEffect(() => {
  //     console.debug('Apollo client in use', client)
  //     let clientChanged = false

  //     getWeb3().then(provider => {
  //         console.debug('provider', provider);
  //         if (clientChanged) return
  //         const cancellables = setupListeners(provider, {
  //             accountsChanged
  //         })

  //         cancellers.current.push(cancellables)
  //     })

  //     return () => {
  //         console.debug('Apollo client changed')

  //         cancellers.current.forEach(cancelListeners)
  //         cancellers.current = []
  //         clientChanged = true
  //     }
  // }, [client, accountsChanged])

  useMemo(() => {
    window.resetClient = resetClient
    // window.connectToWC = connectToWC
  }, [client])

  return {
    client,
    resetClient
  }
}
