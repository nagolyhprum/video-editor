{

    let mediaRecorder;
    let recordedChunks = [];

    const startRecording = () => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                mediaRecorder = new MediaRecorder(stream);

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
                    recordedChunks = [];
                    const path = `/projects/${state.value.project}/audio/${crypto.randomUUID()}.wav`;
                    await uploadFile({ file: audioBlob, pathname: path });
                };

                mediaRecorder.start();
            })
            .catch((error) => {
                console.error('Error accessing microphone:', error);
            });
    };

    const stopRecording = () => {
        mediaRecorder.stop();
    };

    const audio = () => {
        if(mediaRecorder && mediaRecorder.state !== 'inactive') {
            stopRecording();
        } else {
            startRecording()
        }
    }

    document.getElementById('audio').addEventListener('click', audio);
}