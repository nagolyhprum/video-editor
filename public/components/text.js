{
    const textInput = document.querySelector('#text');
    const scaleInput = document.querySelector('#scale');

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