const Member = require('../models/Member');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const archiver = require('archiver');
const { generateQRCode } = require('../utils/qrGenerator');

// Function to add a new member
// Function to add a new member
const addMember = async(req, res) => {
    const { name, number } = req.body;
    try {
        // Encrypt the number and generate QR code
        const qr_code = await generateQRCode(number, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 500,
            margin: 2,
        });

        Member.create({ name, number, qr_code }, (err, member) => {
            if (err) return res.status(500).json({ message: 'Error adding member' });
            res.json(member);
        });
    } catch (err) {
        console.error('Error generating QR code:', err);
        res.status(500).json({ message: 'Error generating QR code' });
    }
};

// Function to get all members
const getAllMembers = (req, res) => {
    Member.findAll((err, members) => {
        if (err) return res.status(500).json({ message: 'Error retrieving members' });
        res.json(members);
    });
};

// Function to search members
const searchMembers = (req, res) => {
    const queryText = req.query.q || '';
    Member.search(queryText, (err, members) => {
        if (err) return res.status(500).json({ message: 'Error searching members' });
        res.json(members);
    });
};

// Function to get member details by ID
const getMemberDetails = (req, res) => {
    const id = req.params.id;
    Member.findById(id, (err, member) => {
        if (err) return res.status(500).json({ message: 'Error retrieving member' });
        if (!member) return res.status(404).json({ message: 'Member not found' });
        res.json(member);
    });
};
// Function to generate Excel file(s) for members
const downloadExcelFiles = async(req, res) => {
    try {
        const { mode } = req.query; // Get the mode from query parameter ('individual' or 'combined')
        const members = await new Promise((resolve, reject) => {
            Member.findAll((err, members) => {
                if (err) reject(err);
                else resolve(members);
            });
        });

        if (mode === 'combined') {
            // Generate a single Excel file containing all members
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Members List');

            worksheet.columns = [
                { header: 'Name', key: 'name', width: 30 },
                { header: 'Number', key: 'number', width: 30 },
                { header: 'Attendance', key: 'attendance', width: 15 },
            ];

            members.forEach(member => {
                worksheet.addRow({
                    name: member.name,
                    number: member.number,
                    attendance: member.attendance ? 'Present' : 'Absent',
                });
            });

            // Send the Excel file as a response
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=members.xlsx');

            await workbook.xlsx.write(res);
            res.end();
        } else {
            // Generate individual Excel files and zip them
            const zipArchive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression
            });

            zipArchive.on('error', (err) => {
                console.error('Zip Archive Error:', err);
                res.status(500).json({ message: 'Error generating ZIP archive' });
            });

            res.attachment('members_excel.zip');
            zipArchive.pipe(res);

            for (const member of members) {
                try {
                    const workbook = new ExcelJS.Workbook();
                    const worksheet = workbook.addWorksheet('Member Details');

                    worksheet.columns = [
                        { header: 'Name', key: 'name', width: 30 },
                        { header: 'Number', key: 'number', width: 30 },
                        { header: 'Attendance', key: 'attendance', width: 15 },
                    ];

                    worksheet.addRow({
                        name: member.name,
                        number: member.number,
                        attendance: member.attendance ? 'Present' : 'Absent',
                    });

                    // Add QR Code Image if desired
                    const qrImageBuffer = Buffer.from(
                        member.qr_code.replace(/^data:image\/\w+;base64,/, ''),
                        'base64'
                    );
                    const imageId = workbook.addImage({
                        buffer: qrImageBuffer,
                        extension: 'png',
                    });
                    worksheet.addImage(imageId, {
                        tl: { col: 3, row: 1 },
                        ext: { width: 100, height: 100 },
                    });

                    // Write workbook to buffer
                    const buffer = await workbook.xlsx.writeBuffer();

                    // Append buffer to zip
                    zipArchive.append(buffer, { name: `${member.name}.xlsx` });
                } catch (error) {
                    console.error(`Error processing member ${member.name}:`, error);
                }
            }

            zipArchive.finalize();
        }
    } catch (err) {
        console.error('Error in downloadExcelFiles:', err);
        res.status(500).json({ message: 'Error generating Excel files' });
    }
};

// Similar changes for downloadPDFFiles

const downloadPDFFiles = async(req, res) => {
    try {
        const { mode } = req.query; // Get the mode from query parameter ('individual' or 'combined')
        const members = await new Promise((resolve, reject) => {
            Member.findAll((err, members) => {
                if (err) reject(err);
                else resolve(members);
            });
        });

        if (mode === 'combined') {
            // Generate a single PDF file containing all members
            const doc = new PDFDocument();
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('error', (err) => {
                console.error('Error generating PDF:', err);
                res.status(500).json({ message: 'Error generating PDF' });
            });

            doc.fontSize(20).text('Members List', { align: 'center' });
            doc.moveDown();

            members.forEach(member => {
                doc.fontSize(14).text(`Name: ${member.name}`);
                doc.text(`Number: ${member.number}`);
                doc.text(`Attendance: ${member.attendance ? 'Present' : 'Absent'}`);
                doc.moveDown();
            });

            doc.end();

            await new Promise((resolve) => {
                doc.on('end', resolve);
            });

            const pdfData = Buffer.concat(buffers);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=members.pdf');
            res.end(pdfData);
        } else {
            // Generate individual PDF files and zip them
            const zipArchive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression
            });

            zipArchive.on('error', (err) => {
                console.error('Zip Archive Error:', err);
                res.status(500).json({ message: 'Error generating ZIP archive' });
            });

            res.attachment('members_pdf.zip');
            zipArchive.pipe(res);

            for (const member of members) {
                try {
                    const buffers = [];
                    const doc = new PDFDocument();

                    doc.on('data', buffers.push.bind(buffers));
                    doc.on('error', (err) => {
                        console.error(`Error generating PDF for member ${member.name}:`, err);
                    });

                    doc.fontSize(20).text('Member Details', { align: 'center' });
                    doc.moveDown();
                    doc.fontSize(14).text(`Name: ${member.name}`);
                    doc.text(`Number: ${member.number}`);
                    doc.text(`Attendance: ${member.attendance ? 'Present' : 'Absent'}`);
                    doc.moveDown();

                    // Add QR Code Image if desired
                    const qrImageBuffer = Buffer.from(
                        member.qr_code.replace(/^data:image\/\w+;base64,/, ''),
                        'base64'
                    );
                    doc.image(qrImageBuffer, {
                        fit: [200, 200],
                        align: 'center',
                        valign: 'center',
                    });

                    doc.end();

                    await new Promise((resolve) => {
                        doc.on('end', resolve);
                    });

                    const pdfData = Buffer.concat(buffers);

                    // Append buffer to zip
                    zipArchive.append(pdfData, { name: `${member.name}.pdf` });
                } catch (error) {
                    console.error(`Error processing member ${member.name}:`, error);
                }
            }

            zipArchive.finalize();
        }
    } catch (err) {
        console.error('Error in downloadPDFFiles:', err);
        res.status(500).json({ message: 'Error generating PDF files' });
    }
};
// In memberController.js

const downloadQRCodeImages = async(req, res) => {
    try {
        const { date } = req.query; // Get the date from query parameter if provided
        let members;

        if (date) {
            // Fetch members based on attendance on the selected date
            members = await new Promise((resolve, reject) => {
                Member.getAttendanceByDate(date, (err, members) => {
                    if (err) reject(err);
                    else resolve(members);
                });
            });
        } else {
            // Fetch all members
            members = await new Promise((resolve, reject) => {
                Member.findAll((err, members) => {
                    if (err) reject(err);
                    else resolve(members);
                });
            });
        }

        const zipArchive = archiver('zip', {
            zlib: { level: 9 }, // Maximum compression
        });

        zipArchive.on('error', (err) => {
            console.error('Zip Archive Error:', err);
            res.status(500).json({ message: 'Error generating ZIP archive' });
        });

        res.attachment('qr_codes.zip');
        zipArchive.pipe(res);

        for (const member of members) {
            try {
                // Create a folder for each member
                const folderName = `${member.name}_${member.number}`;
                const qrImageBuffer = Buffer.from(
                    member.qr_code.replace(/^data:image\/\w+;base64,/, ''),
                    'base64'
                );

                // Add QR code image to the folder
                zipArchive.append(qrImageBuffer, { name: `${folderName}/qr_code.png` });

                // Add member details as a text file
                const memberDetails = `Name: ${member.name}\nNumber: ${member.number}\nAttendance: ${member.attendance ? 'Present' : 'Absent'}`;
                zipArchive.append(memberDetails, { name: `${folderName}/details.txt` });

            } catch (error) {
                console.error(`Error processing member ${member.name}:`, error);
            }
        }

        await zipArchive.finalize();

    } catch (err) {
        console.error('Error in downloadQRCodeImages:', err);
        res.status(500).json({ message: 'Error generating QR code images' });
    }
};



module.exports = {
    addMember,
    getAllMembers,
    searchMembers,
    getMemberDetails,
    downloadExcelFiles,
    downloadPDFFiles,
    downloadQRCodeImages,
};