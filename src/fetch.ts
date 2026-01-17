
/**
 * Fetch results from a Canvas API endpoint, handling pagination if present
 * Returns all results as an array if the endpoint is list-like
 */
export async function fetchCanvas(apiEndpoint: string, apiKey: string) {
  const results: any[] = [];
  let url: string | null = apiEndpoint;

  while (url) {
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Canvas API error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();

    // Push into results only if it’s an array
    if (Array.isArray(data)) {
      results.push(...data);
    } else if (results.length == 0) {
      return data;
    } else {
      throw new Error("Response started out returning array but later returned plain data");
    }

    // Parse Link header for pagination
    const linkHeader = res.headers.get("Link");
    url = null; // default: no next page
    if (linkHeader) {
      const links = linkHeader.split(",").map((part) => part.trim());
      for (const link of links) {
        const match = link.match(/<([^>]+)>;\s*rel="next"/);
        if (match) {
          url = match[1]; // next page URL
          break;
        }
      }
    }
  }

  return results;
}

function getApiKey() {
    const apiKey = window.localStorage.getItem("quercus-api-key");
    if (!apiKey) {
        throw new Error("API key missing");
    }
    const parsedApiKey = JSON.parse(apiKey);
    if (typeof parsedApiKey !== 'string') {
        throw new Error("Invalid key format");
    }
    return parsedApiKey;
}

export async function updateCanvasForm(apiEndpoint: string, method: string, body: URLSearchParams) {
    return fetch(apiEndpoint, {
        method: method,
        body: body,
        headers: {
            "Authorization": `Bearer ${getApiKey()}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
}