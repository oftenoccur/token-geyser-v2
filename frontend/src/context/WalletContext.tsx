import { BigNumber } from 'ethers'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { ERC20Balance } from '../sdk'
import { GeyserContext } from './GeyserContext'
import Web3Context from './Web3Context'
import {TokenInfo} from '../types'

export const WalletContext = createContext<{
  stakingTokenBalance: BigNumber
  underlyingTokenBalance: BigNumber
  refreshWalletBalances: () => void
}>({
  stakingTokenBalance: BigNumber.from('0'),
  underlyingTokenBalance: BigNumber.from('0'),
  refreshWalletBalances: () => {},
})

export const WalletContextProvider: React.FC = ({ children }) => {
  const [stakingTokenBalance, setStakingTokenBalance] = useState<BigNumber>(BigNumber.from('0'))
  const [underlyingTokenBalance, setWrappedTokenBalance] = useState<BigNumber>(BigNumber.from('0'))

  const { signer } = useContext(Web3Context)
  const { selectedGeyserInfo: { stakingTokenInfo, isWrappedStakingToken } } = useContext(GeyserContext)
  const underlyingStakingTokenInfo = stakingTokenInfo.wrappedToken as TokenInfo

  const getStakingTokenBalance = useCallback(async () => {
    if (stakingTokenInfo && stakingTokenInfo.address && signer) {
      try {
        const balance = await ERC20Balance(stakingTokenInfo.address, await signer.getAddress(), signer)
        return balance
      } catch (e) {
        console.error(e)
        return BigNumber.from('0')
      }
    }
    return BigNumber.from('0')
  }, [stakingTokenInfo?.address, signer])

  const getWrappedTokenBalance = useCallback(async () => {
    if (isWrappedStakingToken && underlyingStakingTokenInfo && underlyingStakingTokenInfo.address && signer) {
      try {
        const balance = await ERC20Balance(underlyingStakingTokenInfo.address, await signer.getAddress(), signer)
        return balance
      } catch (e) {
        console.error(e)
        return BigNumber.from('0')
      }
    }
    return BigNumber.from('0')
  }, [underlyingStakingTokenInfo?.address, signer])

  const refreshWalletBalances = async () => {
    setStakingTokenBalance(await getStakingTokenBalance())
    setWrappedTokenBalance(await getWrappedTokenBalance())
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) {
        await refreshWalletBalances()
      }
    })();
    return () => {
      mounted = false
    }
  }, [getStakingTokenBalance, getWrappedTokenBalance])

  return <WalletContext.Provider value={{ stakingTokenBalance, underlyingTokenBalance, refreshWalletBalances }}>{children}</WalletContext.Provider>
}
