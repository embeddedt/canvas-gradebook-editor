import { useCallback, useRef } from "react"
import { useLocalStorageValue } from "@react-hookz/web"
import { fetchCanvas } from "./fetch";

function APIKeyConfig() {
    const inputRef = useRef<HTMLInputElement>(null)
    const apiKeyStore = useLocalStorageValue<string>("quercus-api-key");
    const saveApiKey = useCallback(async() => {
        if (inputRef.current) {
            const apiKey = inputRef.current.value;
            try {
                await fetchCanvas("/api/v1/courses", apiKey);
                console.log("Success, persisting API key");
                apiKeyStore.set(apiKey);
            } catch(e) {
                window.alert("Failed to test API key: " + e);
            }
        }
    }, [inputRef, apiKeyStore.set]);
    return <div>
        <input ref={inputRef} placeholder="API key"/>
        <p></p>
        <button onClick={saveApiKey}>Test & save</button>
    </div>
}

export default APIKeyConfig