import { useLocalStorageValue } from '@react-hookz/web';
import APIKeyConfig from './APIKeyConfig';
import './App.css'
import { useCallback } from 'react';
import { fetchCanvas } from './fetch';
import { type BareFetcher, SWRConfig } from 'swr';
import GradebookUI from './GradebookUI';

function App() {
  const apiKeyStore = useLocalStorageValue<string>("quercus-api-key");
  const fetcher = useCallback<BareFetcher<any>>((resource) => {
    return fetchCanvas(resource, apiKeyStore.value!);
  }, [apiKeyStore.value]);

  if (!apiKeyStore.value) {
    return <APIKeyConfig/>;
  }

  return (
    <SWRConfig value={{
      fetcher: fetcher,
    }}>
      <GradebookUI/>
    </SWRConfig>
  )
}

export default App
