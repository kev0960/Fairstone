"use strict";
const original_cards = require('./original_card');
const original_cards2 = require('./original_card2');
const explorers = require('./explorers');
const card_name = require('../card_api');

(function() {
    var card_names = [];
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
            
            x = explorers.load_card(c); // Rest of the original cards
            if(x) return x;
            
            // If not found, then chk with the name of the card
            var id = card_name.get_name(c);
            
            x = original_cards.load_card(id); // Neutral, Mage, Warrior Original cards
            if(x) return x; 
            
            x = original_cards2.load_card(id); // Rest of the original cards
            if(x) return x;
            
            x = explorers.load_card(id); // Rest of the original cards
            if(x) return x;
        },
        // Check whether certain card is implemented or not
        is_implemented: function(name) {
            if(!card_names.length) {
                card_names = card_names.concat(original_cards.get_card_names());
                card_names = card_names.concat(original_cards2.get_card_names());
                card_names = card_names.concat(explorers.get_card_names());
            }
            
            for(var i = 0; i < card_names; i ++)  {
                if(name == card_names[i]) return true;
            } 
            return false;
        },
        // Get the list of the cards that are implemented
        implemented_card_list : function() {
            if(!card_names.length) {
                card_names = card_names.concat(original_cards.get_card_names());
                card_names = card_names.concat(original_cards2.get_card_names());
                card_names = card_names.concat(explorers.get_card_names());
            }
            return card_names;
        }
    };
})();