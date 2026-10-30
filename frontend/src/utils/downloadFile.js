/**
 * Safely triggers a browser file download using URL.createObjectURL and Blob.
 * Validates Blob integrity, enforces non-empty payload, and guarantees revocation of the object URL.
 *
 * @param {Blob|string|ArrayBuffer} data - Raw file content or Blob instance
 * @param {string} filename - Desired download filename
 * @param {string} [mimeType='text/csv;charset=utf-8;'] - MIME type fallback
 */
export function downloadFile(data, filename = 'techdesk-report.csv', mimeType = 'text/csv;charset=utf-8;') {
  if (data === null || data === undefined) {
    throw new Error('The exported file is empty or invalid.');
  }

  let blob;
  if (data instanceof Blob) {
    blob = data;
  } else if (typeof data === 'string' || data instanceof ArrayBuffer) {
    blob = new Blob([data], { type: mimeType });
  } else if (typeof data === 'object') {
    if (data.message) {
      throw new Error(data.message);
    }
    blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
  }

  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error('The exported file is empty or invalid.');
  }

  const url = window.URL.createObjectURL(blob);

  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    window.URL.revokeObjectURL(url);
  }
}
