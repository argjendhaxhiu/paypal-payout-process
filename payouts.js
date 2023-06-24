var config  = require( '../server/config' );

var _           = require( 'underscore' ),
    paypal      = require( 'paypal-rest-sdk' ),
    Promise     = require( 'bluebird' ),
    mongoose    = require( 'mongoose' );


console.log( 'Payout daemon initialized with PayPal configuration: %j', config.paypal );

paypal.configure( config.paypal );
mongoose.connect.apply( mongoose, config.db.default() );


var JobModel        = require( '../server/models/JobModel' );



setInterval( function () {

    var payoutJSON = {
        sender_batch_header: {
            sender_batch_id: createBatchId(),
            email_subject: "A payment is ready."
        },
        items: []
    };

    JobModel
        .where( 'status', JobModel.status.Accepted )
        .deepPopulate( 'owner, owner.feedbacks, owner.promotions, client, work, offer' )
        .exec()
        .then( function ( jobs ) {
            console.log( 'Found ' + jobs.length + ' to process.' );
            for ( var i in jobs ) {
                payoutJSON.items.push( getPayoutJSONForJob( jobs[i] ) );
            }

            if ( !payoutJSON.items.length ) {
                return console.log( 'No payouts to send.' );
            }

            console.log( 'Sending ' + payoutJSON.items.length + ' payouts.\n' );
            console.log( 'Begin PayoutJSON \n\n %j \n\n End PayoutJSON', payoutJSON );

            paypal.payout.create( payoutJSON, function ( error, payout ) {
                if ( error ) {
                    return console.error( 'Error submitting payouts:\n\n %j', error );
                }

                console.log( 'Begin Paypal Payout Response \n\n %j \n\n End Paypal Payout Response', payout );



                _.invoke( jobs, 'set', 'status', JobModel.status.Paid );
                var saves = _.invoke( jobs, 'save' );

                _.each( jobs, function ( job ) {
                    var owner = job.get( 'owner' );

                    owner
                        .get( 'transactions' )
                        .push({
                            createdAt: new Date(),
                            description: 'Paypal payout',
                            total: getPayoutAmountForJob( job ).value
                        });

                    saves.push( owner.save() );
                });



                Promise
                    .all( saves )
                    .then( function ( ) {
                        console.log( 'Processed jobs have been updated.' );
                    })
                    .then( null, function ( err ) {
                        console.error( 'Error saving jobs as paid: %j', err );
                    });
            });
        });
}, 3600000 );



function createBatchId() {
    return Math.random().toString(36).substring(9);
}

function getPayoutJSONForJob( job ) {
    var owner = job.get( 'owner' );
    var ppid  = owner.get( 'credentials.paypalId' );
    var email = owner.get( 'credentials.email' );
    return {
        recipient_type: 'EMAIL',
        amount: getPayoutAmountForJob( job ),
        receiver: ppid || email,
        note: 'Payout for Job completion: ' + job.get( 'work' ).get( 'name' ),
        sender_item_id: job.id.toString()
    }
}

function getPayoutAmountForJob( job ) {
    var cost    = job.get( 'cost' );


    // Cost if no cost previously calculated
    if ( !cost ) {
        var wordCount   = job.get( 'work' ).get( 'wordCount' ),
            winningBid  = job.get( 'bid' );

        cost = winningBid.ppw * wordCount;
    }

    var cutAmount       = cost * getCutRateFor( job.get( 'owner' ) );
    var payoutAmount    = +(cutAmount).toFixed( 2 );
    return {
        value: payoutAmount,
        currency: 'USD'
    }
}

function getCutRateFor( user ) {
    var cut     = 0.82;

    // Check valid cut promotions
    var promotions      = user.get( 'promotions' );
    var cutPromotions = _( promotions )
        .chain()
        .filter( function ( promo ) {
            return promo.get( 'modifiers.cut' );
        })
        .filter( function ( promo ) {
            return new Date() >= promo.get( 'expires' );
        })
        .sortBy( function ( promo ) {
            return promo.modifiers.cut;
        })
        .value();

    if ( cutPromotions.length ) {
        return ( cutPromotions[0].modifiers.cut / 100 ) + cut;
    }


    // No valid promotion, calculate cut based on ratings.
    var rating  = user.get( 'rating' ),
        ratings = _( user.get( 'feedbacks' ) )
            .chain()
            .pluck( 'rating' )
            .filter()
            .value();

    var counts  = _( ratings ).groupBy();

    // Has reviews
    if ( ratings.length ) {
        var percentOneRating    = ( counts[1].length / ratings.length ) * 100,
            goodReviewCount     = counts[4].length + counts[5].length;

        // Has <= 10% 1 star ratings, average rating is >= 4
        if ( percentOneRating <= 10 && rating >= 4 ) {
            if ( goodReviewCount >= 20 ) {
                cut = 0.90;
            } else if ( goodReviewCount >= 5 && goodReviewCount < 20 ) {
                cut = 0.85;
            }
        }
    }

    return cut;
}
