{
    async function findTimeOffsetOfFirstSound(audioFile) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const response = await fetch(audioFile);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);
        const offsetInSeconds = await analyzeAudioBuffer(buffer, audioContext);
        audioContext.close();
        return offsetInSeconds;
      }
      
      function analyzeAudioBuffer(buffer, audioContext) {
        return new Promise((resolve) => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
      
          const scriptNode = audioContext.createScriptProcessor(4096, 1, 1);
            let offset = 0;
          scriptNode.onaudioprocess = function (event) {
              const inputData = event.inputBuffer.getChannelData(0);
              
            for (let i = 0; i < inputData.length; i++) {
              if (Math.abs(inputData[i]) >= .1) {
                const offsetInSeconds = (i + offset) / audioContext.sampleRate;
                resolve(offsetInSeconds);
                scriptNode.onaudioprocess = null;
                return;
              }
            }
            offset += inputData.length;
          };
      
          source.connect(scriptNode);
          scriptNode.connect(audioContext.destination);
          source.start();
        });
      }

    let mediaRecorder;
    let recordedChunks = [];

    let recordWith = null;

    async function getAudioInputSources() {
        if(recordWith !== null) {
            return recordWith
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputSources = devices.filter(device => device.kind === 'audioinput');
        let message = 'Select an audio input source:';
        audioInputSources.forEach((source, index) => {
            message += `\n${index + 1}. ${source.label || 'Unnamed Source'}`;
        });
        const userInput = prompt(message);
        const selectedIndex = parseInt(userInput, 10) - 1;
        const selectedDevice = audioInputSources[selectedIndex];
        return recordWith = selectedDevice.deviceId
    }

    const startRecording = () => {
        navigator.mediaDevices.getUserMedia({ 
            audio: true,
            deviceId : getAudioInputSources()
        })
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

                    const offset = await findTimeOffsetOfFirstSound(`/download/${path}`);

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
                                            start : state.value.time - start - offset,
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