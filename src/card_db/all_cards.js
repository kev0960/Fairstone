"use strict";
const original_cards = require('./original_card');
const original_cards2 = require('./original_card2');
const card_name = require('../card_api');

(function() {
    module.exports = {
        // c will be unique ID or Name of the card
        // ** WARNING ** 
        // c MUST BE unique ID for the card unless the 
        // card is registered as a card name (though mostly yes)
        load_card: function(c) {
            var x = original_cards.load_card(c); // Neutral, Mage, Warrior Original cards
            if(x) return x; 
            
            x = original_cards2.load_card(c); // Rest of the original cards
            if(x) return x;
            
            // If not found, then chk with the name of the card
            var id = card_name.get_name(c);
            
            x = original_cards.load_card(id); // Neutral, Mage, Warrior Original cards
            if(x) return x; 
            
            x = original_cards2.load_card(id); // Rest of the original cards
            if(x) return x;
        },
        // Check whether certain card is implemented or not
        is_implemented: function(name) {
            
        }
    };
})();