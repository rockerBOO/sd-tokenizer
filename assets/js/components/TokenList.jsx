import { useMemo } from "react";

export function TokenList({ tokens, inputIds, name, hideEndOfWord = false }) {
	const tokenElements = useMemo(() => {
		return tokens.map((token, i) => {
			const endOfWord = token.indexOf("</w>");
			const inputId = inputIds[i];
			const tokenColor = `token-${i % 4}`;

			if (endOfWord > 0) {
				const tokenClean = token.replace("</w>", "");

				return (
					<span
						key={`token-${i}`}
						title={inputId}
						className={`token ${tokenColor}`}
					>
						<span className="token-text">{tokenClean}</span>
						{!hideEndOfWord && (
							<span className="end-of-word" title="End of word">
								{"</w>"}
							</span>
						)}
						<span className="space">&nbsp;</span>
					</span>
				);
			}

			return (
				<span
					key={`token-${i}`}
					title={inputId}
					className={`token ${tokenColor}`}
				>
					<span className="token-text">{token}</span>
				</span>
			);
		});
	}, [tokens, inputIds, hideEndOfWord]);

	return (
		<div className="tokens-container" data-tokenizer-name={name}>
			{tokenElements}
		</div>
	);
}

// Utility function for HTML escaping, if needed
export function escapeHTML(s) {
	return s
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}
