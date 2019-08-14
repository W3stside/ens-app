import { getWeb3, getAccounts, getNetworkId, isReadOnly } from '@ensdomains/ui'
import { getAddress } from '@ensdomains/ui'
import merge from 'lodash/merge'
import fifsResolvers, {
  defaults as fifsDefaults
} from './fifsRegistrar/resolvers'
import managerResolvers, {
  defaults as managerDefaults
} from './manager/resolvers'
import auctionRegistrarResolvers, {
  defaults as auctionRegistrarDefaults
} from './registrar/resolvers'
import subDomainRegistrarResolvers, {
  defaults as subDomainRegistrarDefaults
} from './subDomainRegistrar/resolvers'

const rootDefaults = {
  web3: {
    accounts: [],
    networkId: 0,
    __typename: 'Web3'
  },
  error: null,
  loggedIn: null,
  pendingTransactions: [],
  transactionHistory: []
}

const resolvers = {
  Web3: {
    accounts: async ({ web3Instance }) => {
      // can use that if we don't cache signer in @ensdomains/ui/src/web3.js
      // return getAccounts()
      const account = await web3Instance.getSigner().getAddress()
      console.warn('Resolvers::accounts', account)
      return [account]
    },
    networkId: async () => {
      const networkId = await getNetworkId()
      return networkId
    },
    network: async () => {
      const networkId = await getNetworkId()

      switch (networkId) {
        case 1:
          return 'main'
        case 2:
          return 'morden'
        case 3:
          return 'ropsten'
        case 4:
          return 'rinkeby'
        case 5:
          return 'goerli'
        case 42:
          return 'kovan'
        default:
          return 'private'
      }
    }
  },
  Query: {
    web3: async () => {
      console.warn('Resolvers::web3')
      const web3Instance = await getWeb3()
      try {
        return {
          ...web3Instance,
          web3Instance,
          isReadOnly: isReadOnly(),
          __typename: 'Web3'
        }
      } catch (e) {
        console.error(e)
        return null
      }
    },
    publicResolver: async () => {
      try {
        const resolver = await getAddress('resolver.eth')
        return {
          address: resolver,
          __typename: 'Resolver'
        }
      } catch (e) {
        console.log('error getting public resolver', e)
      }
    }
  },

  Mutation: {
    setError: async (_, { message }, { cache }) => {
      const errorObj = {
        message,
        __typename: 'Error'
      }
      const data = {
        error: errorObj
      }
      cache.writeData({ data })
      return errorObj
    }
  }
}

const defaults = merge(
  rootDefaults,
  fifsDefaults,
  managerDefaults,
  auctionRegistrarDefaults,
  subDomainRegistrarDefaults
)

export default merge(
  resolvers,
  fifsResolvers,
  managerResolvers,
  auctionRegistrarResolvers,
  subDomainRegistrarResolvers
)

export { defaults }
