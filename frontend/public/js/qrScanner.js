// public/js/qrscanner.js

document.addEventListener('DOMContentLoaded', async() => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    } else {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === 'videoinput');

            if (cameras.length === 0) {
                throw new Error("No camera found. Please check your device permissions.");
            }

            const html5QrCode = new Html5Qrcode("qr-reader");
            const qrCodeSuccessCallback = (decodedText, decodedResult) => {
                markAttendance(decodedText);
                html5QrCode.stop().then(() => {
                    console.log("QR code scanning stopped.");
                }).catch(err => {
                    console.error("Error stopping QR code scanning:", err);
                });
            };

            const config = { fps: 10, qrbox: 250 };

            html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
                .catch(err => {
                    console.error("Error starting QR code scanning:", err);
                    alert("Unable to start QR scanner. Please allow camera permissions.");
                });
        } catch (err) {
            console.error(err);
            alert("Camera access is blocked. Please enable camera permissions and refresh the page.");
        }
    }
});

/**
 * Sends the decrypted QR code data to the server to mark attendance.
 * @param {string} encryptedData - The decrypted encrypted data from the QR code.
 */
function markAttendance(encryptedData) {
    console.log('Sending encryptedData:', encryptedData); // For debugging
    const token = localStorage.getItem('token');
    fetch('/api/attendance/mark', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ encryptedData }),
        })
        .then(res => res.json())
        .then(data => {
            const statusMessage = document.getElementById('statusMessage');
            if (statusMessage) {
                statusMessage.innerText = data.message;
                statusMessage.style.color = data.success ? 'green' : 'red';
            }
        })
        .catch(err => {
            console.error('Error marking attendance:', err);
        });
}