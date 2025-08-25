class ResponseError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message)
        this.statusCode = statusCode
    }
}

export { ResponseError };