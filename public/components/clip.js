{
    const splitBtn = document.getElementById('split');
    const deleteBtn = document.getElementById('delete');
    const stillBtn = document.getElementById('still');

    stillBtn.onclick = () => {
        const { clip, start } = getActiveClip()
        const index = state.value.timeline.indexOf(clip)
        const length = state.value.time - start
        state.set({
            timeline : [
                ...state.value.timeline.slice(0, index),
                {
                    ...clip,
                    length,
                    audio : [] // TODO
                },
                {
                    type : "image",
                    start : length + clip.start,
                    length : 5,
                    audio : []
                },
                {
                    ...clip,
                    start : length + clip.start,
                    length : clip.length - length,
                    audio : [] // TODO
                },
                ...state.value.timeline.slice(index + 1)
            ]
        })
    }

    deleteBtn.onclick = () => {
        const { clip } = getActiveClip()
        const index = state.value.timeline.indexOf(clip)
        state.set({
            timeline : [
                ...state.value.timeline.slice(0, index),
                ...state.value.timeline.slice(index + 1)
            ]
        })
    }

    splitBtn.onclick = () => {
        const { clip, start } = getActiveClip()
        const index = state.value.timeline.indexOf(clip)
        const length = state.value.time - start
        state.set({
            timeline : [
                ...state.value.timeline.slice(0, index),
                {
                    ...clip,
                    length,
                    audio : [] // TODO
                },
                {
                    ...clip,
                    start : length + clip.start,
                    length : clip.length - length,
                    audio : [] // TODO
                },
                ...state.value.timeline.slice(index + 1)
            ]
        })
    }
}