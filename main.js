let wordsEle;
let loadingEle;
let inputIdsEle;
let tokensEle;
let tokenizerEle;
let modelsEle;

let hideEndOfWord;

let selectedModel;
getSelectedModel();

const $ = document.querySelector.bind(document);

function debounce(task, ms) {
  let t = { promise: null, cancel: (_) => void 0 };
  return async (...args) => {
    try {
      t.cancel();
      t = deferred(ms);
      await t.promise;
      await task(...args);
    } catch (_) {
      /* prevent memory leak */
    }
  };
}

function deferred(ms) {
  let cancel,
    promise = new Promise((resolve, reject) => {
      cancel = reject;
      setTimeout(resolve, ms);
    });
  return { promise, cancel };
}

function escapeHTML(s) {
  return s
    .replace("&", "&amp;")
    .replace('"', "&quot;")
    .replace("'", "&apos;")
    .replace("</", "&lt;")
    .replace(">", "&gt;");
}

function getTokenList(tokens, inputIds, name) {
  console.log("tokenizer name", name);

  const items = tokens.map((token, i) => {
    // li.replace("</w>", "<span></w></span>")
    const endOfWord = token.indexOf("</w>");

    if (endOfWord > 0) {
      const listItem = document.createElement("span");
      // remove end of word and replace it with a new tag
      const tokenClean = token.replace("</w>", "");

      const span = document.createElement("span");
      span.textContent = tokenClean;

      const endOfWordTag = document.createElement("span");
      endOfWordTag.textContent = "</w>";
      endOfWordTag.title = "End of word";
      endOfWordTag.classList.add("end-of-word");

      if (hideEndOfWord) {
        endOfWordTag.classList.add("hide");
      }

      const space = document.createElement("span");
      space.classList.add("space");
      space.innerHTML = "&nbsp;";

      // const span = document.createElement("span")
      listItem.append(span, endOfWordTag, space);
      listItem.title = inputIds[i];
      listItem.classList.add(`token-${i % 4}`);
      listItem.classList.add(`token`);

      // listItem.append(span);
      return listItem;
    } else {
      const listItem = document.createElement("span");
      const span = document.createElement("span");
      span.textContent = token;

      listItem.title = inputIds[i];
      listItem.classList.add(`token-${i % 4}`);
      listItem.classList.add(`token`);
      // listItem.classList.add(`pattern-checks-sm`);

      listItem.appendChild(span);

      return listItem;
    }
  });

  return items;
}

async function run_wasm() {
  await wasm_bindgen();

  const worker = new Worker("./worker.js");

  let loadingTimeout;

  worker.onmessage = (e) => {
    if (e.data.status == "ok") {
      if (wordsEle.value != "") {
        getTokens();
      }
      return;
    }

    switch (e.data.t) {
      case "tokenized_results":
        loadResults(e.data.results, e.data.modelName);
        break;
      default:
        break;
    }
  };

  document.querySelectorAll(".model").forEach((m) => {
    m.addEventListener(
      "click",
      debounce(
        () => getTokens(worker, diffusionModels[selectedModel], wordsEle.value),
        300,
      ),
    );
  });

  wordsEle.addEventListener(
    "keyup",
    debounce(
      () => getTokens(worker, diffusionModels[selectedModel], wordsEle.value),
      300,
    ),
  );

  return worker;
}

const getTokens = (worker, model, input) => {
  console.log("Getting tokens", model, input);
  clearResults();

  worker.postMessage({
    t: "tokenize",
    hf_model: model,
    input: input,
  });
};

function clearResults() {
  if ($("#input").value === "") {
    $("#model").textContent = "";
    $("#results").innerHTML = "";
    return;
  }

  $("#results").innerHTML =
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"  viewBox="0 0 200 200"><rect fill="var(--accent-color)" stroke="var(--accent-color)" stroke-width="15" stroke-linejoin="round" width="30" height="30" x="85" y="85" rx="0" ry="0"><animate attributeName="rx" calcMode="spline" dur="2" values="15;15;5;15;15" keySplines=".5 0 .5 1;.8 0 1 .2;0 .8 .2 1;.5 0 .5 1" repeatCount="indefinite"></animate><animate attributeName="ry" calcMode="spline" dur="2" values="15;15;10;15;15" keySplines=".5 0 .5 1;.8 0 1 .2;0 .8 .2 1;.5 0 .5 1" repeatCount="indefinite"></animate><animate attributeName="height" calcMode="spline" dur="2" values="30;30;1;30;30" keySplines=".5 0 .5 1;.8 0 1 .2;0 .8 .2 1;.5 0 .5 1" repeatCount="indefinite"></animate><animate attributeName="y" calcMode="spline" dur="2" values="40;170;40;" keySplines=".6 0 1 .4;0 .8 .2 1" repeatCount="indefinite"></animate></rect></svg>`;
  $("#model").textContent = "";
  console.log("Cleared results");
}

let diffusionModels = {
  SD1: "runwayml/stable-diffusion-v1-5",
  SD2: "stabilityai/stable-diffusion-2-1",
  SDXL: "stabilityai/stable-diffusion-xl-base-1.0",
  SD3: "stabilityai/stable-diffusion-3.5-large",
  Flux: "black-forest-labs/FLUX.1-schnell",
  Pixart: "PixArt-alpha/PixArt-XL-2",
};

function cacheSelectedModel(model) {
  localStorage.setItem("selected-model", model);
}

function getSelectedModel() {
  if (selectedModel) {
    return selectedModel;
  }

  const selected = localStorage.getItem("selected-model");
  if (!selected) {
    selectedModel = "SD1";
    cacheSelectedModel(model);
    return selectedModel;
  }

  selectedModel = selected;
  return selected;
}

function displayModelList(worker) {
  const buttons = Object.entries(diffusionModels).map(([model, hfModel]) => {
    const modelButton = document.createElement("button");

    modelButton.textContent = model;
    modelButton.addEventListener("click", () => {
      selectedModel = model;

      document
        .querySelectorAll(".model")
        .forEach((m) => m.classList.remove("selected"));
      modelButton.classList.add("selected");
      cacheSelectedModel(selectedModel);
      getTokens(worker, diffusionModels[selectedModel], wordsEle.value);
    });

    if (selectedModel == model) {
      modelButton.classList.add("selected", "model");
    } else {
      modelButton.classList.add("model");
    }

    return modelButton;
  });

  modelsEle.append(...buttons);
}

let hideEndOfWordEle;

window.addEventListener("load", async () => {
  wordsEle = $("#input");
  modelsEle = $("#models");
  loadingEle = $("#loading");
  inputIdsEle = $("#input_ids");
  tokensEle = $("#tokens");
  tokenizerEle = $("#tokenizer");

  const clear = $("#clear");
  const results = $("#results");
  const input = $("#input");

  clear.addEventListener("click", () => {
    input.value = "";
    clearResults();
  });

  const worker = await run_wasm();

  displayModelList(worker);

  $("#show-example").addEventListener("click", () => {
    clearResults();
    input.value =
      "a striking and colorful cover containing the title of the topic is frequency analysis in hydrology";

    getTokens(worker, diffusionModels[selectedModel], wordsEle.value);
  });
  tokenizerEle.addEventListener("submit", (e) => {
    e.preventDefault();
  });
});

function loadResults(encodings, modelName) {
  const results = document.querySelector("#results");
  results.replaceChildren();

  $("#model").textContent = modelName;

  const lists = encodings.map((encoding) => {
    const template = document.querySelector("#result-template");

    const clone = template.content.cloneNode(true);

    const tokens = clone.querySelector(".tokens-list");
    const inputIds = clone.querySelector(".input-ids");

    const tokenList = getTokenList(
      encoding.tokens,
      encoding.input_ids,
      encoding.name,
    );

    clone.querySelector(".input-ids-list").textContent =
      encoding.input_ids.join(", ");

    // clone.querySelector(".tokens-list").append(tokenList);

    clone.querySelector(".tokens-list").append(...tokenList);
    clone.querySelector(".tokens").append(tokenList.length);
    clone.querySelector(".characters").textContent = encoding.prompt.length;
    clone.querySelector(".tokenizer-model").textContent = encoding.name;
    clone.querySelector(".words").textContent =
      encoding.prompt.split(" ").length;
    return clone;
  });

  results.append(...lists);
}
