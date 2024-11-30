// scripts/regenerateQRCodes.js

const Member = require('../models/Member');
const { generateQRCode } = require('../utils/qrgenerator'); // Adjust the path as needed

const regenerateQRCodes = async() => {
    try {
        Member.findAll(async(err, members) => {
            if (err) {
                console.error('Error fetching members:', err);
                return;
            }

            for (const member of members) {
                try {
                    const newQRCode = await generateQRCode(member.number, {
                        errorCorrectionLevel: 'H',
                        type: 'image/png',
                        width: 500,
                        margin: 2,
                    });

                    // Update the member's QR code in the database
                    const updateQuery = `UPDATE members SET qr_code = ? WHERE id = ?`;
                    const db = require('../config/database'); // Adjust path as needed
                    db.run(updateQuery, [newQRCode, member.id], function(updateErr) {
                        if (updateErr) {
                            console.error(`Error updating QR code for member ID ${member.id}:`, updateErr);
                        } else {
                            console.log(`QR code updated for member ID ${member.id}`);
                        }
                    });
                } catch (qrErr) {
                    console.error(`Error generating QR code for member ID ${member.id}:`, qrErr);
                }
            }
        });
    } catch (err) {
        console.error('Error in regenerateQRCodes:', err);
    }
};

regenerateQRCodes();