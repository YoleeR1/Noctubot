const Schema = require("../../database/models/warnings");

module.exports = (client) => {
    const cleanupWarnings = async () => {
        const currentTime = Date.now();
        const warningExpiryTime = 90 * 24 * 60 * 60 * 1000; // 90 days

        const warnings = await Schema.find({});
        warnings.forEach(async (data) => {
            data.Warnings = data.Warnings.filter(warning => (currentTime - warning.Date) <= warningExpiryTime);
            if (data.Warnings.length === 0) {
                await Schema.deleteOne({ _id: data._id });
            } else {
                await data.save();
            }
        });

        setTimeout(cleanupWarnings, 10 * 1000); // Run every 10 seconds
    };

    cleanupWarnings();
};
