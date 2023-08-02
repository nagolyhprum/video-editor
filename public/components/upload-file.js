{
  const dropZoneDiv = document.getElementById('drop-zone');
  dropZoneDiv.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZoneDiv.style.backgroundColor = '#f7f7f7';
  });
  
  dropZoneDiv.addEventListener('dragleave', (event) => {
    event.preventDefault();
    dropZoneDiv.style.backgroundColor = 'transparent';
  });
  
  dropZoneDiv.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZoneDiv.style.backgroundColor = 'transparent';
    const files = event.dataTransfer.files;
    handleFileUpload(files);
  });
}