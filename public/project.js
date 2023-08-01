const projectDiv = document.querySelector("#project")
let selectedProject = ""

const setProject = (project) => {
    selectedProject = project ?? ""
    projectDiv.innerHTML = selectedProject
}