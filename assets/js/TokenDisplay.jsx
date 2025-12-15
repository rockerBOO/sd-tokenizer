import React from "react";
import TokenList from "./TokenList";

export default function TokenDisplay({ tokenResults, hideEndOfWord }) {
	if (!tokenResults || tokenResults.length === 0) {
		return <div id="result"></div>;
	}

	return (
		<>
			<div id="result"></div>
			<div className="container">
				<div className="block">
					<div>Tokens:</div>
					<div id="tokens">
						{tokenResults.map((result, index) => (
							<TokenList
								key={index}
								tokens={result.tokens}
								inputIds={result.input_ids}
								hideEndOfWord={hideEndOfWord}
							/>
						))}
					</div>
				</div>
				<div className="block">
					<div>Input ids:</div>
					<div id="input_ids">
						{tokenResults.map((result, index) => (
							<span key={index}>{result.input_ids.join(", ")}</span>
						))}
					</div>
				</div>
			</div>
		</>
	);
}
