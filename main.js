const { startup } = wasm_bindgen;

async function run_wasm() {
  // Load the wasm file by awaiting the Promise returned by `wasm_bindgen`
  // `wasm_bindgen` was imported in `index.html`
  await wasm_bindgen();

  const wordsEle = document.querySelector("#input");
  const modelEle = document.querySelector("#model");
  const loadingEle = document.querySelector("#loading");
  const inputIdsEle = document.querySelector("#input_ids");
  const tokensEle = document.querySelector("#tokens");

  const worker = new Worker("./worker.js");

  worker.onmessage = (e) => {
    const encoding = e.data;

    loadingEle.textContent = "";

    // let encoding = tokenizer.encode(e.target.value, false);
    // document.getElementById("input").innerHTML = ;
    tokensEle.innerHTML =
      "[" + encoding.map((enc) => enc.tokens).join("], [") + "]";
    inputIdsEle.innerHTML =
      "[" + encoding.map((enc) => enc.input_ids).join("], [") + "]";
  };

  wordsEle.addEventListener("change", (e) => {
    loadingEle.textContent = "Loading...";
    tokensEle.textContent = "";
    inputIdsEle.textContent = "";
    worker.postMessage({
      sd_model: modelEle.value,
      input: e.target.value,
    });
  });

  startup();
}

run_wasm();
