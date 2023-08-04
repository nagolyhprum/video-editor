{
    const input = document.querySelector('#text');

    input.oninput = () => {
        const { clip } = getActiveClip()
        const index = state.value.timeline.indexOf(clip)
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