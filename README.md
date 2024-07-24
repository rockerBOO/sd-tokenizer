# SD-Tokenizer

Use Hugging Face Tokenizers in the browser using Rust and WASM. View the tokenisation of your words using the tokenizer for the model you're using.

![Screenshot 2024-01-24 at 13-45-54 SD Tokenizer](https://github.com/rockerBOO/sd-tokenizer/assets/15027/b1a2e8a8-a016-4eb6-b7a5-2f43735fb63e)

https://sd-tokenizer.rocker.boo/

## Build

```bash
wasm-pack build --target no-modules
```

## Deploy

Using fly to host the service

```
fly deploy
```

## Contributions

Open and welcome for issues or PRs.
