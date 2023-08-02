{
    const projectDiv = document.querySelector("#project")
    
    state.watch(["project"], project => {
        projectDiv.innerHTML = project
    })
}