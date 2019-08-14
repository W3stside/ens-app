import React from 'react'
import { useGlobalState } from 'globalState'

const WalletConnector = () => {
  const {
    extra: { connectToWC, disconnectFromWC }
  } = useGlobalState()

  return (
    <div>
      <button onClick={connectToWC}>Connect to WC</button>
      <button onClick={disconnectFromWC}>disconnect from WC</button>
    </div>
  )
}

export default WalletConnector
