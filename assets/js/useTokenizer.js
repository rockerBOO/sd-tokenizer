import { useState, useEffect, useRef } from "react";

export function useTokenizer() {
	const [tokenResults, setTokenResults] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const workerRef = useRef(null);

	useEffect(() => {
		const initWasm = async () => {
			await window.wasm_bindgen();

			workerRef.current = new Worker("./assets/js/worker.js");

			workerRef.current.onmessage = (e) => {
				const encoding = e.data;
				setTokenResults(encoding);
				setIsLoading(false);
			};

			workerRef.current.onerror = (error) => {
				console.error("Worker error:", error);
				setIsLoading(false);
			};
		};

		initWasm();

		return () => {
			if (workerRef.current) {
				workerRef.current.terminate();
			}
		};
	}, []);

	const tokenize = (input, model) => {
		if (!input.trim() || !workerRef.current) {
			return;
		}

		setIsLoading(true);
		workerRef.current.postMessage({
			sd_model: model,
			input: input,
		});
	};

	return {
		tokenResults,
		isLoading,
		tokenize,
	};
}
