# SD-Tokenizer

Use Hugging Face Tokenizers in the browser using Rust and WASM. View the tokenisation of your words using the tokenizer for the model you're using.

![Screenshot 2024-01-24 at 13-45-54 SD Tokenizer](https://github.com/rockerBOO/sd-tokenizer/assets/15027/b1a2e8a8-a016-4eb6-b7a5-2f43735fb63e)

https://sd-tokenizer.rocker.boo/

## Build

```bash
wasm-pack build --target no-modules
```

## Usage

After building the WASM we can load everything from an http-server.

Example server:

```
npx http-server
```

```
npx http-server
Starting up http-server, serving ./

http-server version: 14.1.1

http-server settings:
CORS: disabled
Cache: 3600 seconds
Connection Timeout: 120 seconds
Directory Listings: visible
AutoIndex: visible
Serve GZIP Files: false
Serve Brotli Files: false
Default File Extension: none

Available on:
  http://127.0.0.1:8080
  http://192.168.1.7:8080
  http://172.21.0.1:8080
  http://172.19.0.1:8080
  http://172.18.0.1:8080
Hit CTRL-C to stop the server
```

And we can go to `http://127.0.0.1:8080`.

## Deploy

Using fly to host the service

```
fly deploy
```

## Contributions

Open and welcome for issues or PRs.
