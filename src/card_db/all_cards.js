"use strict";
const original_cards = require('./original_card');

(function() {
    module.exports = {
        load_card: function(c) {
            var x = original_cards.load_card(c);
            if(x) return x;
        },
        // Check whether certain card is implemented or not
        is_implemented: function(name) {
            
        }
    };
})();