import { Network, RewardToken, StakingToken, ALCHEMY_PROJECT_ID } from '../constants'
import {
  AppGeysersList,
  NetworkConfig,
  GeyserConfig,
  ConnectionConfig,
  AdditionalTokenConfig,
  AppAdditionalTokensList,
} from '../types'

const networkConfig: NetworkConfig = {
  [Network.Mainnet]: {
    id: Network.Mainnet,
    networkId: 1,
    chainId: 1,
    ref: 'mainnet',
    name: 'Ethereum',
    rpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_PROJECT_ID}`,
    graphUrl: 'https://api.thegraph.com/subgraphs/name/aalavandhan/amplgeyserv2beta',
    explorerUrl: 'https://etherscan.io/tx',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  [Network.Avalanche]: {
    id: Network.Avalanche,
    networkId: 43114,
    chainId: 43114,
    ref: 'avalanche',
    name: 'AVAX C-Chain',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    graphUrl: 'https://api.thegraph.com/subgraphs/name/aalavandhan/geyserv2-avalanche',
    explorerUrl: 'https://snowtrace.io/tx',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
  },
  [Network.Kovan]: {
    id: Network.Kovan,
    networkId: 42,
    chainId: 42,
    ref: 'kovan',
    name: 'Kovan',
    rpcUrl: `https://eth-kovan.alchemyapi.io/v2/${ALCHEMY_PROJECT_ID}`,
    graphUrl: 'https://api.thegraph.com/subgraphs/name/aalavandhan/geyserv2-kovan',
    explorerUrl: 'https://kovan.etherscan.io/tx',
    nativeCurrency: {
      name: 'KovanEthereum',
      symbol: 'KETH',
      decimals: 18,
    },
  },
}

const geyserList: AppGeysersList = {
  [Network.Mainnet]: [
    {
      name: 'ETH Beehive V7 (UniswapV2 ETH-AMPL)',
      address: '0x5Ec6f02D0b657E4a56d6020Bc21F19f2Ca13EcA9',
      stakingToken: StakingToken.UNISWAP_V2,
      rewardToken: RewardToken.FORTH,
      isWrapped: false,
      poolAddress: 'https://app.uniswap.org/#/add/v2/0xD46bA6D942050d489DBd938a2C909A5d5039A161/ETH',
      // staked pool address: 0xc5be99A02C6857f9Eac67BbCE58DF5572498F40c
    },

    {
      name: 'ETH Fly V2 (ArrakisV1 USDC/SPOT)',
      address: '0x392b58F407Efe1681a2EBB470600Bc2146D231a2',
      stakingToken: StakingToken.ARRAKIS_V1,
      rewardToken: RewardToken.FORTH,
      isWrapped: false,
      poolAddress: 'https://beta.arrakis.finance/vaults/1/0xDF367477C5E596af88E8797c3CDe8E28854cb79c',
      // staked pool address: 0x7E0C73AF898E1ad50a8eFd7D3A678C23cD90b74C
    },

    {
      name: 'ETH Beehive V6 (UniswapV2 ETH-AMPL)',
      address: '0xfa3A1B55f77D0cEd6706283c16296F8317c70e52',
      stakingToken: StakingToken.UNISWAP_V2,
      rewardToken: RewardToken.SPOT,
      isWrapped: false,
      poolAddress: 'https://app.uniswap.org/#/add/v2/0xD46bA6D942050d489DBd938a2C909A5d5039A161/ETH',
      // staked pool address: 0xc5be99A02C6857f9Eac67BbCE58DF5572498F40c
    },

    {
      name: 'ETH Fly V1 (ArrakisV1 USDC/SPOT)',
      address: '0xAA17f42C2F28ba8eF1De171C5E8e4EBd3cd5F2Ec',
      stakingToken: StakingToken.ARRAKIS_V1,
      rewardToken: RewardToken.SPOT,
      isWrapped: false,
      poolAddress: 'https://beta.arrakis.finance/vaults/1/0xDF367477C5E596af88E8797c3CDe8E28854cb79c',
      // staked pool address: 0x7E0C73AF898E1ad50a8eFd7D3A678C23cD90b74C
    },

    {
      name: 'ETH Beehive V5 (UniswapV2 ETH-AMPL)',
      address: '0x5Bc95edc2a05247235dd5D6d1773B8cCB95D083B',
      stakingToken: StakingToken.UNISWAP_V2,
      rewardToken: RewardToken.AMPL,
      isWrapped: false,
      poolAddress: 'https://app.uniswap.org/#/add/v2/0xD46bA6D942050d489DBd938a2C909A5d5039A161/ETH',
      // staked pool address: 0xc5be99A02C6857f9Eac67BbCE58DF5572498F40c
    },
    {
      name: 'ETH Trinity V3 (BalancerV2 WBTC-WETH-WAMPL)',
      address: '0x13ED22A00576E41B64B686857B484987a3Ad1A3B',
      stakingToken: StakingToken.BALANCER_WEIGHTED_POOL_V2,
      rewardToken: RewardToken.AMPL,
      isWrapped: false,
      poolAddress: 'https://app.balancer.fi/#/pool/0xd4e2af4507b6b89333441c0c398edffb40f86f4d0001000000000000000002ab',
      // staked pool address: 0xd4E2af4507B6B89333441C0c398edfFB40f86f4D
      // poolID:0xd4e2af4507b6b89333441c0c398edffb40f86f4d0001000000000000000002ab
      // vault: 0xba12222222228d8ba445958a75a0704d566bf2c8
    },
    {
      name: 'ETH Splendid Pilot (AAVEV2 aAMPL)',
      address: '0x1Fee4745E70509fBDc718beDf5050F471298c1CE',
      stakingToken: StakingToken.AAVE_V2_AMPL,
      rewardToken: RewardToken.AMPL,
      isWrapped: true,
      poolAddress:
        'https://app.aave.com/reserve-overview/?underlyingAsset=0xd46ba6d942050d489dbd938a2c909a5d5039a161&marketName=proto_mainnet',
      // staked pool address: 0x1e6bb68acec8fefbd87d192be09bb274170a0548
    },
    {
      name: 'ETH Beehive V4 (UniswapV2 ETH-AMPL)',
      address: '0x88F12aE68315A89B885A2f1b0610fE2A9E1720B9',
      stakingToken: StakingToken.UNISWAP_V2,
      rewardToken: RewardToken.AMPL,
      isWrapped: false,
      // staked pool address: 0xc5be99A02C6857f9Eac67BbCE58DF5572498F40c
    },
    {
      name: 'ETH Trinity V2 (BalancerV1 BTC-ETH-AMPL)',
      address: '0x0ec93391752ef1A06AA2b83D15c3a5814651C891',
      stakingToken: StakingToken.BALANCER_V1,
      rewardToken: RewardToken.AMPL,
      isWrapped: false,
      // staked pool address: 0xa751A143f8fe0a108800Bfb915585E4255C2FE80
    },
    {
      name: 'ETH Old Faithful V2 (BalancerV1 AMPL-USDC)',
      address: '0x914A766578C2397da969b3ca088e3e757249A435',
      stakingToken: StakingToken.BALANCER_SMART_POOL_V1,
      rewardToken: RewardToken.AMPL,
      isWrapped: false,
      // staked pool address: 0x49F2befF98cE62999792Ec98D0eE4Ad790E7786F
    },
    {
      name: 'ETH Pescadero V2 (Sushiswap ETH-AMPL)',
      address: '0x56eD0272f99eBD903043399A51794f966D72E526',
      stakingToken: StakingToken.SUSHISWAP,
      rewardToken: RewardToken.AMPL,
      isWrapped: false,
      // staked pool address: 0xCb2286d9471cc185281c4f763d34A962ED212962
    },
  ],
  [Network.Avalanche]: [
    {
      name: 'AVAX Crystal Geyser V1 (Pangolin AVAX-AMPL)',
      address: '0x26645e8513B1D20aDb729E7114eDfA930D411720',
      stakingToken: StakingToken.PANGOLIN,
      rewardToken: RewardToken.XCAMPLE,
      isWrapped: false,
      poolAddress: 'https://info.pangolin.exchange/#/pair/0xe36ae366692acbf696715b6bddce0938398dd991',
    },
  ],
  [Network.Kovan]: [
    {
      name: 'Kovan testnet geyser (WAMPL)',
      address: '0xc92b6032a39b996054d7e1825abb273ef335d8e2',
      stakingToken: StakingToken.WAMPL,
      rewardToken: RewardToken.AMPL,
      isWrapped: false,
    },
  ],
}

const additionalTokens: AppAdditionalTokensList = {
  [Network.Mainnet]: [
    {
      token: 'balancer',
      address: '0xba100000625a3754423978a60c9317c58a424e3d',
      enabled: true,
    },
    {
      token: 'sushi',
      address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
      enabled: true,
    },
    {
      token: 'aave',
      address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      enabled: true,
    },
  ],
  [Network.Kovan]: [],
  [Network.Avalanche]: [
    {
      token: 'pangolin',
      address: '0x60781c2586d68229fde47564546784ab3faca982',
      enabled: true,
    },
  ],
}

export const activeNetworks: Network[] = [Network.Mainnet, Network.Avalanche]

export function getConnectionConfig(networkId: number | null): ConnectionConfig {
  return networkConfig[networkId as Network] || networkConfig[Network.Mainnet]
}

export function getGeysersConfigList(networkId: number): GeyserConfig[] {
  return geyserList[networkId as Network] || geyserList[Network.Mainnet]
}

export function getAdditionalTokensList(networkId: number): AdditionalTokenConfig[] {
  return additionalTokens[networkId as Network] || additionalTokens[Network.Mainnet]
}
