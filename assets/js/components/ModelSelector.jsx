import { useState } from "react";
import { diffusionModels } from "../models";

export function ModelSelector({ onModelChange }) {
	const [selectedModel, setSelectedModel] = useState(() => {
		return localStorage.getItem("selected-model") || "SD1";
	});

	const handleModelSelect = (model) => {
		setSelectedModel(model);
		localStorage.setItem("selected-model", model);
		onModelChange(model);
	};

	return (
		<div id="models">
			{Object.keys(diffusionModels).map((model) => (
				<button
					type="button"
					key={model}
					className={`model ${selectedModel === model ? "selected" : ""}`}
					onClick={() => handleModelSelect(model)}
				>
					{model}
				</button>
			))}
			{false && selectedModel === "Custom" && <div>
				<input type="text" name="custom-model" />
			</div>}
		</div>
	);
}
