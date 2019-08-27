import React from 'react'
import ReactDOM from 'react-dom'
import { ApolloProvider } from 'react-apollo'
import 'core-js/es/object'

import Web3Connect from 'web3connect'

import App from 'App'
import { setupENS } from '@ensdomains/ui'
import { SET_ERROR } from 'graphql/mutations'

import { GlobalStateProvider } from 'globalState'
import 'globalStyles'
import { setupClient } from 'apolloClient'

const setupWeb3Connect = async () => {
  const web3Connect = new Web3Connect.Core()

  const providerPromise = new Promise((resolve, reject) => {
    // subscribe to connect
    web3Connect.on('connect', provider => {
      resolve(provider)
    })

    // subscribe to close
    web3Connect.on('close', () => {
      resolve()
    })
  })

  web3Connect.toggleModal()

  return providerPromise
}

window.addEventListener('load', async () => {
  let client
  try {
    client = await setupClient()

    const customProvider = await setupWeb3Connect()
    await setupENS({ reloadOnAccountsChange: true, customProvider })
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
