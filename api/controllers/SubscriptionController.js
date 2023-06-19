module.exports = {

    createSubscriptonFromAPICall: function(req, res, next) {
        // console.log("createSubscriptonFromAPICall");
        var subscriptionObj = {
            subscriptionName: req.param('subscriptionName'),
            duration: req.param('duration'),
            price: req.param('price'),
            numberOfCars: req.param('numberOfCars'),
            numberOfVenues: req.param('numberOfVenues')
        }
        // console.log("call from android.... subscription.");
        Subscription.create(subscriptionObj).exec(function(error, subscriptionObj) {
            if (error) { console.log(error); }
            console.log(subscriptionObj);
            res.send({ success: "success" });
        });
    },
    editSubscription: function(req, res, next) {
        var subscriptionObj = {
            subscriptionName: req.param('subscriptionName'),
            duration: req.param('duration'),
            price: req.param('price'),
            numberOfCars: req.param('numberOfCars'),
            numberOfVenues: req.param('numberOfVenues')
        }
        // console.log("call from android.... subscription editing.");
        Subscription.findOne(req.param('id')).populateAll().exec(function foundUser(err, subscription) {
            if (err) return next(err);
            Subscription.update(req.param('id'), subscriptionObj, function Updated(err) {
                if (err) return next(err);
                console.log('Updated');
                res.send({ success: "success" });
            });
        });
    },
    deleteSubscription: function(req, res, next) {
        // console.log("call from android.... subscription delete.");
        Subscription.findOne(req.param('id')).populateAll().exec(function foundUser(err, subscriptionObj) {
            if (err) return next(err);
            if (!subscriptionObj) return next('Subscription doesn\'t exist.');
            Subscription.destroy(subscriptionObj.id, function Destroyed(err, destroyObj) {
                if (err) return next(err);
                res.send(destroyObj);
            });
        });
    },
};
