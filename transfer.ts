require('dotenv').config()

import fs from 'node:fs'
import { Keyring } from '@polkadot/api'
import { type Balance } from '@polkadot/types/interfaces'
import { getClient, getContract, signCertificate, type LogTypeLiteral, type SerMessageEventWithDecoded } from '@phala/sdk'

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
    '--ssuri': String,
    '--to': String,
    '--amount': Number,
  })

  if (!argv['_'].length) {
    console.log('Usage: npx tsx transfer.ts <contract address> --from <from> --to <to> --amount <amount>')
    process.exit(1)
  }

  if (!fs.existsSync('./target/ink/erc20.json')) {
    console.log('Please build the contract first: cargo contract build --release')
    process.exit(1)
  }

  const value = argv['--amount'] || 1

  const keyring = new Keyring({ type: 'sr25519' })
  const abi = fs.readFileSync('./target/ink/erc20.json', 'utf8')

  const ws = argv['--ws'] || process.env.WS || 'wss://poc6.phala.network/ws'
  const client = await getClient({ transport: ws })
  const contract = await getContract({
    client,
    contractId: argv['_'][0],
    abi,
  })
  const logger = client.loggerContract!
  const pair = keyring.addFromUri(argv['--ssuri'] || process.env.SSURI)

  console.log(`Connected: ${ws}`)

  const cert = await signCertificate({ pair })

  const { output: balanceInfo } = await contract.query.balanceOf<Balance>(cert.address, { cert }, cert.address)
  if (balanceInfo.isOk && balanceInfo.asOk.toNumber() < value) {
    console.log(`Insufficient balance for ${cert.address}: ${balanceInfo.asOk.toBigInt()}`)
    process.exit(1)
  }
  console.log(cert.address, balanceInfo.asOk.toBigInt())

  const clusterInfo = await client.phactory.getInfo({})
  const blockNumber = clusterInfo.blocknum

  const result = await contract.send.transfer(
    { cert, address: cert.address, pair },
    argv['--to'],
    value
  )
  await result.waitFinalized()

  const { records } = await logger.tail(10000, {
    contract: contract.address.toHex(),
    abi,
    type: ['Event'] as LogTypeLiteral[],
  })
  const matched = records.filter(i => (i as SerMessageEventWithDecoded).blockNumber >= blockNumber)
  console.assert(matched.length === 1, 'It should only one matched event.')
  for (const record of matched) {
    let rec = record as SerMessageEventWithDecoded
    prettyPrint(rec)
  }
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
})
