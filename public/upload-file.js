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

const handleFileUpload = async (files) => {
    const project = prompt("What would you like to name your new project?", files[0].name)
    if(project) {
        await uploadFile({ file: files[0], pathname: `projects/${project}/video.mp3` })
        state.set({
            project
        })
    }
}