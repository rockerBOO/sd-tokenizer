import React from "react";

export default function TokenizerForm({
	input,
	model,
	onInputChange,
	onModelChange,
	onSubmit,
}) {
	return (
		<form id="tokenizer" onSubmit={onSubmit}>
			<textarea
				type="text"
				className="input"
				id="input"
				placeholder="A glorious dog"
				contentEditable
				value={input}
				onChange={(e) => onInputChange(e.target.value)}
				onKeyUp={(e) => onInputChange(e.target.value)}
			/>

			<div className="custom-select">
				<select
					name="model"
					id="model"
					value={model}
					onChange={(e) => onModelChange(e.target.value)}
				>
					<option value="runwayml/stable-diffusion-v1-5">SD 1.x</option>
					<option value="stabilityai/stable-diffusion-2-1">SD 2.x</option>
					<option value="stabilityai/stable-diffusion-xl-base-1.0">SDXL</option>
					<option value="stabilityai/sdxl-turbo">SDXL Turbo</option>
				</select>
			</div>

			<input type="submit" id="tokenize" value="Tokenize" />
		</form>
	);
}
