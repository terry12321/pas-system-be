
module.exports = function (message, status) {
    return {
        status: status,
        message: message,
        timestamp: new Date().toISOString()
    }
}