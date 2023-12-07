const wordsEle = document.querySelector("#input");
const modelEle = document.querySelector("#model");
const loadingEle = document.querySelector("#loading");
const inputIdsEle = document.querySelector("#input_ids");
const tokensEle = document.querySelector("#tokens");
const tokenizerEle = document.querySelector("#tokenizer");

let hideEndOfWord;

function escapeHTML(s) {
  return s
    .replace("&", "&amp;")
    .replace('"', "&quot;")
    .replace("'", "&apos;")
    .replace("</", "&lt;")
    .replace(">", "&gt;")
    .replace(">", "&gt;");
}

function tokenList(tokens, inputIds) {
  const ul = document.createElement("ul");

  const items = tokens.map((token, i) => {
    // li.replace("</w>", "<span></w></span>")
    const endOfWord = token.indexOf("</w>");

    if (endOfWord > 0) {
      const listItem = document.createElement("li");
      // remove end of word and replace it with a new tag
      const tokenClean = document.createTextNode(token.replace("</w>", ""));

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
      listItem.append(tokenClean, endOfWordTag, space);
      listItem.title = inputIds[i];

      // listItem.append(span);
      return listItem;
    } else {
      const listItem = document.createElement("li");
      listItem.textContent = token;
      listItem.title = inputIds[i];

      return listItem;
    }
  });

  ul.classList.add("token-list");
  ul.append(...items);

  return ul;
}

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

    tokensEle.innerHTML = "";
    encoding
      .map((enc) => tokenList(enc.tokens, enc.input_ids))
      .forEach((v) => {
        tokensEle.append(v);
      });

    encoding
      .map((enc) => document.createTextNode(enc.input_ids.join(", ")))
      .forEach((v) => inputIdsEle.append(v));
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

const hideEndOfWordEle = document.querySelector("#hide-end-of-word");
hideEndOfWordEle.addEventListener("change", () => {
  hideEndOfWord = hideEndOfWordEle.checked;

  const endOfWordElements = document.querySelectorAll(".end-of-word");
  endOfWordElements.forEach((endOfWordEle) => {
    if (hideEndOfWord) {
      endOfWordEle.classList.add("hide");
    } else {
      endOfWordEle.classList.remove("hide");
    }
  });
});
