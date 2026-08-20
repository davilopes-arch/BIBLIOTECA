import { SHEETS_API_URL } from './storage';

export const MAX_ATTACH_MB = 50;

export function uploadToDrive(
  file: File,
  onProgress?: (percentage: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const CHUNK_SIZE = 1.5 * 1024 * 1024; // 1.5MB per chunk
    const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
    const uploadId = 'up_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    function readChunkAsBase64(blob: Blob): Promise<string> {
      return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onerror = () => rej(new Error('Falha ao ler pedaço do arquivo.'));
        reader.onload = () => {
          const resultStr = String(reader.result || '');
          const base64Data = resultStr.split(',')[1] || '';
          res(base64Data);
        };
        reader.readAsDataURL(blob);
      });
    }

    function sendChunk(index: number): Promise<{ sucesso: boolean; link?: string; erro?: string }> {
      return new Promise((res, rej) => {
        const start = index * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const blobChunk = file.slice(start, end);

        readChunkAsBase64(blobChunk)
          .then(chunkData => {
            const payload: any = {
              action: 'uploadChunk',
              uploadId,
              chunkIndex: index,
              totalChunks,
              chunkData
            };
            if (index === totalChunks - 1) {
              payload.nome = file.name;
              payload.tipo = file.type || 'application/octet-stream';
            }

            const xhr = new XMLHttpRequest();
            xhr.open('POST', SHEETS_API_URL, true);
            xhr.setRequestHeader('Content-Type', 'text/plain;charset=utf-8');
            xhr.timeout = 60 * 1000;

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const data = JSON.parse(xhr.responseText);
                  if (!data.sucesso) {
                    rej(new Error(data.erro || `Erro no pedaço ${index + 1}`));
                    return;
                  }
                  res(data);
                } catch (e) {
                  rej(new Error(`Resposta inválida no pedaço ${index + 1}`));
                }
              } else {
                rej(new Error(`Falha no upload (HTTP ${xhr.status})`));
              }
            };
            xhr.onerror = () => rej(new Error(`Erro de rede no pedaço ${index + 1}`));
            xhr.ontimeout = () => rej(new Error(`Tempo esgotado no pedaço ${index + 1}`));
            xhr.send(JSON.stringify(payload));
          })
          .catch(rej);
      });
    }

    (async () => {
      try {
        let lastResult: any = null;
        for (let i = 0; i < totalChunks; i++) {
          lastResult = await sendChunk(i);
          if (typeof onProgress === 'function') {
            onProgress(Math.round(((i + 1) / totalChunks) * 100));
          }
        }
        if (lastResult && lastResult.link) {
          resolve(lastResult.link);
        } else {
          // If for any reason remote link wasn't returned, generate a local blob URL as fallback
          const localUrl = URL.createObjectURL(file);
          resolve(localUrl);
        }
      } catch (err) {
        reject(err);
      }
    })();
  });
}
