const CLIP_BASE = "openai/clip-vit-base-patch32";
const CLIP_LARGE = "openai/clip-vit-large-patch14";
const CLIP_BIGG = "laion/CLIP-ViT-bigG-14-laion2B-39B-b160k";
const T5_XXL = "google-t5/t5-small";

async function init_wasm_in_worker() {
	const wasmModule = await import("/pkg/sd_tokenizer.js");
	await wasmModule.default();
	const { SDTokenizer } = wasmModule;

	const tokenizerCache = new TokenizerCache();

	tokenizerCache.clearOldTokenizers();

	class Tokenizer {
		constructor(json, name) {
			this.tokenizer = new SDTokenizer(json);
			this.name = name;
		}

		static async try_from_pretrained_cache(name) {
			const sessionName = `${name}-tokenizer-json`;
			const json = await tokenizerCache.getTokenizer(sessionName);

			if (!json) {
				const fromPretrained = await Tokenizer.fetch_from_pretrained(name);
				tokenizerCache.cacheTokenizer(sessionName, fromPretrained);

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
			const json = await Tokenizer.try_from_pretrained_cache(name);
			return new Tokenizer(json, name);
		}

		static async from_hf_model(name) {
			if (name === "stabilityai/sdxl-turbo") {
				return Promise.all([
					await Tokenizer.from_pretrained(CLIP_LARGE),
					await Tokenizer.from_pretrained(CLIP_BIGG),
				]);
			} else if (name === "stabilityai/stable-diffusion-xl-base-1.0") {
				return Promise.all([
					await Tokenizer.from_pretrained(CLIP_LARGE),
					await Tokenizer.from_pretrained(CLIP_BIGG),
				]);
			} else if (name === "stabilityai/stable-diffusion-3.5-large") {
				return Promise.all([
					await Tokenizer.from_pretrained(CLIP_LARGE),
					await Tokenizer.from_pretrained(CLIP_BIGG),
					await Tokenizer.from_pretrained(T5_XXL),
				]);
			} else if (name === "stabilityai/stable-diffusion-3.5-medium") {
				return Promise.all([
					await Tokenizer.from_pretrained(CLIP_LARGE),
					await Tokenizer.from_pretrained(CLIP_BIGG),
					await Tokenizer.from_pretrained(T5_XXL),
				]);
			} else if (name === "stabilityai/stable-diffusion-2-1") {
				return Promise.all([await Tokenizer.from_pretrained(CLIP_BASE)]);
			} else if (name === "runwayml/stable-diffusion-v1-5") {
				return Promise.all([await Tokenizer.from_pretrained(CLIP_BASE)]);
			} else if (name === "PixArt-alpha/PixArt-XL-2") {
				return Promise.all([await Tokenizer.from_pretrained(T5_XXL)]);
			} else if (name === "black-forest-labs/FLUX.1-schnell") {
				return Promise.all([
					await Tokenizer.from_pretrained(CLIP_LARGE),
					await Tokenizer.from_pretrained(T5_XXL),
				]);
			} else {
				try {
					console.log(`Custom model name ${name}`);
					// try to find model
					return Promise.all([await Tokenizer.from_pretrained(name)]);
				} catch (e) {
					console.error(e);
					throw new Error(`Invalid model ${name}`);
				}
			}
		}

		encode(text) {
			return this.tokenizer.encode(text, false);
		}
	}

	// Set callback to handle messages passed to the worker.
	self.onmessage = async (event) => {
		switch (event.data.t) {
			case "tokenize": {
				// No data to process...
				if (event.data.input.trim() === "") {
					break;
				}

				const getTokenizers = async (name) => Tokenizer.from_hf_model(name);

				const allTokenizers = await getTokenizers(event.data.hf_model);

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

class TokenizerCache {
	constructor(maxAge = 7 * 24 * 60 * 60 * 1000) {
		// Default: 7 days
		this.memoryCache = new Map();
		this.dbName = "TokenizerCache";
		this.storeName = "tokenizers";
		this.maxAge = maxAge;
	}

	async openDB() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, 2);

			request.onupgradeneeded = (event) => {
				const db = event.target.result;
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName, { keyPath: "name" });
				}
			};

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	async getTokenizer(name) {
		// Check memory cache first
		if (this.memoryCache.has(name)) {
			return this.memoryCache.get(name);
		}

		// Then check IndexedDB
		try {
			const db = await this.openDB();
			const transaction = db.transaction([this.storeName], "readonly");
			const store = transaction.objectStore(this.storeName);

			return new Promise((resolve, reject) => {
				const request = store.get(name);

				request.onsuccess = () => {
					if (request.result) {
						// Check cache age
						const now = Date.now();
						if (now - request.result.timestamp > this.maxAge) {
							// Cache is too old, remove it
							this.deleteTokenizer(name);
							resolve(null);
							return;
						}

						// Cache in memory and return
						this.memoryCache.set(name, request.result.data);
						resolve(request.result.data);
					} else {
						resolve(null);
					}
				};

				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error("IndexedDB access error:", error);
			return null;
		}
	}

	async cacheTokenizer(name, data) {
		// Cache in memory first
		this.memoryCache.set(name, data);

		try {
			const db = await this.openDB();
			const transaction = db.transaction([this.storeName], "readwrite");
			const store = transaction.objectStore(this.storeName);

			return new Promise((resolve, reject) => {
				const request = store.put({
					name,
					data,
					timestamp: Date.now(),
				});

				request.onsuccess = () => resolve(true);
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error("IndexedDB caching error:", error);
			return false;
		}
	}

	async deleteTokenizer(name) {
		// Remove from memory cache
		this.memoryCache.delete(name);

		try {
			const db = await this.openDB();
			const transaction = db.transaction([this.storeName], "readwrite");
			const store = transaction.objectStore(this.storeName);

			return new Promise((resolve, reject) => {
				const request = store.delete(name);

				request.onsuccess = () => resolve(true);
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error("IndexedDB delete error:", error);
			return false;
		}
	}

	async clearOldTokenizers() {
		try {
			const db = await this.openDB();
			const transaction = db.transaction([this.storeName], "readwrite");
			const store = transaction.objectStore(this.storeName);
			const now = Date.now();

			return new Promise((resolve, reject) => {
				const request = store.openCursor();

				request.onsuccess = (event) => {
					const cursor = event.target.result;
					if (cursor) {
						if (now - cursor.value.timestamp > this.maxAge) {
							// Delete old entry
							const deleteRequest = cursor.delete();
							deleteRequest.onsuccess = () => {
								cursor.continue();
							};
						} else {
							cursor.continue();
						}
					} else {
						resolve(true);
					}
				};

				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error("IndexedDB clear old entries error:", error);
			return false;
		}
	}
}

init_wasm_in_worker();
