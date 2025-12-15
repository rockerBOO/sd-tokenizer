import { useCallback, useEffect, useState } from "react";
import {  ModelSelector } from "@/components/ModelSelector";
import { TokenList } from "@/components/TokenList";
import TokenizerWorker from "@/worker?worker";
import { diffusionModels } from "../models";

export default function TokenizerApp() {
	const [input, setInput] = useState("");
	const [worker, setWorker] = useState(null);
	const [encodings, setEncodings] = useState([]);
	const [modelName, setModelName] = useState("");
	const [selectedModel, setSelectedModel] = useState(
		() => localStorage.getItem("selected-model") || "SD1",
	);

	const getTokens = useCallback(
		(currentWorker) => {
			if (!currentWorker) return;

			currentWorker.postMessage({
				t: "tokenize",
				hf_model: diffusionModels[selectedModel],
				input: input,
			});
		},
		[input, selectedModel],
	);

	useEffect(() => {
		async function initWorker() {
			const newWorker = new TokenizerWorker();

			newWorker.onmessage = (e) => {
				switch (e.data.t) {
					case "tokenized_results":
						setEncodings(e.data.results);
						setModelName(e.data.modelName);
						break;
				}
			};

			newWorker.onerror = (e) => {
				console.error(e);
			};

			newWorker.onmessageerror = (e) => {
				console.error("message error", e);
			};

			setWorker(newWorker);
		}

		initWorker();
	}, []);

	useEffect(() => {
		let timeoutId;
		if (input !== "") {
			timeoutId = setTimeout(() => getTokens(worker), 300);
		}
		return function cleanup() {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [input, getTokens, worker]);

	const handleModelChange = useCallback((model) => {
		setSelectedModel(model);
	}, []);

	const clearInput = () => {
		setInput("");
		setEncodings([]);
		setModelName("");
	};

	const showExample = () => {
		const exampleText =
			"a striking and colorful cover containing the title of the topic is frequency analysis in hydrology";
		setInput(exampleText);
	};

	return (
		<div>
			<h1>Diffusion Tokenizer</h1>
			<p>
				How your prompt/words gets turned into tokens. Privately. For Diffusion
				models.
			</p>
			<form id="tokenizer">
				<ModelSelector worker={worker} onModelChange={handleModelChange} />
				<textarea
					type="text"
					className="input"
					id="input"
					placeholder="Enter some text"
					contentEditable
					value={input}
					onChange={(e) => setInput(e.target.value)}
				/>
				<div className="controls">
					<button type="button" id="clear" onClick={clearInput}>
						Clear
					</button>
					<button type="button" id="show-example" onClick={showExample}>
						Show example
					</button>
				</div>
			</form>

			{modelName && (
				<article>
					<h1 id="model">{modelName}</h1>
					<div id="results">
						{encodings.map((encoding, index) => (
							<section key={index}>
								<h3 className="tokenizer-model">{encoding.name}</h3>
								<div className="metadata">
									<div className="number">
										Tokens
										<span className="tokens">{encoding.tokens.length}</span>
									</div>
									<div className="number">
										Characters
										<span className="characters">{encoding.prompt.length}</span>
									</div>
									<div className="number">
										Words
										<span className="words">
											{encoding.prompt.split(" ").length}
										</span>
									</div>
								</div>
								<h4>Tokens</h4>
								<TokenList
									tokens={encoding.tokens}
									inputIds={encoding.input_ids}
									name={encoding.name}
								/>
								<h4>Input ids</h4>
								<div className="input-ids-list">
									{encoding.input_ids.join(", ")}
								</div>
							</section>
						))}
					</div>
				</article>
			)}
		</div>
	);
}
