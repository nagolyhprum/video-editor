{
    const circleBtn = document.getElementById('circle');

    circleBtn.onclick = () => {
        const { start } = getActiveClip()
        state.set({
            preview : {
                type : "circle",
                clicks : 0,
                width : .1,
                height : .1,
                x : .5,
                y : .5,
                length : 2,
                start : state.value.time - start
            }
        })
    }
}