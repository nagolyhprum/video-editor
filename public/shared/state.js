const FPS = 10

const state = {
    value : {
        projects : [],
        project : "",
        timeline : [],
        time : 0
    },
    callbacks : [],
    set(state) {
        this.value = {
            ...this.value,
            ...state
        }
        this.callbacks.forEach(callback => callback(this.value))
    },
    on(callback) {
        this.callbacks.push(callback)
        callback(this.value)
    },
    watch(names, callback) {
        let last = null;
        this.on(() => {
            const values = names.map(name => this.value[name])
            if(JSON.stringify(last) !== JSON.stringify(values)) {
                last = values
                callback(...values)
            }
        })
    }
}

const setProject = async (name) => {
    const timeline = await downloadFile({ pathname: `projects/${name}/timeline.json` })
    state.set({ 
        project : name,
        timeline: JSON.parse(await getBlobText(timeline))
    })
}

const handleFileUpload = async (files) => {
    const project = prompt("What would you like to name your new project?", files[0].name)
    if(project) {
        const timeline = [{
            start : 0,
            length : await getVideoDuration(files[0]),
            type : "video",
            media : []
        }]
        await uploadFile({ file: files[0], pathname: `projects/${project}/video.mp3` })
        await uploadFile({ file: new Blob([JSON.stringify(timeline)]), pathname: `projects/${project}/timeline.json` })
        state.set({
            projects : state.value.projects.concat(project)
        })
        setProject(project)
    }
}

const init = async () => {
    const projects = await listFiles({ pathname: "projects" })
    state.set({
        projects,
    })
}

const getActiveClip = () => {
    let start = 0
    for(let clip of state.value.timeline) {
        if(start + clip.length > state.value.time) {
            return {
                clip,
                start
            }
        }
        start += clip.length
    }
}

init()