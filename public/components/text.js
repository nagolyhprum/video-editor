{
    const textInput = document.querySelector('#text');
    const scaleInput = document.querySelector('#scale');
    const transcriptBtn = document.querySelector('#transcript');

    function copyTextToClipboard(text) {
        // Create a temporary textarea element to hold the text
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed'; // Make it invisible and out of view
        textarea.style.opacity = 0;
        document.body.appendChild(textarea);
      
        // Select the text in the textarea
        textarea.select();
      
        try {
          // Execute the copy command
          const successful = document.execCommand('copy');
          if (successful) {
            console.log('Text copied to clipboard!');
          } else {
            console.error('Copying text to clipboard failed.');
          }
        } catch (err) {
          console.error('Unable to copy text: ', err);
        }
      
        // Remove the temporary textarea from the DOM
        document.body.removeChild(textarea);
      }

    transcriptBtn.onclick = () => {
        const transcript = state.value.timeline.map(clip => clip.text.trim()).join("\n").replace(/[\n\r]+/g, "\n\n")

        copyTextToClipboard(transcript)
    }

    state.watch(["scale"], scale => {
        scaleInput.value = scale
        const project = state.value.project
        if(project) {
            uploadFile({
                pathname : `projects/${project}/scale.json`,
                file : new Blob([JSON.stringify(scale)])
            })
        }
    })

    state.watch(["project"], async project => {
        if(project) {
            try {
                const blob = await downloadFile({
                    pathname : `projects/${project}/scale.json`,
                })
                const scale = await getBlobText(blob)
                state.set({
                    scale : JSON.parse(scale)
                })
            } catch(e) {
                state.set({
                    scale : 100
                })
            }
        }
    })

    scaleInput.oninput = () => {
        state.set({
            scale : scaleInput.valueAsNumber
        })
    }

    textInput.oninput = () => {
        const { clip, index } = getActiveClip()
        state.set({
            timeline : [
                ...state.value.timeline.slice(0, index),
                {
                    ...clip,
                    text : textInput.value
                },
                ...state.value.timeline.slice(index + 1)
            ]
        })
    }

    state.watch(["time", "timeline"], () => {
        const result = getActiveClip()
        if(result && document.focusedElement !== textInput) {
            const { clip } = result
            textInput.value = clip.text || ""
        }
    })
}