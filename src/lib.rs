use tokenizers::ModelWrapper::{self, BPE};
use tokenizers::{Encoding, Tokenizer};
use wasm_bindgen::prelude::*;
use web_sys::{console, js_sys};

#[wasm_bindgen]
pub struct SDTokenizer {
    tokenizer: Tokenizer,
}

#[wasm_bindgen]
impl SDTokenizer {
    #[wasm_bindgen(constructor)]
    pub fn from_buffer(json: &[u8]) -> SDTokenizer {
        SDTokenizer {
            tokenizer: Tokenizer::from_bytes(json)
                .map_err(|e| console::error_1(&format!("Error: {:?}", e).into()))
                .unwrap(),
        }
    }

    pub fn encode(&self, text: &str, add_special_tokens: bool) -> EncodingWasm {
        EncodingWasm {
            encoding: self
                .tokenizer
                .encode(text, add_special_tokens)
                .map_err(|e| console::error_1(&format!("Error: {:?}", e).into()))
                .unwrap(),
        }
    }

    pub fn end_of_word_suffix(&self) -> ModelWasm {
        ModelWasm {
            model: self.tokenizer.get_model().to_owned(),
        }
    }
}

#[wasm_bindgen]
pub struct EncodingWasm {
    encoding: Encoding,
}

#[wasm_bindgen]
impl EncodingWasm {
    #[wasm_bindgen(getter = input_ids)]
    pub fn get_ids(&self) -> js_sys::Uint32Array {
        self.encoding.get_ids().into()
    }

    #[wasm_bindgen(getter = tokens)]
    pub fn get_tokens(&self) -> js_sys::Array {
        self.encoding
            .get_tokens()
            .iter()
            .map(|x| js_sys::JsString::from(x.as_str()))
            .collect()
    }
}

#[wasm_bindgen]
pub struct ModelWasm {
    model: ModelWrapper,
}

#[wasm_bindgen]
impl ModelWasm {
    #[wasm_bindgen(getter = end_of_word_suffix)]
    pub fn get_end_of_word_suffix(&self) -> js_sys::JsString {
        match &self.model {
            BPE(v) => js_sys::JsString::from(
                v.end_of_word_suffix
                    .to_owned()
                    .unwrap_or("invalid".to_string()),
            ),
            _ => {
                console::error_1(&"Error: Unmatched end of word suffix".to_string().into());
                js_sys::JsString::from("invalid")
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use tokenizers::Tokenizer;

    fn create_test_tokenizer_json() -> Vec<u8> {
        // Use a minimal BPE tokenizer JSON for testing
        r#"{
            "model": {
                "type": "BPE",
                "dropout": null,
                "unk_token": null,
                "continuing_subword_prefix": null,
                "end_of_word_suffix": "</w>",
                "vocab": {
                    "hello": 0,
                    "world": 1,
                    "test": 2
                },
                "merges": []
            },
            "pre_tokenizer": null,
            "post_processor": null,
            "decoder": null,
            "normalizer": null
        }"#
        .as_bytes()
        .to_vec()
    }

    #[test]
    fn test_tokenizer_creation() {
        let json = create_test_tokenizer_json();
        let result = std::panic::catch_unwind(|| Tokenizer::from_bytes(&json));

        assert!(result.is_ok());
        let tokenizer = result.unwrap();
        assert!(tokenizer.is_ok());
    }

    #[test]
    fn test_basic_encoding() {
        let json = create_test_tokenizer_json();
        let tokenizer = Tokenizer::from_bytes(&json).unwrap();
        let encoding = tokenizer.encode("hello", false);

        // Test that encoding completes without error
        assert!(encoding.is_ok());
        let encoding = encoding.unwrap();

        // Verify encoding structure
        assert_eq!(encoding.get_ids().len(), encoding.get_tokens().len());
    }

    #[test]
    fn test_end_of_word_suffix() {
        let json = create_test_tokenizer_json();
        let tokenizer = Tokenizer::from_bytes(&json).unwrap();
        let model = tokenizer.get_model();

        match model {
            tokenizers::ModelWrapper::BPE(bpe) => {
                assert_eq!(bpe.end_of_word_suffix, Some("</w>".to_string()));
            }
            _ => panic!("Expected BPE model"),
        }
    }
}

#[cfg(test)]
mod wasm_tests {
    use super::*;
    use wasm_bindgen_test::*;

    wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);

    fn create_wasm_test_tokenizer() -> SDTokenizer {
        let json = r#"{
            "model": {
                "type": "BPE",
                "dropout": null,
                "unk_token": null,
                "continuing_subword_prefix": null,
                "end_of_word_suffix": "</w>",
                "vocab": {
                    "hello": 0,
                    "world": 1,
                    "test": 2,
                    " ": 3,
                    "!": 4
                },
                "merges": []
            },
            "pre_tokenizer": null,
            "post_processor": null,
            "decoder": null,
            "normalizer": null
        }"#
        .as_bytes();

        SDTokenizer::from_buffer(json)
    }

    #[wasm_bindgen_test]
    fn test_wasm_tokenizer_creation() {
        let _tokenizer = create_wasm_test_tokenizer();
    }

    #[wasm_bindgen_test]
    fn test_wasm_encoding() {
        let tokenizer = create_wasm_test_tokenizer();
        let encoding = tokenizer.encode("hello", false);

        let ids = encoding.get_ids();
        let tokens = encoding.get_tokens();

        // Verify JS types work correctly
        assert_eq!(ids.length(), tokens.length());
    }

    #[wasm_bindgen_test]
    fn test_wasm_encoding_with_special_tokens() {
        let tokenizer = create_wasm_test_tokenizer();
        let encoding_without = tokenizer.encode("hello", false);
        let encoding_with = tokenizer.encode("hello", true);

        // Both should work without error - just verify they return arrays
        assert!(js_sys::Array::is_array(&encoding_without.get_tokens()));
        assert!(js_sys::Array::is_array(&encoding_with.get_tokens()));
    }

    #[wasm_bindgen_test]
    fn test_wasm_end_of_word_suffix() {
        let tokenizer = create_wasm_test_tokenizer();
        let model = tokenizer.end_of_word_suffix();
        let suffix = model.get_end_of_word_suffix();

        // Verify JS string conversion works
        let suffix_string = suffix.as_string();
        assert!(suffix_string.is_some());
        assert_eq!(suffix_string.unwrap(), "</w>");
    }

    #[wasm_bindgen_test]
    fn test_wasm_js_types() {
        let tokenizer = create_wasm_test_tokenizer();
        let encoding = tokenizer.encode("test", false);

        let ids = encoding.get_ids();
        let tokens = encoding.get_tokens();

        // Test that JS array methods are available
        assert!(js_sys::Array::is_array(&tokens));

        // Test Uint32Array
        use js_sys::Uint32Array;
        assert!(ids.is_instance_of::<Uint32Array>());
    }
}
