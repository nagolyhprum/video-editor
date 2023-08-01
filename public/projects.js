const projectsUl = document.getElementById('projects')

state.on(({ projects }) => {
    const lis = projects.map(project => `<li><button onclick="setProject(this.innerText)">${project}</li>`)
    projectsUl.innerHTML = lis.join("")
})