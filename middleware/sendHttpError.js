
module.exports = function(req, res, next) {

    res.sendHttpError = function (error) {
        res.status(error.status);
        if (res.req.headers['x-requested-with'] == 'XMLHttpRequest') {
            console.log('sendJson');
            res.json(error);
        } else {
            res.render("error", {error: error});
        }
    };

    next();
};