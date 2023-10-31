{
    const statsDiv = document.querySelector('#stats');

    const toTime = (input) => {
        const minutes = Math.floor(input / 60)
        const seconds = Math.floor(input % 60)
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    state.watch(["time", "timeline"], (time, timeline) => {
        const result = getActiveClip();
        if(result) {
            const length = timeline.reduce((length, clip) => length + clip.length, 0)
            const json = {
                time: toTime(time),
                length : toTime(length),
                start : result.start,
                media : result.clip.media.length,
                stills : timeline.filter(({ type, media, text }) => type === "image" || media.length || text).length,
            }
            statsDiv.innerHTML = JSON.stringify(json, null, 2)
        }
    })
}