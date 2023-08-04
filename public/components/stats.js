{
    const statsDiv = document.querySelector('#stats');

    state.watch(["time", "timeline"], (time) => {
        const result = getActiveClip();
        if(result) {
            const json = {
                time,
                start : result.start,
                media : result.clip.media.length
            }
            statsDiv.innerHTML = JSON.stringify(json, null, 2)
        }
    })
}