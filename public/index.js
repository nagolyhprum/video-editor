// Function to handle file upload
async function uploadFile({file, pathname}) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`/upload/${pathname}`, {
            method: 'POST',
            body: formData
        })
        const json = await response.json()
        return json.message
    } catch(e) {
        console.error('Error uploading file:', error);
        throw error;
    }
  }
  
  // Function to fetch the list of files from the server
  async function listFiles({pathname}) {
    try {
        const response = await fetch(pathname ? `/list/${pathname}` : "/list")
        const json = await response.json()
        return json.files;
    } catch(error) {
        console.error('Error fetching file list:', error);
        throw error;
    }
  }
  
  // Function to handle file download
async function downloadFile({pathname}) {
    try {
        const response = await fetch(`/download/${pathname}`)
        const blob = await response.blob()
        return blob;
    } catch(error) {
        console.error('Error fetching file list:', error);
        throw error;
    }
  }