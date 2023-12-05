// The worker has its own scope and no direct access to functions/objects of the
// global scope. We import the generated JS file to make `wasm_bindgen`
// available which we need to initialize our Wasm code.
importScripts("./pkg/sd_tokenizer.js");

// In the worker, we have a different struct that we want to use as in
// `index.js`.
const { SDTokenizer } = wasm_bindgen;

CLIP_BASE = "openai/clip-vit-base-patch32";
CLIP_LARGE = "openai/clip-vit-large-patch14";
CLIP_BIGG = "laion/CLIP-ViT-bigG-14-laion2B-39B-b160k";

class Tokenizer {
  constructor(json) {
    this.tokenizer = new SDTokenizer(json);
  }

  static async from_pretrained(name) {
    const response = await fetch(
      `https://huggingface.co/${name}/resolve/main/tokenizer.json`,
    );
    const json = await response.text();
    return new Tokenizer(json);
  }

  static async from_sd_model(name) {
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
    } else if (name == "stabilityai/stable-diffusion-2-1") {
      return Promise.all([await Tokenizer.from_pretrained(CLIP_BASE)]);
    } else if (name == "runwayml/stable-diffusion-v1-5") {
      return Promise.all([await Tokenizer.from_pretrained(CLIP_BASE)]);
    } else {
      throw new Error(`Invalid model ${name}`);
    }
  }

  encode(text) {
    return this.tokenizer.encode(text);
  }
}

const tokenizers = new Map();

async function init_wasm_in_worker() {
  // Load the wasm file by awaiting the Promise returned by `wasm_bindgen`.
  await wasm_bindgen("./pkg/sd_tokenizer_bg.wasm");

  const getTokenizer = async (name) => {
    if (tokenizers.has(name)) {
      return tokenizers.get(name);
    }

    const all_tokenizers = await Tokenizer.from_sd_model(name);

    all_tokenizers.map((tokenizer) => {
      tokenizers.set(name, tokenizer);
    });

    return tokenizers.get(name);
  };

  // Set callback to handle messages passed to the worker.
  self.onmessage = async (event) => {
    const tokenizer = await getTokenizer(event.data.sd_model);
    const encoding = tokenizer.encode(event.data.input);
    const endOfWordSuffix = tokenizer.end_of_word_suffix;

    console.log(endOfWordSuffix)

    self.postMessage([
      {
        tokens: encoding.tokens,
        input_ids: encoding.input_ids,
      },
    ]);
  };
}

init_wasm_in_worker();
