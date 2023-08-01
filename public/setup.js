const setup = async () => {
    const projects = await listFiles({ pathname: "projects" })
    setProjects(projects)
    setProject(projects.at(-1))
}
setup()