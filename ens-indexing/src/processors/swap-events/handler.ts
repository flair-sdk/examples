import { EventHandlerInput } from 'flair-sdk'

import { fetchUsdPrice, upsertEvent } from '../../functions/common'
import { getOrCreatePool } from '../../functions/pool'

export const processEvent = async (event: EventHandlerInput) => {
  const poolAddress = event.log.address.toString()
  const pool = await getOrCreatePool(event.chainId, poolAddress)

  // getting usd value of below entities
  const [amount0InUsd, amount1InUsd, amount0OutUsd, amount1OutUsd] =
    await Promise.all([
      fetchUsdPrice({
        event,
        token: pool.token0Address,
        amount: event.parsed.args?.amount0In,
      }),
      fetchUsdPrice({
        event,
        token: pool.token1Address,
        amount: event.parsed.args?.amount1In,
      }),
      fetchUsdPrice({
        event,
        token: pool.token0Address,
        amount: event.parsed.args?.amount0Out,
      }),
      fetchUsdPrice({
        event,
        token: pool.token1Address,
        amount: event.parsed.args?.amount1Out,
      }),
    ])

  // https://docs.uniswap.org/contracts/v2/reference/API/entities
  const extraData = {
    amount0InUsd,
    amount1InUsd,
    amount0OutUsd,
    amount1OutUsd,
  }

  await upsertEvent(event, extraData)
}
