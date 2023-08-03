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

                    const audio = new Audio(URL.createObjectURL(audioBlob));
                    audio.onseeked = () => {
                        const { clip, start } = getActiveClip()
                        const index = state.value.timeline.indexOf(clip)
                        if(clip.type === "video") {
                            state.set({
                                timeline : [
                                    ...state.value.timeline.slice(0, index),
                                    {
                                        ...clip,
                                        media : [...clip.media, {
                                            type : "audio",
                                            src : `/download/${path}`,
                                            start : state.value.time - start,
                                            length : audio.duration
                                        }]
                                    },
                                    ...state.value.timeline.slice(index + 1)
                                ]
                            })
                        } else {
                            state.set({
                                timeline : [
                                    ...state.value.timeline.slice(0, index),
                                    {
                                        ...clip,
                                        length : audio.duration,
                                        media : [{
                                            type : "audio",
                                            src : `/download/${path}`,
                                            start : 0,
                                            length : audio.duration
                                        }]
                                    },
                                    ...state.value.timeline.slice(index + 1)
                                ]
                            })
                        }
                    }
                    audio.currentTime = 1000;
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