require('dotenv').config()

import fs from 'node:fs'
import { getLogger, type LogTypeLiteral, type SerMessageEventWithDecoded } from '@phala/sdk'

function prettyPrint(record: SerMessageEventWithDecoded) {
  const { decoded } = record as SerMessageEventWithDecoded
  if (!decoded) {
    return
  }
  console.log('')
  console.log(`[#${record.blockNumber}] ${decoded.event.identifier}`)
  for (let idx = 0; idx < decoded.args.length; idx++) {
    const value = decoded.args[idx]
    const arg = decoded.event.args[idx]
    console.log(`> ${arg.name} :: ${arg.type.type} :: ${value.toHuman()}`)
  }
}

async function main() {
  const argv = require('arg')({
    '--ws': String,
    '-f': Boolean,
  })

  if (!argv['_'].length) {
    console.log('Usage: npx tsx capture-events.ts <contract address>')
    process.exit(1)
  }

  if (!fs.existsSync('./target/ink/erc20.json')) {
    console.log('Please build the contract first: cargo contract build --release')
    process.exit(1)
  }

  const ws = argv['--ws'] || process.env.WS || 'wss://poc6.phala.network/ws'
  const logger = await getLogger({ transport: ws })
  const abi = fs.readFileSync('./target/ink/erc20.json', 'utf8')

  console.log(`Connected: ${ws}`)

  const query = {
    contract: argv['_'][0],
    abi,
    type: ['Event'] as LogTypeLiteral[],
  }

  const known: number[] = []
  while (true) {
    const { records } = await logger.tail(10000, query)
    for (const record of records) {
      let rec = record as SerMessageEventWithDecoded
      if (known.indexOf(rec.blockNumber) !== -1) {
        continue
      }
      prettyPrint(rec)
      known.push(rec.blockNumber)
    }

    //
    // if the `-f` flag exists, means we are in the follow mode and keep polling.
    //
    if (!argv['-f']) {
      break
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
})
