export async function uploadFile({ file, pathname }: { file: Blob; pathname: string }): Promise<string | undefined> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`/api/upload/${pathname}`, {
      method: "POST",
      body: formData,
    });
    const json = await response.json();
    return json.message;
  } catch (e) {
    return undefined;
  }
}

export async function listFiles({ pathname }: { pathname?: string }): Promise<string[]> {
  try {
    const response = await fetch(pathname ? `/api/list/${pathname}` : "/api/list");
    const json = await response.json();
    return json.data;
  } catch (error) {
    return [];
  }
}

export async function downloadFile({ pathname }: { pathname: string }): Promise<Blob | undefined> {
  try {
    const response = await fetch(`/api/download/${pathname}`);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return blob;
  } catch (error) {
    return undefined;
  }
}
