const state = {
    value : {
        projects : [],
        project : ""
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
    }
}