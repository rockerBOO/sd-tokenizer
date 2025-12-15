import { useState } from "react";
import TokenDisplay from "./TokenDisplay";
import TokenizerForm from "./TokenizerForm";
import { useTokenizer } from "./useTokenizer";

export default function App() {
	const [input, setInput] = useState("");
	const [model, setModel] = useState("runwayml/stable-diffusion-v1-5");
	const [hideEndOfWord, setHideEndOfWord] = useState(false);

	const { tokenResults, isLoading, tokenize } = useTokenizer();

	const handleSubmit = (e) => {
		e.preventDefault();
		if (input.trim()) {
			tokenize(input, model);
		}
	};

	const handleInputChange = (value) => {
		setInput(value);
		if (value.trim()) {
			tokenize(value, model);
		}
	};

	const handleModelChange = (value) => {
		setModel(value);
		if (input.trim()) {
			tokenize(input, value);
		}
	};

	return (
		<div id="wrapper">
			<h1>Stable Diffusion Tokenizer</h1>
			<p>
				How your prompt/words gets turned into tokens. Privately. For Stable
				Diffusion models.
			</p>

			<TokenizerForm
				input={input}
				model={model}
				onInputChange={handleInputChange}
				onModelChange={handleModelChange}
				onSubmit={handleSubmit}
			/>

			<div className="metadata">
				<label>
					<input
						type="checkbox"
						checked={hideEndOfWord}
						onChange={(e) => setHideEndOfWord(e.target.checked)}
					/>
					Hide{" "}
					<span title="End of word character shows when the tokenizer has a separate token for tokens that end a word">
						end of word character (&lt;/w&gt;)
					</span>
				</label>
				<div>
					<span id="num-tokens">
						{tokenResults?.length > 0 ? tokenResults[0].input_ids.length : "#"}
					</span>{" "}
					tokens
				</div>
			</div>

			{isLoading && (
				<div id="loading-container">
					<div id="loading"></div>
				</div>
			)}

			<TokenDisplay tokenResults={tokenResults} hideEndOfWord={hideEndOfWord} />
		</div>
	);
}
