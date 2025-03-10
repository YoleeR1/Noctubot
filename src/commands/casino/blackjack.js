const Discord = require('discord.js');

const Schema = require("../../database/models/economy");

module.exports = async (client, interaction, args) => {
    let user = interaction.user;

    Schema.findOne({ Guild: interaction.guild.id, User: user.id }, async (err, data) => {
        if (data) {
            // Updated line to get string and parse it properly
            let amountString = interaction.options.getString('amount');
            let money;
            
            // Parse the amount string with K, M, B suffixes
            if (amountString.endsWith('K') || amountString.endsWith('k')) {
                money = parseFloat(amountString.slice(0, -1)) * 1000;
            } else if (amountString.endsWith('M') || amountString.endsWith('m')) {
                money = parseFloat(amountString.slice(0, -1)) * 1000000;
            } else if (amountString.endsWith('B') || amountString.endsWith('b')) {
                money = parseFloat(amountString.slice(0, -1)) * 1000000000;
            } else {
                money = parseInt(amountString);
            }

            if (!money || isNaN(money)) return client.errUsage({ usage: "blackjack [amount]", type: 'editreply' }, interaction);
            if (money > data.Money) return client.errNormal({ error: `You are betting more than you have!`, type: 'editreply' }, interaction);

            var numCardsPulled = 0;
            var gameOver = false;
            var player = {
                cards: [],
                score: 0,
            };
            var dealer = {
                cards: [],
                score: 0,
            };
            function getCardsValue(a) {
                var cardArray = a,
                    sum = 0,
                    i = 0,
                    aceCount = 0;
                
                // Standard blackjack card values
                for (i = 0; i < cardArray.length; i += 1) {
                    // Face cards are worth 10
                    if (
                        cardArray[i].rank === "J" ||
                        cardArray[i].rank === "Q" ||
                        cardArray[i].rank === "K"
                    ) {
                        sum += 10;
                    } 
                    // Aces are worth 11 initially
                    else if (cardArray[i].rank === "A") {
                        sum += 11;
                        aceCount += 1;
                    } 
                    // Number cards are worth their number
                    else {
                        sum += cardArray[i].rank;
                    }
                }
                
                // Adjust aces from 11 to 1 if needed to avoid busting
                while (aceCount > 0 && sum > 21) {
                    sum -= 10; // Change an ace from 11 to 1
                    aceCount -= 1;
                }
                
                return sum;
            }

            var deck = {
                deckArray: [],
                initialize: function () {
                    var suitArray, rankArray, s, r;
                    // Use standard card suits
                    suitArray = ["hearts", "diamonds", "clubs", "spades"];
                    // Use standard card ranks
                    rankArray = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];

                    // Clear the deck
                    this.deckArray = [];
                    
                    // Create a standard 52-card deck
                    for (s = 0; s < suitArray.length; s += 1) {
                        for (r = 0; r < rankArray.length; r += 1) {
                            this.deckArray.push({
                                rank: rankArray[r],
                                suit: suitArray[s]
                            });
                        }
                    }
                },
                shuffle: function () {
                    // Fisher-Yates (Knuth) shuffle - more random than simple swap
                    let currentIndex = this.deckArray.length;
                    let temporaryValue, randomIndex;
                    
                    // While there remain elements to shuffle
                    while (currentIndex !== 0) {
                        // Pick a remaining element
                        randomIndex = Math.floor(Math.random() * currentIndex);
                        currentIndex -= 1;
                        
                        // Swap it with the current element
                        temporaryValue = this.deckArray[currentIndex];
                        this.deckArray[currentIndex] = this.deckArray[randomIndex];
                        this.deckArray[randomIndex] = temporaryValue;
                    }
                    
                    // Shuffle again for extra randomness
                    currentIndex = this.deckArray.length;
                    while (currentIndex !== 0) {
                        randomIndex = Math.floor(Math.random() * currentIndex);
                        currentIndex -= 1;
                        temporaryValue = this.deckArray[currentIndex];
                        this.deckArray[currentIndex] = this.deckArray[randomIndex];
                        this.deckArray[randomIndex] = temporaryValue;
                    }
                },
            };
            deck.initialize();
            deck.shuffle();
            async function bet(outcome) {
                if (outcome === "win") {
                    data.Money += money;
                    data.save();
                }
                if (outcome === "lose") {
                    data.Money -= money;
                    data.save();
                }
            }

            function endMsg(f, msg, cl, dealerC) {
                // Function to get the correct suit emoji
                function getSuitEmoji(suit) {
                    switch(suit) {
                        case "hearts": return "♥";
                        case "diamonds": return "♦";
                        case "clubs": return "♣";
                        case "spades": return "♠";
                        default: return "?";
                    }
                }
                
                // Format player's cards
                let cardsMsg = "";
                player.cards.forEach(function (card) {
                    // Use the actual card suit instead of random
                    const suitEmoji = getSuitEmoji(card.suit);
                    cardsMsg += suitEmoji + card.rank.toString() + " ";
                });
                cardsMsg += "> " + player.score.toString();

                // Format dealer's cards
                var dealerMsg = "";
                if (!dealerC) {
                    // Only show first card if not showing all dealer cards
                    const suitEmoji = getSuitEmoji(dealer.cards[0].suit);
                    dealerMsg = suitEmoji + dealer.cards[0].rank.toString() + " ?";
                } else {
                    // Show all dealer cards
                    dealer.cards.forEach(function (card) {
                        const suitEmoji = getSuitEmoji(card.suit);
                        dealerMsg += suitEmoji + card.rank.toString() + " ";
                    });
                    dealerMsg += "> " + dealer.score.toString();
                }

                const row = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('blackjack_hit')
                            .setLabel(`Hit`)
                            .setStyle(Discord.ButtonStyle.Primary),

                        new Discord.ButtonBuilder()
                            .setCustomId('blackjack_stand')
                            .setLabel(`Stand`)
                            .setStyle(Discord.ButtonStyle.Primary),
                    )

                if (cl) {

                    client.embed({
                        title: `♦️・Blackjack`,
                        desc: `${f} \n${msg}`,
                        fields: [
                            {
                                name: `You`,
                                value: cardsMsg,
                                inline: true,
                            },
                            {
                                name: `Bot`,
                                value: dealerMsg,
                                inline: true,
                            }
                        ],
                        type: 'editreply'
                    }, interaction)
                }
                else {
                    client.embed({
                        title: `♦️・Blackjack`,
                        desc: `${f} \n${msg}`,
                        fields: [
                            {
                                name: `You`,
                                value: cardsMsg,
                                inline: true,
                            },
                            {
                                name: `Bot`,
                                value: dealerMsg,
                                inline: true,
                            }
                        ],
                        components: [row],
                        type: 'editreply'
                    }, interaction)
                }
            }

            async function endGame() {
                if (player.score === 21) {
                    bet("win");
                    gameOver = true;
                    endMsg(
                        `Win! You got 21!`,
                        `Bot had ${dealer.score.toString()}`,
                        `GREEN`
                    );
                }
                if (player.score > 21) {
                    bet("lose");
                    gameOver = true;
                    endMsg(
                        `Lost! You reached over 21!`,
                        `Bot had ${dealer.score.toString()}`,
                        `RED`
                    );
                }
                if (dealer.score === 21) {
                    bet("lose");
                    gameOver = true;
                    endMsg(
                        `Lost! The dealer got 21!`,
                        `Bot had ${dealer.score.toString()}`,
                        `RED`
                    );
                }
                if (dealer.score > 21) {
                    bet("win");
                    gameOver = true;
                    endMsg(
                        `Win! Bot reached over 21!`,
                        `Bot had ${dealer.score.toString()}`,
                        `GREEN`
                    );
                }
                if (
                    dealer.score >= 17 &&
                    player.score > dealer.score &&
                    player.score < 21
                ) {
                    bet("win");
                    gameOver = true;
                    endMsg(
                        `Win! You defeated Bot!`,
                        `Bot had ${dealer.score.toString()}`,
                        `GREEN`
                    );
                }
                if (
                    dealer.score >= 17 &&
                    player.score < dealer.score &&
                    dealer.score < 21
                ) {
                    bet("lose");
                    gameOver = true;
                    endMsg(
                        `Lost! Bot won!`,
                        `Bot had ${dealer.score.toString()}`,
                        `RED`
                    );
                }
                if (
                    dealer.score >= 17 &&
                    player.score === dealer.score &&
                    dealer.score < 21
                ) {
                    gameOver = true;
                    endMsg(`Tie!`, `Bot had ${dealer.score.toString()}`, `RED`);
                }
            }

            function dealerDraw() {
                dealer.cards.push(deck.deckArray[numCardsPulled]);
                dealer.score = getCardsValue(dealer.cards);
                numCardsPulled += 1;
            }

            function newGame() {
                hit();
                hit();
                dealerDraw();
                endGame();
            }

            function hit() {
                player.cards.push(deck.deckArray[numCardsPulled]);
                player.score = getCardsValue(player.cards);

                numCardsPulled += 1;
                if (numCardsPulled > 2) {
                    endGame();
                }
            }

            function stand() {
                while (dealer.score < 17) {
                    dealerDraw();
                }
                endGame();
            }
            newGame();
            async function loop() {
                if (gameOver) return;

                endMsg(
                    "To hit type `h`, for stand type `s`",
                    `GoodLuck ;)`,
                    client.color
                );

                const filter = i => i.user.id === interaction.user.id;
                interaction.channel.awaitMessageComponent({ filter, max: 1, time: 1200000, errors: ["time"] })
                    .then(async i => {
                        if (i.customId == "blackjack_hit") {
                            hit();
                            loop();
                            return i.deferUpdate();;
                        } else if (i.customId == "blackjack_stand") {
                            stand();
                            loop();
                            return i.deferUpdate();;
                        }
                    })
                    .catch(_ => {
                        interaction.channel.send("Lost!!");
                        bet("lose");
                        return;
                    });
            }
            await loop();
        }
        else {
            client.errNormal({ error: `You don't have any ${client.emotes.economy.coins}!`, type: 'editreply' }, interaction);
        }
    })
}