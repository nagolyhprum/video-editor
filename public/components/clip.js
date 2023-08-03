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
                    media : clip.media.filter(media => media.start < length)
                },
                {
                    type : "image",
                    start : length + clip.start,
                    length : 5,
                    media : []
                },
                {
                    ...clip,
                    start : length + clip.start,
                    length : clip.length - length,
                    media : clip.media.filter(media => media.start >= length)
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
                    media : clip.media.filter(media => media.start < length)
                },
                {
                    ...clip,
                    start : length + clip.start,
                    length : clip.length - length,
                    media : clip.media.filter(media => media.start >= length)
                },
                ...state.value.timeline.slice(index + 1)
            ]
        })
    }
}