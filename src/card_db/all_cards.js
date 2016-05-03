"use strict";
const original_cards = require('./original_card');
const original_cards2 = require('./original_card2');

(function() {
    module.exports = {
        load_card: function(c) {
            var x = original_cards.load_card(c); // Neutral, Mage, Warrior Original cards
            if(x) return x; 
            
            x = original_cards2.load_card(c); // Rest of the original cards
            if(x) return x;
        },
        // Check whether certain card is implemented or not
        is_implemented: function(name) {
            
        }
    };
})();