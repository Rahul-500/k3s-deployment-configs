function createResponse(message , status , data) {
    return {
        message, 
        status, 
        data
    }
}

module.exports = {
    createResponse
}