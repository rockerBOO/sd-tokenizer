export default function TokenList({
	tokens,
	inputIds,
	hideEndOfWord,
}) {
	const renderToken = (token, index) => {
		const hasSpacePrefix = token.startsWith("Ġ");
		const tokenStripped = hasSpacePrefix ? token.slice(1) : token;
		const endOfWordIndex = tokenStripped.indexOf("</w>");

		if (endOfWordIndex > 0) {
			const tokenClean = tokenStripped.replace("</w>", "");

			return (
				<li key={index} title={inputIds[index]}>
					{hasSpacePrefix && (
						<span className="space-prefix" title="Space">&nbsp;</span>
					)}
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
					{hasSpacePrefix && (
						<span className="space-prefix" title="Space">&nbsp;</span>
					)}
					{tokenStripped}
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
