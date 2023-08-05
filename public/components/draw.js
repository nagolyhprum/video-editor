{
    const circleBtn = document.getElementById('circle');
    const arrowBtn = document.getElementById('arrow');

    circleBtn.onclick = () => {
        const { start } = getActiveClip()
        state.set({
            preview : {
                id : crypto.randomUUID(),
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

    arrowBtn.onclick = () => {
        const { start } = getActiveClip()
        state.set({
            preview : {
                id : crypto.randomUUID(),
                type : "arrow",
                clicks : 0,
                points : [{
                    x : .25,
                    y : .25
                }, {
                    x : .75,
                    y : .25
                }, {
                    x : .25,
                    y : .75
                }, {
                    x : .75,
                    y : .75
                }],
                length : 2,
                start : state.value.time - start
            }
        })
    }
}