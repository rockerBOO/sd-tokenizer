use std::panic;
use std::str::FromStr;
use tokenizers::{Encoding, Tokenizer};
use wasm_bindgen::prelude::*;
use web_sys::js_sys;

#[wasm_bindgen]
pub struct SDTokenizer {
    tokenizer: Tokenizer,
}

#[wasm_bindgen]
impl SDTokenizer {
    #[wasm_bindgen(constructor)]
    pub fn from_buffer(json: String) -> SDTokenizer {
        // panic::set_hook(Box::new(console_error_panic_hook::hook));
        SDTokenizer {
            tokenizer: Tokenizer::from_str(&json).unwrap(),
        }
    }

    pub fn encode(&self, text: &str, add_special_tokens: bool) -> EncodingWasm {
        EncodingWasm {
            encoding: self.tokenizer.encode(text, add_special_tokens).unwrap(),
        }
    }
}

#[wasm_bindgen]
pub struct EncodingWasm {
    encoding: Encoding,
}

#[wasm_bindgen]
impl EncodingWasm {
    #[wasm_bindgen(method, getter = input_ids)]
    pub fn get_ids(&self) -> js_sys::Uint32Array {
        self.encoding.get_ids().into()
    }

    #[wasm_bindgen(method, getter = tokens)]
    pub fn get_tokens(&self) -> js_sys::Array {
        self.encoding
            .get_tokens()
            .iter()
            .map(|x| js_sys::JsString::from(x.as_str()))
            .collect()
    }
}
