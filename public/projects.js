const projectsUl = document.getElementById('projects')

const setProjects = (projects) => {
    const lis = projects.map(project => `<li><button onclick="setProject(this.innerText)">${project}</li>`)
    projectsUl.innerHTML = lis.join("")
}