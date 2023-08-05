{
    const splitBtn = document.getElementById('split');
    const deleteBtn = document.getElementById('delete');
    const stillBtn = document.getElementById('still');
    const startBtn = document.getElementById('start');
    const restoreBtn = document.getElementById('restore');
    const beginningBtn = document.getElementById('beginning');

    restoreBtn.onclick = () => {        
        const { clip, start, index } = getActiveClip()
        const side = Math.round((state.value.time - start) / clip.length) * 2 - 1
        const other = state.value.timeline[index + side]
        const lowerSide = state.value.timeline[Math.min(index, index + side)]
        const upperSide = state.value.timeline[Math.max(index, index + side)]
        const newStart = Math.min(clip.start, other.start)
        const timeline = [
            ...state.value.timeline.slice(0, lowerSide),
            {
                type : "video",
                start : newStart,
                length : Math.max(clip.start + clip.length, other.start + other.length) - newStart,
                text : `${lowerSide.text} ${upperSide.text}`,
                media : [
                    ...lowerSide.media,
                    ...upperSide.media.map(media => ({
                        ...media,
                        id : crypto.randomUUID(),
                        start : media.start + (upperSide.start - lowerSide.start)
                    })),
                ]
            },
            ...state.value.timeline.slice(lowerSide + 2),
        ]
        state.set({
            timeline
        })
    }

    beginningBtn.onclick = () => {
        state.set({
            time : 0
        })
    }

    startBtn.onclick = () => {
        const { start } = getActiveClip()
        state.set({
            time : start
        })
    }

    stillBtn.onclick = () => {
        const { clip, start, index } = getActiveClip()
        const length = state.value.time - start
        state.set({
            timeline : [
                ...state.value.timeline.slice(0, index),
                {
                    ...clip,
                    id : crypto.randomUUID(),
                    length,
                    media : clip.media.filter(media => media.start < length)
                },
                {
                    id : crypto.randomUUID(),
                    type : "image",
                    start : length + clip.start,
                    length : 5,
                    media : [],
                    text : ""
                },
                {
                    ...clip,
                    id : crypto.randomUUID(),
                    start : length + clip.start,
                    length : clip.length - length,
                    media : clip.media.filter(media => media.start >= length).map(media => ({
                        ...media,
                        id : crypto.randomUUID(),
                        start : media.start - length
                    }))
                },
                ...state.value.timeline.slice(index + 1)
            ]
        })
    }

    deleteBtn.onclick = () => {
        const { clip, index } = getActiveClip()
        state.set({
            timeline : [
                ...state.value.timeline.slice(0, index),
                ...state.value.timeline.slice(index + 1)
            ]
        })
    }

    splitBtn.onclick = () => {
        const { clip, start, index } = getActiveClip()
        const length = state.value.time - start
        state.set({
            timeline : [
                ...state.value.timeline.slice(0, index),
                {
                    ...clip,
                    id : crypto.randomUUID(),
                    length,
                    media : clip.media.filter(media => media.start < length)
                },
                {
                    ...clip,
                    id : crypto.randomUUID(),
                    start : length + clip.start,
                    length : clip.length - length,
                    media : clip.media.filter(media => media.start >= length).map(media => ({
                        ...media,
                        id : crypto.randomUUID(),
                        start : media.start - length
                    }))
                },
                ...state.value.timeline.slice(index + 1)
            ]
        })
    }
}