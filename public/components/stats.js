{
    const statsDiv = document.querySelector('#stats');

    state.watch(["time", "timeline"], (time, timeline) => {
        const result = getActiveClip();
        if(result) {
            const length = timeline.reduce((length, clip) => length + clip.length, 0)
            const minutes = Math.floor(length / 60)
            const seconds = Math.floor(length % 60)
            const json = {
                time,
                length : `${minutes}:${seconds.toString().padStart(2, "0")}`,
                start : result.start,
                media : result.clip.media.length
            }
            statsDiv.innerHTML = JSON.stringify(json, null, 2)
        }
    })
}