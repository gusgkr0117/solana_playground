# Playground for use of Anchor and Solana program
## Requirements
+ Rust, Nodejs must be installed
    + yarn installed(npm install --global yarn)
+ Solana-cli, anchor-cli must be installed

## How-to-use
1. build the program
```bash
anchor build
```

2. run local network
```bash
anchor test-local-validator
```

3. deploy the program
```bash
anchor deploy
```

4. run the client program
```bash
anchor run client
```

getting following output
```bash
playground git:(main) anchor run client
yarn run v1.22.22
...
32b9eDPHvvD4fDSgCmtr37Ex4JDuvYcpojzBWwpHSFbBU8hc5LrLGiPNpVc7RC4H3tuZAwE9qeuHKJRP9TX6GS89
DONE
✨  Done in 1.73s.
```