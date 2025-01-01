importScripts("./pkg/sd_tokenizer.js");

const { SDTokenizer } = wasm_bindgen;

const CLIP_BASE = "openai/clip-vit-base-patch32";
const CLIP_LARGE = "openai/clip-vit-large-patch14";
const CLIP_BIGG = "laion/CLIP-ViT-bigG-14-laion2B-39B-b160k";
const T5_XXL = "google-t5/t5-small";

class Tokenizer {
  constructor(json, name) {
    this.tokenizer = new SDTokenizer(json);
    this.name = name;
  }

  static try_from_pretrained_cache(name) {
    const sessionName = `${name}-tokenizer-json`;
    const json = localStorage.getItem(sessionName);

    if (!json) {
      const fromPretrained = Tokenizer.fetch_from_pretrained(name);
      localStorage.setItem(sessionName, fromPretrained);

      return fromPretrained;
    }

    return json;
  }

  static async fetch_from_pretrained(name) {
    const url = `https://huggingface.co/${name}/resolve/main/tokenizer.json`;
    const response = await fetch(url);
    return new Uint8Array(await response.arrayBuffer());
  }

  static async from_pretrained(name) {
    const json = await Tokenizer.fetch_from_pretrained(name);
    return new Tokenizer(json, name);
  }

  static async from_hf_model(name) {
    if (name == "stabilityai/sdxl-turbo") {
      return Promise.all([
        await Tokenizer.from_pretrained(CLIP_LARGE),
        await Tokenizer.from_pretrained(CLIP_BIGG),
      ]);
    } else if (name == "stabilityai/stable-diffusion-xl-base-1.0") {
      return Promise.all([
        await Tokenizer.from_pretrained(CLIP_LARGE),
        await Tokenizer.from_pretrained(CLIP_BIGG),
      ]);
    } else if (name == "stabilityai/stable-diffusion-3.5-large") {
      return Promise.all([
        await Tokenizer.from_pretrained(CLIP_LARGE),
        await Tokenizer.from_pretrained(CLIP_BIGG),
        await Tokenizer.from_pretrained(T5_XXL),
      ]);
    } else if (name == "stabilityai/stable-diffusion-3.5-medium") {
      return Promise.all([
        await Tokenizer.from_pretrained(CLIP_LARGE),
        await Tokenizer.from_pretrained(CLIP_BIGG),
        await Tokenizer.from_pretrained(T5_XXL),
      ]);
    } else if (name == "stabilityai/stable-diffusion-2-1") {
      return Promise.all([await Tokenizer.from_pretrained(CLIP_BASE)]);
    } else if (name == "runwayml/stable-diffusion-v1-5") {
      return Promise.all([await Tokenizer.from_pretrained(CLIP_BASE)]);
    } else if (name == "PixArt-alpha/PixArt-XL-2") {
      return Promise.all([await Tokenizer.from_pretrained(T5_XXL)]);
    } else if (name == "black-forest-labs/FLUX.1-schnell") {
      return Promise.all([
        await Tokenizer.from_pretrained(CLIP_LARGE),
        await Tokenizer.from_pretrained(T5_XXL),
      ]);
    } else {
      throw new Error(`Invalid model ${name}`);
    }
  }

  encode(text) {
    return this.tokenizer.encode(text);
  }
}

const tokenizers = new Map();
let allTokenizers;

async function init_wasm_in_worker() {
  // Load the wasm file by awaiting the Promise returned by `wasm_bindgen`.
  await wasm_bindgen("./pkg/sd_tokenizer_bg.wasm");

  const getTokenizer = async (name) => {
    if (tokenizers.has(name)) {
      return tokenizers.get(name);
    }

    allTokenizers = await Tokenizer.from_hf_model(name);

    allTokenizers.map((tokenizer) => {
      tokenizers.set(name, tokenizer);
    });

    return tokenizers.get(name);
  };

  const getTokenizers = async (name) => {
    const allTokenizers = await Tokenizer.from_hf_model(name);

    allTokenizers.map((tokenizer) => {
      tokenizers.set(name, tokenizer);
    });

    return tokenizers.get(name);
  };

  // Set callback to handle messages passed to the worker.
  self.onmessage = async (event) => {
    switch (event.data.t) {
      case "tokenize": {
        // No data to process...
        if (event.data.input.trim() === "") {
          break;
        }

        const tokenizer = await getTokenizer(event.data.hf_model);

        const results = allTokenizers.map((tokenizer) => {
          const encoding = tokenizer.encode(event.data.input);

          return {
            prompt: event.data.input.trim(),
            name: tokenizer.name,
            tokens: encoding.tokens,
            input_ids: encoding.input_ids,
          };
        });
        // const encoding = tokenizer.encode(event.data.input);

        self.postMessage({
          results,
          modelName: event.data.hf_model,
          t: "tokenized_results",
        });
        break;
      }

      default: {
        self.postMessage({ status: "ok", t: "loaded" });
        break;
      }
    }
  };
}

init_wasm_in_worker();
