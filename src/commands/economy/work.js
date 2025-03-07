const Discord = require('discord.js');

const Schema = require("../../database/models/economy");
const Schema2 = require("../../database/models/economyTimeout");
const professionSchema = require("../../database/models/economyProfessions");
const { formatCurrency } = require("../../assets/utils/currencyFormatter");

module.exports = async (client, interaction, args) => {
  let user = interaction.user;
  let timeout = 600000;

  // Get user's profession data
  const profData = await professionSchema.findOne({ Guild: interaction.guild.id, User: user.id });
  const profession = profData ? profData.Profession : 'Unemployed';
  const tier = profData ? profData.Tier : 1;
  
  // Check if user has the required tool for their profession
  if (profession !== 'Unemployed') {
    const hasTool = await client.hasRequiredTool(interaction, user, profession);
    if (!hasTool) {
      return client.errNormal({ 
        error: `You need a tool to work as a ${profession}! Visit the store to buy one.`, 
        type: 'editreply' 
      }, interaction);
    }
  }

  Schema2.findOne({ Guild: interaction.guild.id, User: user.id }, async (err, dataTime) => {
    if (dataTime && dataTime.Work !== null && timeout - (Date.now() - dataTime.Work) > 0) {
      let time = (dataTime.Work / 1000 + timeout / 1000).toFixed(0);
      return client.errWait({
        time: time,
        type: 'editreply'
      }, interaction);
    }
    else {
      // Calculate earnings based on profession and tier
      let amount = await client.calculateWorkEarnings(interaction, user);
      
      // Get work descriptions based on profession
      const workDescriptions = getWorkDescriptions(profession);
      let result = Math.floor((Math.random() * workDescriptions.length));
      
      // Format tier display
      let tierDisplay = "Beginner";
      if (tier === 2) tierDisplay = "Intermediate";
      if (tier === 3) tierDisplay = "Expert";
      
      // Use tool and check if it broke
      let toolBroke = false;
      if (profession !== 'Unemployed') {
        toolBroke = await client.useTool(interaction, user, profession);
      }
      
      // Add experience for working
      const expGain = 10 + (tier * 5);
      await client.addExperience(interaction, user, expGain);
      
      // Create work embed
      client.succNormal({
        text: `You've worked and earned some money!`,
        fields: [
          {
            name: `💼┆Profession`,
            value: `${profession} (${tierDisplay})`,
            inline: true
          },
          {
            name: `📋┆Task`,
            value: `${workDescriptions[result]}`,
            inline: true
          },
          {
            name: `${client.emotes.economy.coins}┆Earned`,
            value: `$${formatCurrency(amount)}`,
            inline: true
          },
          {
            name: `⭐┆Experience`,
            value: `+${expGain} XP`,
            inline: true
          }
        ],
        type: 'editreply'
      }, interaction);
      
      // Show tool broke message if applicable
      if (toolBroke) {
        client.errNormal({ 
          error: `Your tool broke during work! You'll need to buy a new one to continue working as a ${profession}.`, 
          type: 'reply' 
        }, interaction);
      }

      // Update timeout
      if (dataTime) {
        dataTime.Work = Date.now();
        dataTime.save();
      }
      else {
        new Schema2({
          Guild: interaction.guild.id,
          User: user.id,
          Work: Date.now()
        }).save();
      }

      // Add money to user
      client.addMoney(interaction, user, amount);
    }
  });
}

// Work descriptions by profession
function getWorkDescriptions(profession) {
  const descriptions = {
    'Unemployed': [
      "Helped an old lady cross the street",
      "Washed someone's car",
      "Delivered a package",
      "Walked a dog",
      "Cleaned up trash in the park",
      "Helped someone move furniture",
      "Mowed a lawn",
      "Handed out flyers"
    ],
    'Fisherman': [
      "Caught a big tuna",
      "Fished in the deep sea",
      "Sold fresh fish at the market",
      "Repaired fishing nets",
      "Caught rare exotic fish",
      "Led a fishing tour",
      "Supplied fish to a restaurant"
    ],
    'Miner': [
      "Mined coal in a deep shaft",
      "Extracted precious minerals",
      "Discovered a small gold vein",
      "Reinforced mine supports",
      "Operated heavy mining equipment",
      "Processed ore at the refinery",
      "Surveyed a new mining location"
    ],
    'Chef': [
      "Prepared a gourmet meal",
      "Catered a large event",
      "Created a new recipe",
      "Worked the dinner rush",
      "Baked specialty desserts",
      "Taught a cooking class",
      "Prepared meals for a food delivery service"
    ],
    'Programmer': [
      "Fixed critical bugs in the code",
      "Developed a new feature",
      "Optimized database queries",
      "Created a mobile app",
      "Deployed updates to production",
      "Designed a user interface",
      "Set up cloud infrastructure"
    ],
    'Doctor': [
      "Treated patients in the ER",
      "Performed a successful surgery",
      "Diagnosed a rare condition",
      "Administered vaccinations",
      "Worked a long hospital shift",
      "Provided telehealth consultations",
      "Conducted medical research"
    ],
    'Builder': [
      "Constructed a house frame",
      "Installed electrical wiring",
      "Laid foundation for a building",
      "Renovated an old property",
      "Built custom furniture",
      "Installed plumbing in a new development",
      "Completed a roofing project"
    ]
  };
  
  return descriptions[profession] || descriptions['Unemployed'];
}