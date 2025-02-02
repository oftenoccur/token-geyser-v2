import { BigNumber, Contract, constants } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { toChecksumAddress } from 'web3-utils'
import { StakingToken, MIN_IN_MS } from '../constants'
import { ERC20Balance } from '../sdk'
import { SignerOrProvider, StakingTokenInfo, TokenComposition } from '../types'
import { BALANCER_BPOOL_V1_ABI } from './abis/BalancerBPoolV1'
import { BALANCER_CRP_V1_ABI } from './abis/BalancerCRPV1'
import { BALANCER_WEIGHTED_POOL_V2_ABI } from './abis/BalancerWeightedPoolV2'
import { BALANCER_VAULT_V2_ABI } from './abis/BalancerVaultV2'
import { MOONISWAP_V1_PAIR_ABI } from './abis/MooniswapV1Pair'
import { UNISWAP_V2_PAIR_ABI } from './abis/UniswapV2Pair'
import { WRAPPED_ERC20_ABI } from './abis/WrappedERC20'
import { AAVEV2_DEPOSIT_TOKEN } from './abis/AaveV2DepositToken'
import { ARRAKIS_V1_ABI } from './abis/ArrakisV1'
import { CHARM_V1_ABI } from './abis/CharmV1'
import { UNISWAP_V3_POOL_ABI } from './abis/UniswapV3Pool'
import { BILL_BROKER_ABI } from './abis/BillBroker'
import { STAMPL_ABI } from './abis/Stampl'
import { SPOT_APPRAISER_ABI } from './abis/SpotAppraiser'
import { getCurrentPrice } from './price'
import { defaultTokenInfo, getTokenInfo } from './token'
import * as ls from './cache'

const cacheTimeMs = 30 * MIN_IN_MS

export const defaultStakingTokenInfo = (): StakingTokenInfo => ({
  ...defaultTokenInfo(),
  price: 0,
  composition: [],
  wrappedToken: null,
})

export const getStakingTokenInfo = async (
  tokenAddress: string,
  token: StakingToken,
  signerOrProvider: SignerOrProvider,
): Promise<StakingTokenInfo> =>
  ls.computeAndCache<StakingTokenInfo>(
    async () => {
      switch (token) {
        case StakingToken.MOCK:
          return getMockLPToken(tokenAddress)
        case StakingToken.WAMPL:
          return getBasicToken(tokenAddress, signerOrProvider)
        case StakingToken.UNISWAP_V2:
          return getUniswapV2(tokenAddress, signerOrProvider)
        case StakingToken.SUSHISWAP:
          return getSushiswap(tokenAddress, signerOrProvider)
        case StakingToken.TRADER_JOE:
          return getTraderJoe(tokenAddress, signerOrProvider)
        case StakingToken.PANGOLIN:
          return getPangolin(tokenAddress, signerOrProvider)
        case StakingToken.MOONISWAP_V1:
          return getMooniswap(tokenAddress, signerOrProvider)
        case StakingToken.BALANCER_V1:
          return getBalancerV1(tokenAddress, signerOrProvider)
        case StakingToken.BALANCER_SMART_POOL_V1:
          return getBalancerSmartPoolV1(tokenAddress, signerOrProvider)
        case StakingToken.AAVE_V2_AMPL:
          return getAaveV2(tokenAddress, signerOrProvider)
        case StakingToken.BALANCER_WEIGHTED_POOL_V2:
          return getBalancerWeightedPoolV2(tokenAddress, signerOrProvider)
        case StakingToken.ARRAKIS_V1:
          return getArrakisV1(tokenAddress, signerOrProvider)
        case StakingToken.CHARM_V1:
          return getCharmV1(tokenAddress, signerOrProvider)
        case StakingToken.BILL_BROKER:
          return getBillBroker(tokenAddress, signerOrProvider)
        case StakingToken.STAMPL:
          return getSTAMPL(tokenAddress, signerOrProvider)
        default:
          throw new Error(`Handler for ${token} not found`)
      }
    },
    `stakingTokenInfo:${tokenAddress}`,
    cacheTimeMs,
  )

const getTokenCompositions = async (
  tokenAddresses: string[],
  poolAddress: string,
  signerOrProvider: SignerOrProvider,
  weights: number[],
): Promise<TokenComposition[]> => {
  const compositions = tokenAddresses.map(async (tokenAddress, index) => {
    const { name, symbol, decimals } = await getTokenInfo(tokenAddress, signerOrProvider)
    const price = await getCurrentPrice(symbol)
    const balance = await ERC20Balance(tokenAddress, poolAddress, signerOrProvider)
    const balanceNumber = parseFloat(formatUnits(balance as BigNumber, decimals))
    return {
      address: tokenAddress,
      name,
      symbol,
      balance: balanceNumber,
      decimals,
      value: price * balanceNumber,
      weight: weights[index],
    }
  })
  return Promise.all(compositions)
}

const getTokenCompositionsWithBalances = async (
  tokenAddresses: string[],
  balances: string[],
  signerOrProvider: SignerOrProvider,
  weights: number[],
): Promise<TokenComposition[]> => {
  const compositions = tokenAddresses.map(async (tokenAddress, index) => {
    const { name, symbol, decimals } = await getTokenInfo(tokenAddress, signerOrProvider)
    const price = await getCurrentPrice(symbol)
    const balanceNumber = parseFloat(formatUnits(BigNumber.from(balances[index]), decimals))
    return {
      address: tokenAddress,
      name,
      symbol,
      balance: balanceNumber,
      decimals,
      value: price * balanceNumber,
      weight: weights[index],
    }
  })
  return Promise.all(compositions)
}

const getMarketCap = (composition: TokenComposition[]) => composition.reduce((m, c) => m + c.value, 0)

const uniswapV2Pair = async (
  tokenAddress: string,
  signerOrProvider: SignerOrProvider,
  namePrefix: string,
  symbolPrefix: string,
): Promise<StakingTokenInfo> => {
  const address = toChecksumAddress(tokenAddress)
  const contract = new Contract(address, UNISWAP_V2_PAIR_ABI, signerOrProvider)
  const token0Address: string = await contract.token0()
  const token1Address: string = await contract.token1()
  const decimals: number = await contract.decimals()

  const totalSupply: BigNumber = await contract.totalSupply()
  const totalSupplyNumber = parseFloat(formatUnits(totalSupply, decimals))

  const tokenCompositions = await getTokenCompositions(
    [token0Address, token1Address],
    address,
    signerOrProvider,
    [0.5, 0.5],
  )
  const [token0Symbol, token1Symbol] = tokenCompositions.map((c) => c.symbol)
  const marketCap = getMarketCap(tokenCompositions)

  return {
    address: toChecksumAddress(tokenAddress),
    name: `${namePrefix}-${token0Symbol}-${token1Symbol} Liquidity Token`,
    symbol: `${symbolPrefix}-${token0Symbol}-${token1Symbol}-V2`,
    decimals,
    price: marketCap / totalSupplyNumber,
    composition: tokenCompositions,
    wrappedToken: null,
  }
}

const getUniswapV2 = async (tokenAddress: string, signerOrProvider: SignerOrProvider) =>
  uniswapV2Pair(tokenAddress, signerOrProvider, 'UniswapV2', 'UNI')

const getSushiswap = async (tokenAddress: string, signerOrProvider: SignerOrProvider) =>
  uniswapV2Pair(tokenAddress, signerOrProvider, 'Sushiswap', 'SUSHI')

const getTraderJoe = async (tokenAddress: string, signerOrProvider: SignerOrProvider) =>
  uniswapV2Pair(tokenAddress, signerOrProvider, 'TraderJoe', 'JOE')

const getPangolin = async (tokenAddress: string, signerOrProvider: SignerOrProvider) =>
  uniswapV2Pair(tokenAddress, signerOrProvider, 'Pangolin', 'PNG')

const getMooniswap = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<StakingTokenInfo> => {
  const address = toChecksumAddress(tokenAddress)
  const contract = new Contract(address, MOONISWAP_V1_PAIR_ABI, signerOrProvider)
  const tokens: [string, string] = await contract.getTokens()
  const [token0Address, token1Address] = tokens
  const { name, symbol, decimals } = await getTokenInfo(address, signerOrProvider)
  const totalSupply: BigNumber = await contract.totalSupply()

  const totalSupplyNumber = parseFloat(formatUnits(totalSupply, decimals))

  const tokenCompositions = await getTokenCompositions(
    [token0Address, token1Address],
    address,
    signerOrProvider,
    [0.5, 0.5],
  )
  const marketCap = getMarketCap(tokenCompositions)

  return {
    address,
    name,
    symbol,
    decimals,
    price: marketCap / totalSupplyNumber,
    composition: tokenCompositions,
    wrappedToken: null,
  }
}

const getBalancerTokenCompositions = async (
  address: string,
  signerOrProvider: SignerOrProvider,
): Promise<TokenComposition[]> => {
  const contract = new Contract(address, BALANCER_BPOOL_V1_ABI, signerOrProvider)
  const tokenAddresses: string[] = await contract.getCurrentTokens()
  const totalDenormalizedWeight: number = await contract.getTotalDenormalizedWeight()
  const tokenDenormalizedWeights: number[] = await Promise.all(
    tokenAddresses.map((token) => contract.getDenormalizedWeight(token)),
  )
  const tokenWeights = tokenDenormalizedWeights.map((w) => w / totalDenormalizedWeight)

  return getTokenCompositions(tokenAddresses, contract.address, signerOrProvider, tokenWeights)
}

const getBalancerV2TokenCompositions = async (
  address: string,
  signerOrProvider: SignerOrProvider,
): Promise<TokenComposition[]> => {
  const contract = new Contract(address, BALANCER_WEIGHTED_POOL_V2_ABI, signerOrProvider)
  const vault = new Contract(await contract.getVault(), BALANCER_VAULT_V2_ABI, signerOrProvider)

  const r = await vault.getPoolTokens(await contract.getPoolId())
  const tokenAddresses: string[] = r[0]
  const tokenBalances: string[] = r[1]

  const totalNormalizedWeight: BigNumber = BigNumber.from(constants.WeiPerEther)
  const tokenNormalizedWeights: BigNumber[] = await contract.getNormalizedWeights()
  const tokenWeights = tokenNormalizedWeights.map((w) => w.div(totalNormalizedWeight).toNumber())

  return getTokenCompositionsWithBalances(tokenAddresses, tokenBalances, signerOrProvider, tokenWeights)
}

const getBalancerV1 = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<StakingTokenInfo> => {
  const address = toChecksumAddress(tokenAddress)
  const contract = new Contract(address, BALANCER_BPOOL_V1_ABI, signerOrProvider)

  const { name, symbol, decimals } = await getTokenInfo(address, signerOrProvider)

  const totalSupply: BigNumber = await contract.totalSupply()
  const totalSupplyNumber = parseFloat(formatUnits(totalSupply, decimals))

  const tokenCompositions = await getBalancerTokenCompositions(address, signerOrProvider)
  const marketCap = getMarketCap(tokenCompositions)

  return {
    address,
    decimals,
    name,
    symbol,
    price: marketCap / totalSupplyNumber,
    composition: tokenCompositions,
    wrappedToken: null,
  }
}

const getBalancerSmartPoolV1 = async (
  tokenAddress: string,
  signerOrProvider: SignerOrProvider,
): Promise<StakingTokenInfo> => {
  const address = toChecksumAddress(tokenAddress)
  const contract = new Contract(address, BALANCER_CRP_V1_ABI, signerOrProvider)

  const bPool: string = await contract.bPool()
  const { name, symbol, decimals } = await getTokenInfo(address, signerOrProvider)

  const totalSupply: BigNumber = await contract.totalSupply()
  const totalSupplyNumber = parseFloat(formatUnits(totalSupply, decimals))

  const tokenCompositions = await getBalancerTokenCompositions(bPool, signerOrProvider)
  const marketCap = getMarketCap(tokenCompositions)

  return {
    address,
    decimals,
    name,
    symbol,
    // totalSupply: totalSupplyNumber,
    // marketCap,
    price: marketCap / totalSupplyNumber,
    composition: tokenCompositions,
    wrappedToken: null,
  }
}

const getMockLPToken = async (tokenAddress: string): Promise<StakingTokenInfo> => {
  const price = ((await getCurrentPrice('AMPL')) + (await getCurrentPrice('BAL'))) / 2
  return {
    address: toChecksumAddress(tokenAddress),
    name: `MOCK-AMPL-BAL Liquidity Token`,
    symbol: `MOCK-AMPL-BAL`,
    decimals: 18,
    price,
    composition: [],
    wrappedToken: null,
  }
}

const getAaveV2 = async (
  wrapperTokenAddress: string,
  signerOrProvider: SignerOrProvider,
): Promise<StakingTokenInfo> => {
  const wrapperAddress = toChecksumAddress(wrapperTokenAddress)
  const wrapperContract = new Contract(wrapperAddress, WRAPPED_ERC20_ABI, signerOrProvider)

  // aAMPL
  const wrappedAddress = await wrapperContract.underlying()
  const wrappedContract = new Contract(wrappedAddress, AAVEV2_DEPOSIT_TOKEN, signerOrProvider)

  // AMPL
  const baseAssetAddress = await wrappedContract.UNDERLYING_ASSET_ADDRESS()

  // infos
  const wrapperInfo = await getTokenInfo(wrapperAddress, signerOrProvider)
  const wrappedInfo = await getTokenInfo(wrappedAddress, signerOrProvider)
  const baseAssetInfo = await getTokenInfo(baseAssetAddress, signerOrProvider)

  // aAMPL held by the wrapper contract
  const totalUnderlying = await wrapperContract.totalUnderlying()
  const totalUnderlyingNumber = parseFloat(formatUnits(totalUnderlying, wrappedInfo.decimals))

  // aAMPL composition
  const baseAssetPrice = await getCurrentPrice(baseAssetInfo.symbol)
  const tokenCompositions = [
    {
      address: baseAssetInfo.address,
      name: baseAssetInfo.name,
      symbol: baseAssetInfo.symbol,
      decimals: baseAssetInfo.decimals,
      balance: totalUnderlyingNumber,
      price: baseAssetPrice,
      value: baseAssetPrice * totalUnderlyingNumber,
      weight: 1.0,
    },
  ]

  const wrapperTotalSupply: BigNumber = await wrapperContract.totalSupply()
  const wrapperTotalSupplyNumber = parseFloat(formatUnits(wrapperTotalSupply, wrapperInfo.decimals))
  const wrapperMarketCap = totalUnderlyingNumber * baseAssetPrice
  return {
    address: wrapperInfo.address,
    decimals: wrapperInfo.decimals,
    name: wrapperInfo.name,
    symbol: wrapperInfo.symbol,
    price: wrapperMarketCap / wrapperTotalSupplyNumber,
    composition: tokenCompositions,
    wrappedToken: {
      address: wrappedInfo.address,
      decimals: wrappedInfo.decimals,
      name: wrappedInfo.name,
      symbol: wrappedInfo.symbol,
      price: baseAssetPrice,
    },
  }
}

const getBasicToken = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<StakingTokenInfo> => {
  const address = toChecksumAddress(tokenAddress)
  const tokenInfo = await getTokenInfo(address, signerOrProvider)
  const price = await getCurrentPrice(tokenInfo.symbol)
  return {
    ...tokenInfo,
    price,
    composition: [],
    wrappedToken: null,
  }
}

const getBalancerWeightedPoolV2 = async (
  tokenAddress: string,
  signerOrProvider: SignerOrProvider,
): Promise<StakingTokenInfo> => {
  const address = toChecksumAddress(tokenAddress)
  const contract = new Contract(address, BALANCER_WEIGHTED_POOL_V2_ABI, signerOrProvider)

  const { name, symbol, decimals } = await getTokenInfo(address, signerOrProvider)

  const totalSupply: BigNumber = await contract.totalSupply()
  const totalSupplyNumber = parseFloat(formatUnits(totalSupply, decimals))

  const tokenCompositions = await getBalancerV2TokenCompositions(address, signerOrProvider)
  const marketCap = getMarketCap(tokenCompositions)

  return {
    address,
    decimals,
    name,
    symbol,
    price: marketCap / totalSupplyNumber,
    composition: tokenCompositions,
    wrappedToken: null,
  }
}

const getArrakisV1 = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<StakingTokenInfo> => {
  const address = toChecksumAddress(tokenAddress)
  const contract = new Contract(address, ARRAKIS_V1_ABI, signerOrProvider)
  const uniPool = new Contract(await contract.pool(), UNISWAP_V3_POOL_ABI, signerOrProvider)

  const { name, symbol, decimals } = await getTokenInfo(address, signerOrProvider)
  const totalSupply: BigNumber = await contract.totalSupply()
  const totalSupplyNumber = parseFloat(formatUnits(totalSupply, decimals))

  const tokenCompositions = await getTokenCompositionsWithBalances(
    [await uniPool.token0(), await uniPool.token1()],
    await contract.getUnderlyingBalances(),
    signerOrProvider,
    [0.5, 0.5],
  )
  const marketCap = getMarketCap(tokenCompositions)

  return {
    address,
    decimals,
    name,
    symbol,
    price: marketCap / totalSupplyNumber,
    composition: tokenCompositions,
    wrappedToken: null,
  }
}

const getCharmV1 = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<StakingTokenInfo> => {
  const address = toChecksumAddress(tokenAddress)
  const contract = new Contract(address, CHARM_V1_ABI, signerOrProvider)

  const { name, symbol, decimals } = await getTokenInfo(address, signerOrProvider)
  const poolBals = await contract.getTotalAmounts()
  const totalSupply: BigNumber = await contract.totalSupply()
  const totalSupplyNumber = parseFloat(formatUnits(totalSupply, decimals))

  const tokenCompositions = await getTokenCompositionsWithBalances(
    [await contract.token0(), await contract.token1()],
    poolBals,
    signerOrProvider,
    [0.5, 0.5],
  )
  const marketCap = getMarketCap(tokenCompositions)

  return {
    address,
    decimals,
    name,
    symbol,
    price: marketCap / totalSupplyNumber,
    composition: tokenCompositions,
    wrappedToken: null,
  }
}

const getBillBroker = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<StakingTokenInfo> => {
  const address = toChecksumAddress(tokenAddress)
  const contract = new Contract(address, BILL_BROKER_ABI, signerOrProvider)
  const appraiserContract = new Contract(await contract.pricingStrategy(), SPOT_APPRAISER_ABI, signerOrProvider)

  const { name, symbol, decimals } = await getTokenInfo(address, signerOrProvider)

  const usd = await contract.usd()
  const usdTokenInfo = await getTokenInfo(usd, signerOrProvider)
  const usdBalanceFixedPt = await ERC20Balance(usd, address, signerOrProvider)
  const usdBalance = parseFloat(formatUnits(usdBalanceFixedPt as BigNumber, usdTokenInfo.decimals))

  const perp = await contract.perp()
  const perpTokenInfo = await getTokenInfo(perp, signerOrProvider)
  const perpBalanceFixedPt = await ERC20Balance(perp, address, signerOrProvider)
  const perpBalance = parseFloat(formatUnits(perpBalanceFixedPt as BigNumber, perpTokenInfo.decimals))

  const perpPriceDt = await appraiserContract.callStatic.perpPrice()
  const usdPriceDt = await appraiserContract.callStatic.usdPrice()

  const perpVal = perpBalance * parseFloat(formatUnits(perpPriceDt[0], 18))
  const usdVal = usdBalance * parseFloat(formatUnits(usdPriceDt[0], 18))
  const totalVal = perpVal + usdVal

  const totalSupply: BigNumber = await contract.totalSupply()
  const totalSupplyNumber = parseFloat(formatUnits(totalSupply, decimals))

  const tokenCompositions = await getTokenCompositionsWithBalances(
    [await contract.usd(), await contract.perp()],
    [usdBalanceFixedPt, perpBalanceFixedPt],
    signerOrProvider,
    [usdBalance / totalVal, perpBalance / totalVal],
  )
  const marketCap = getMarketCap(tokenCompositions)

  return {
    address,
    decimals,
    name,
    symbol,
    price: marketCap / totalSupplyNumber,
    composition: tokenCompositions,
    wrappedToken: null,
  }
}

const getSTAMPL = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<StakingTokenInfo> => {
  const address = toChecksumAddress(tokenAddress)
  const { name, symbol, decimals } = await getTokenInfo(address, signerOrProvider)

  const contract = new Contract(address, STAMPL_ABI, signerOrProvider)
  const ampl = await contract.underlying()
  const amplTokenInfo = await getTokenInfo(ampl, signerOrProvider)
  const amplPrice = await getCurrentPrice(amplTokenInfo.symbol)

  const tvl = parseFloat(formatUnits(await contract.callStatic.getTVL(), amplTokenInfo.decimals))
  const totalSupply = parseFloat(formatUnits(await contract.totalSupply(), decimals))
  const tokenCompositions = [
    {
      address: ampl.address,
      ...amplTokenInfo,
      balance: tvl,
      value: amplPrice * tvl,
      weight: 1.0,
    },
  ]
  const marketCap = tokenCompositions[0].value
  return {
    address,
    decimals,
    name,
    symbol,
    price: marketCap / totalSupply,
    composition: tokenCompositions,
    wrappedToken: null,
  }
}
