# Example: Sign-in and Show ERC721 NFTs

This example React app renders a connect button, allows the user to sign-in (to prove actual ownership of a wallet) and then shows a list of their NFTs.

##### Dependencies

- `flair-sdk`: latest
- `react`: v17.x or v18.x

## :fire: Quick Start

1. Clone the examples repo, install dependencies in the `sign-in-and-show-nfts` directory:

   ```sh
   git clone https://github.com/flair-sdk/examples

   cd examples/react/sign-in-and-show-nfts

   npm install
   ```

2. Grab your contract address and chain ID, and update [.env](./.env):
   - Set `REACT_APP_CONTRACT_ADDRESS` to your deployed contract address you get from Flair's dashboard > Collections > your-collection > Deploy tab.
   - Set `REACT_APP_CONTRACT_CHAIN_ID` depending on the contract chain. Use `1` for Eth mainnet, `5` for Goerli testnet, `137` for Polygon mainnet, etc.

3. Run the react app in the `sign-in-and-show-nfts` directory:

   ```sh
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

![Screenshot](./screenshot.png)

## 🔮 Tutorial

To use this example within your app:

1.  Install `@flair-sdk/react` in your React app:

    ```sh
    npm install @flair-sdk/react
    ```

2.  Configure FlairProvider around your root App:

    ```ts
    import { FlairProvider } from "@flair-sdk/react";

    // ...
    // For example make sure signed messages are expired in 24 hours:
    <FlairProvider signIn={{ expireIn: 24 * 60 * 60 * 1_000 }}>
      <App />
    </FlairProvider>;
    // ...
    ```

3.  _(optional)_ If you're using Webpack 5 (e.g. React v17+) you might to manually configure Buffer for Coinbase wallet to work:

    1. Install `npm install react-app-rewired buffer`
    2. Then create a [config-overrides.js](config-overrides.js) to inject the Buffer.

4.  Add `<ConnectButton>` and `<SignInButton>` components in your dApp.

    ```ts
    import {
      ConnectButton,
      IfWalletConnected,
      SignInButton,
      WalletDropdown,
    } from "@flair-sdk/react";

    const App = () => {
      return (
        <div>
          {/* Render a simple connect button: */}
          <ConnectButton />
          
          {/* If user is connected render a dropdown: */}
          <IfWalletConnected>
            <WalletDropdown />
          </IfWalletConnected>
          
          {/* If user is connected show a sign button: */}
          <IfWalletConnected>
            <SignInButton />
          </IfWalletConnected>

          {/* If user is signed-in show list of their NFTs: */}
          <IfWalletSignedIn>
            <MyCustomNFTListComponent />
          </IfWalletSignedIn>
        </div>
      );
    };
    ```

5.  Get connected wallet NFTs from `useNftTokensByWallet()` hook:

    ```ts
    import { useAccount } from "wagmi";
    import { useNftTokensByWallet } from "@flair-sdk/react";

    const account = useAccount();

    const {
      data: nftTokens,
      error: nftTokensError,
      isLoading: nftTokensLoading,
      sendRequest: refreshNftTokens,
    } = useNftTokensByWallet({
      chainId: 1, // Chain ID (1 for Ethereum Mainnet, 5 for Goerli, 137 for Polygon, etc.)
      contractAddress: "0x....NFT_CONTRACT_ADDRESS.....",
      walletAddress: account.address,
      enabled: Boolean(account.address),
    });
    ```

6.  Show metadata of a specific ERC721 NFT token using `ERC721Token` component:

    ```tsx
    <div>
      {nftTokens?.map((nftToken) => (
        <ERC721Token
          chainId={chainId}
          contractAddress={contractAddress}
          tokenId={nftToken.tokenId}
        >
          {({
            tokenId,
            tokenUri,
            tokenUriError,
            tokenUriLoading,
            metadata,
            metadataError,
            metadataLoading,
          }) => (
            <MyCustomNFTView
              tokenId={tokenId}
              tokenUri={tokenUri}
              tokenUriError={tokenUriError}
              tokenUriLoading={tokenUriLoading}
              metadata={metadata}
              metadataError={metadataError}
              metadataLoading={metadataLoading}
            />
          )}
        </ERC721Token>
      ))}
    </div>
    ```

7.  Send a selected `tokenId` along with `walletAddress`, `signatureHex` and `signatureMessage` to your backend to verify the signature and do any logic on your backend for that NFT and wallet:

    ```ts
    import { useAccount } from "wagmi";
    import { useSignInMessage } from "@flair-sdk/react";

    const account = useAccount();
    const {
      data: { signatureHex, signatureMessage },
    } = useSignInContext();

    const [tokenId, setTokenId] = useState<string>();

    const payload = useMemo(() => {
      return {
        // Your custom payload:
        tokenId,

        // Payload to use for wallet true ownership verification in the backend:
        walletAddress: account.address,
        signatureHex,
        signatureMessage,
    });

    // Send payload to your backend with useCallback or any other means...
    ```

8.  You can use [`/v1/util/siwe/verify` utility endpoint](https://api.flair.dev/swagger/#/Util/UtilController_siweVerify) to verify the signature on your backend:

    ```ts
    import axios from 'axios';

    const verifySignature = async (payload: any) => {
      const { data } = await axios.post('/v1/util/siwe/verify', {
        "signatureHex": "0xc5f30a1b7b9a036f8e92b8f4105129bdc29520c6d22f04a1c9e474b47a2c5ead35f2027143eb932cde364f9cc9259fe268afa94f947ce31e8082180a55120fe01b",
        "signatureMessage": "my-domain.com wants you to sign in with your Ethereum account....",
        "allowedAddress": "0x264D6BF791f6Be6F001A95e895AE0a904732d473",
        "allowedUris": [
          "https://my-domain.com"
        ]
      });
      
      // Any 2xx response means the signature is valid.
      return data;
    }
    ```

    **Alternatively** you can install SIWE library based on your backend language and verify the signature yourself locally, without this API call. See [SIWE library](https://github.com/spruceid/siwe).

9.  Profit :rocket:
