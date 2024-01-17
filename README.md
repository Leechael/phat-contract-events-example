# Phat Contract Events

This is an ERC20 implementation from [ink-examples](https://github.com/paritytech/ink-examples/blob/main/erc20/lib.rs) that can be deployed on the Phala Network.

Try out the PoC6 Testnet: [Deploy Now](https://phat.phala.network/contracts/add/0xcaa949f901d70b9f5ea8114dbfb08e88f56b1a5a1ad9f7439894278d21622d18)


## Steps

To deploy your own copy of this Phat Contract on PoC6, clone the repository and run:

```shell
cargo contract build --release
```

NOTE: It requires Rust 1.73.0 and cargo-contract 3.2.

After uploading and obtaining the contract ID, you can use `capture-events.ts` to fetch the latest events.

```shell
# You need to install dependencies first by running `npm install`.
npx tsx capture-events.ts [contract_id]
```

You will see a follow-up text on the screen:

```shell
[#9087] Transfer
> from :: Option<AccountId> :: null
> to :: Option<AccountId> :: 5Deb839k2mfm44zrwP8sRLCwwHAfBEboMWCKPSaTkYbfi2FE
> value :: Balance :: 10.0000 µUnit

[#9142] Transfer
> from :: Option<AccountId> :: 5Deb839k2mfm44zrwP8sRLCwwHAfBEboMWCKPSaTkYbfi2FE
> to :: Option<AccountId> :: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
> value :: Balance :: 10.0000 pUnit
```

You can add the `-f` flag to continuously poll and receive real-time updates.

```shell
npx tsx capture-events.ts [contract_id] -f
```

The `Transfer` event will be emitted when you call the `transfer` transaction.


## References

To learn more about Ink! contract events, checkout the documentation: [Events | Ink! documentation](https://use.ink/basics/events).

To learn more about the support for Phat Contract SDK Event logs, please checkout the release note here: [JSSDK 0.5.7: Event Log supports & enhanced contract transaction tracking](https://phala.network/posts/jssdk-057-event-log-supports-enhanced-contract-transaction-tracking).
