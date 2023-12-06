const wordsEle = document.querySelector("#input");
const modelEle = document.querySelector("#model");
const loadingEle = document.querySelector("#loading");
const inputIdsEle = document.querySelector("#input_ids");
const tokensEle = document.querySelector("#tokens");
const tokenizerEle = document.querySelector("#tokenizer");

async function run_wasm() {
  await wasm_bindgen();

  const worker = new Worker("./worker.js");

  let loadingTimeout;

  worker.onmessage = (e) => {
    const encoding = e.data;

    loadingTimeout = setTimeout(() => {
			loadingEle.textContent = "";
      loadingEle.classList.remove("is-loading");
    }, 240);

    tokensEle.innerHTML = encoding.map((enc) => enc.tokens.join(", "));
    inputIdsEle.innerHTML = encoding.map((enc) => enc.input_ids.join(", "));
  };

  const getTokens = () => {
    if (loadingTimeout) {
      // We don't want it clearing before we load again if we are unloading
      clearTimeout(loadingTimeout);
    }

		loadingEle.textContent = "Loading...";
		loadingEle.classList.add("is-loading");
    tokensEle.textContent = "";
    inputIdsEle.textContent = "";

    worker.postMessage({
      sd_model: modelEle.value,
      input: wordsEle.value,
    });
  };

  wordsEle.addEventListener("change", getTokens);
  tokenizerEle.addEventListener("submit", getTokens);
}

run_wasm();

tokenizerEle.addEventListener("submit", (e) => {
  e.preventDefault();
});
