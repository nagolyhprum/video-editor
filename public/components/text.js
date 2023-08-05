{
    const input = document.querySelector('#text');

    input.oninput = () => {
        const { clip, index } = getActiveClip()
        state.set({
            timeline : [
                ...state.value.timeline.slice(0, index),
                {
                    ...clip,
                    text : input.value
                },
                ...state.value.timeline.slice(index + 1)
            ]
        })
    }

    state.watch(["time", "timeline"], () => {
        const result = getActiveClip()
        if(result && document.focusedElement !== input) {
            const { clip } = result
            input.value = clip.text || ""
        }
    })
}