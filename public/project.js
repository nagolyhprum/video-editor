const projectDiv = document.querySelector("#project")

state.on(({ project }) => {
    projectDiv.innerHTML = project
})