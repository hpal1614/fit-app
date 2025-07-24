// Browser stub for Node "zlib" module used only on server.
export function gzipSync(data: any): any {
  // Simply return the input data unchanged in the browser.
  return data;
}

export function gunzipSync(data: any): any {
  return data;
}