import React from "react";

export default function TokenList({ tokens, inputIds, hideEndOfWord }) {
	const renderToken = (token, index) => {
		const endOfWordIndex = token.indexOf("</w>");

		if (endOfWordIndex > 0) {
			const tokenClean = token.replace("</w>", "");

			return (
				<li key={index} title={inputIds[index]}>
					{tokenClean}
					<span
						className={`end-of-word ${hideEndOfWord ? "hide" : ""}`}
						title="End of word"
					>
						&lt;/w&gt;
					</span>
					<span className="space">&nbsp;</span>
				</li>
			);
		} else {
			return (
				<li key={index} title={inputIds[index]}>
					{token}
				</li>
			);
		}
	};

	return (
		<ul className="token-list">
			{tokens.map((token, index) => renderToken(token, index))}
		</ul>
	);
}
