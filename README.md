# Playground for use of Anchor and Solana program
## Requirements
+ Rust, Nodejs must be installed
+ Solana-cli, anchor-cli must be installed

## Configuration
1. use solana devnet
```bash
solana config set --url https://api.devnet.solana.com
```

2. request an airdrop
```bash
solana airdrop 2
```

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
yarn run v1.22.22
...
3D7oHtDZFnq34no45BK5qT961ntRHZUszRGLAq48Q3z5PJCpa9uXUkS1d5rNLnZLXMpnGVqVcr8pN9Nmv9zZRJpa
65LJiSf45tMw9ahTBv3T9ZWxwgGAkzbvHeHkMJjxCu1eWnYfaws1ENULiJxqiUziY1Qr7xnRoMDwanQFWVCr6wrb
DONE
✨  Done in 4.89s.
```