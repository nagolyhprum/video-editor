const setup = async () => {
    const projects = await listFiles({ pathname: "projects" })
    state.set({
        projects,
        project : projects.at(-1)
    })
}
setup()