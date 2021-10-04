module.exports = function (status, message) {
    return {
        status: status,
        message: message,
        timestamp: new Date().toISOString()
    };
};
