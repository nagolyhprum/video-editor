const mediaClip = document.querySelector("#media-clip")
mediaClip.onclick = () => {
    // get all of the media time spans
    const OFFSET = 3;
    const media = state.value.timeline.flatMap(clip => clip.type === "image" ? [{
        from : clip.start - OFFSET,
        to : clip.start + OFFSET,
    }] : clip.media.map(media => ({
        from : clip.start + media.start - OFFSET,
        to : clip.start + media.start + media.length + OFFSET,
    })));
    // merge any overlapping time spans
    for (let i = 0; i < media.length; i++) {
        for (let j = 0; j < media.length; j++) {
            if(i != j) {
                if (
                    (media[i].from <= media[j].from && media[j].from <= media[i].to) ||
                    (media[i].from <= media[j].to && media[j].to <= media[i].to) ||
                    (media[j].from <= media[i].from && media[i].from <= media[j].to) ||
                    (media[j].from <= media[i].to && media[i].to <= media[j].to)
                ) {
                    media[i].from = Math.min(media[i].from, media[j].from);
                    media[i].to = Math.max(media[i].to, media[j].to);
                    media.splice(j, 1);
                    j--;
                }
            }
        }
    }
    const output = state.value.timeline.flatMap(clip => {
        if(clip.type === "image") {
            return [clip];
        } else {
            // split clip based on media time spans
            const overlaps = media.filter(
                media => {
                    const a = media.from <= clip.start && clip.start <= media.to
                    const b = media.from <= clip.start + clip.length && clip.start + clip.length <= media.to
                    const c = clip.start <= media.from && media.from <= clip.start + clip.length
                    const d = clip.start <= media.to && media.to <= clip.start + clip.length
                    return a || b || c || d
                }
            )
            return overlaps.map((overlap, index) => {
                const start = Math.max(overlap.from, clip.start)
                const length = Math.min(overlap.to, clip.start + clip.length) - start
                return {
                    id : crypto.randomUUID(),
                    start,
                    length,
                    media : clip.media.filter(media => (
                          (clip.start + media.start >= overlap.from && clip.start + media.start + media.length <= overlap.to)
                    )).map(media => ({
                        ...media,
                        start : clip.start - start + media.start,
                    })),
                    text : index === 0 ? clip.text : "",
                    type : clip.type
                }
            })
        }
    })
    state.set({timeline : output})
}