// public/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    // Redirect to login if not authenticated
    if (!token && !isLoginPage()) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize functionalities based on the current page
    if (isLoginPage()) {
        setupLoginForm();
    } else {
        if (isDashboardPage()) {
            loadMembers();
            setupDashboardEventListeners();
        }
        if (isAddMemberPage()) {
            setupAddMemberForm();
        }
        if (isScanAttendancePage()) {
            setupQRScanner();
        }
    }
});

/**
 * Checks if the current page is login.html
 */
function isLoginPage() {
    return window.location.pathname.endsWith('login.html');
}

/**
 * Checks if the current page is dashboard.html
 */
function isDashboardPage() {
    return window.location.pathname.endsWith('dashboard.html');
}

/**
 * Checks if the current page is addMember.html
 */
function isAddMemberPage() {
    return window.location.pathname.endsWith('addMember.html');
}

/**
 * Checks if the current page is scanAttendance.html
 */
function isScanAttendancePage() {
    return window.location.pathname.endsWith('scanAttendance.html');
}

/**
 * Sets up the login form submission
 */
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.error('Login form not found!');
        return;
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })
            .then((res) => res.json())
            .then((data) => {
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    window.location.href = 'dashboard.html';
                } else {
                    const errorMessage = document.getElementById('errorMessage');
                    if (errorMessage) {
                        errorMessage.innerText = data.message;
                        errorMessage.style.color = 'red';
                    }
                }
            })
            .catch((err) => {
                console.error('Error during login:', err);
            });
    });
}

/**
 * Sets up event listeners on the dashboard page
 */
function setupDashboardEventListeners() {
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    const downloadPDFBtn = document.getElementById('downloadPDFBtn');
    const downloadModeElement = document.getElementById('downloadMode');
    const attendanceDateElement = document.getElementById('attendanceDate');

    if (downloadExcelBtn) {
        downloadExcelBtn.addEventListener('click', () => {
            const mode = downloadModeElement ? downloadModeElement.value : 'individual';
            if (mode === 'qrcodes') {
                downloadQRCodeImages();
            } else {
                downloadExcelFiles();
            }
        });
    }

    if (downloadPDFBtn) {
        downloadPDFBtn.addEventListener('click', () => {
            const mode = downloadModeElement ? downloadModeElement.value : 'individual';
            if (mode === 'qrcodes') {
                downloadQRCodeImages();
            } else {
                downloadPDFFiles();
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }

    const addMemberBtn = document.getElementById('addMemberBtn');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => {
            window.location.href = 'addMember.html';
        });
    }

    const scanBtn = document.getElementById('scanBtn');
    if (scanBtn) {
        scanBtn.addEventListener('click', () => {
            window.location.href = 'scanAttendance.html';
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchMembers);
    }
}

/**
 * Sets up the add member form submission
 */
function setupAddMemberForm() {
    const addMemberForm = document.getElementById('addMemberForm');
    if (!addMemberForm) {
        console.error('Add Member form not found!');
        return;
    }

    addMemberForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const number = document.getElementById('number').value.trim();
        const qrColorDark = document.getElementById('qrColorDark').value;
        const qrColorLight = document.getElementById('qrColorLight').value;

        // Validate the number input
        if (!validatePhoneNumber(number)) {
            displayAddMemberMessage('Please enter a valid 10-digit number.', true);
            return;
        }

        const qrOptions = {
            colorDark: qrColorDark,
            colorLight: qrColorLight,
        };

        const token = localStorage.getItem('token');
        const submitButton = addMemberForm.querySelector('button[type="submit"]');
        const loadingIndicator = document.getElementById('loading');

        submitButton.disabled = true; // Disable the button to prevent multiple submissions
        if (loadingIndicator) loadingIndicator.style.display = 'block'; // Show loading

        fetch('/api/members/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, number, qrOptions }),
            })
            .then((res) => res.json())
            .then((data) => {
                if (data.id) {
                    displayAddMemberMessage('Member added successfully!', false);
                    addMemberForm.reset();
                } else {
                    displayAddMemberMessage(data.message, true);
                }
            })
            .catch((err) => {
                console.error('Error adding member:', err);
                displayAddMemberMessage('An error occurred while adding the member.', true);
            })
            .finally(() => {
                submitButton.disabled = false; // Re-enable the button after processing
                if (loadingIndicator) loadingIndicator.style.display = 'none'; // Hide loading
            });
    });
}

/**
 * Displays a message in the add member form
 * @param {string} message - The message to display
 * @param {boolean} isError - Whether the message is an error
 */
function displayAddMemberMessage(message, isError) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.innerText = message;
        messageElement.style.color = isError ? 'red' : 'green';
    }
}

/**
 * Validates that the phone number is exactly 10 digits
 * @param {string} number - The phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
function validatePhoneNumber(number) {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(number);
}

/**
 * Downloads Excel files based on the selected mode
 */
function downloadExcelFiles() {
    const token = localStorage.getItem('token');
    const downloadModeElement = document.getElementById('downloadMode');
    const mode = downloadModeElement ? downloadModeElement.value : 'individual';
    const dateElement = document.getElementById('attendanceDate');
    const date = dateElement ? dateElement.value : '';
    const excelLoading = document.getElementById('excelLoading');

    let url = `/api/members/download/excel?mode=${mode}`;
    if (date) {
        url += `&date=${encodeURIComponent(date)}`;
    }

    if (excelLoading) excelLoading.style.display = 'block'; // Show loading

    fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
        .then((res) => {
            if (excelLoading) excelLoading.style.display = 'none'; // Hide loading
            if (!res.ok) throw new Error('Network response was not ok');
            return res.blob();
        })
        .then((blob) => {
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            if (mode === 'qrcodes') {
                link.setAttribute('download', 'qr_codes.zip');
            } else if (mode === 'combined') {
                link.setAttribute('download', 'members.xlsx');
            } else {
                link.setAttribute('download', 'members_excel.zip');
            }

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch((err) => {
            if (excelLoading) excelLoading.style.display = 'none'; // Hide loading
            console.error('Error downloading Excel files:', err);
        });
}

/**
 * Downloads PDF files based on the selected mode
 */
function downloadPDFFiles() {
    const token = localStorage.getItem('token');
    const downloadModeElement = document.getElementById('downloadMode');
    const mode = downloadModeElement ? downloadModeElement.value : 'individual';
    const dateElement = document.getElementById('attendanceDate');
    const date = dateElement ? dateElement.value : '';
    const pdfLoading = document.getElementById('pdfLoading');

    let url = `/api/members/download/pdf?mode=${mode}`;
    if (date) {
        url += `&date=${encodeURIComponent(date)}`;
    }

    if (pdfLoading) pdfLoading.style.display = 'block'; // Show loading

    fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
        .then((res) => {
            if (pdfLoading) pdfLoading.style.display = 'none'; // Hide loading
            if (!res.ok) throw new Error('Network response was not ok');
            return res.blob();
        })
        .then((blob) => {
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            if (mode === 'qrcodes') {
                link.setAttribute('download', 'qr_codes.zip');
            } else if (mode === 'combined') {
                link.setAttribute('download', 'members.pdf');
            } else {
                link.setAttribute('download', 'members_pdf.zip');
            }

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch((err) => {
            if (pdfLoading) pdfLoading.style.display = 'none'; // Hide loading
            console.error('Error downloading PDF files:', err);
        });
}

/**
 * Downloads QR Code images as a ZIP file
 */
function downloadQRCodeImages() {
    const token = localStorage.getItem('token');
    const dateElement = document.getElementById('attendanceDate');
    const date = dateElement ? dateElement.value : '';
    const qrLoading = document.getElementById('qrLoading');

    let url = '/api/members/download/qrcodes';
    if (date) {
        url += `?date=${encodeURIComponent(date)}`;
    }

    if (qrLoading) qrLoading.style.display = 'block'; // Show loading

    fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
        .then((res) => {
            if (qrLoading) qrLoading.style.display = 'none'; // Hide loading
            if (!res.ok) throw new Error('Network response was not ok');
            return res.blob();
        })
        .then((blob) => {
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', 'qr_codes.zip');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch((err) => {
            if (qrLoading) qrLoading.style.display = 'none'; // Hide loading
            console.error('Error downloading QR code images:', err);
        });
}

/**
 * Loads all members from the server and populates the table
 */
function loadMembers() {
    const token = localStorage.getItem('token');

    fetch('/api/members/all', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
        .then((res) => res.json())
        .then((members) => {
            populateTable(members);
        })
        .catch((err) => {
            console.error('Error loading members:', err);
        });
}

/**
 * Populates the members table with data
 * @param {Array} members - Array of member objects
 */
function populateTable(members) {
    const tbody = document.getElementById('memberTable').querySelector('tbody');
    if (!tbody) {
        console.error('Member table body not found!');
        return;
    }
    tbody.innerHTML = '';

    let presentCount = 0;
    let absentCount = 0;

    members.forEach((member) => {
        const row = tbody.insertRow();

        const nameCell = row.insertCell(0);
        const numberCell = row.insertCell(1);
        const qrCodeCell = row.insertCell(2);
        const attendanceCell = row.insertCell(3);

        nameCell.innerText = member.name;
        numberCell.innerText = member.number;

        const qrCodeImg = document.createElement('img');
        qrCodeImg.src = member.qr_code;
        qrCodeImg.alt = 'QR Code';
        qrCodeImg.classList.add('qr-code');
        qrCodeImg.addEventListener('click', () => {
            alert(`Name: ${member.name}\nNumber: ${member.number}`);
        });
        qrCodeCell.appendChild(qrCodeImg);

        attendanceCell.innerText = member.attendance ? 'Present' : 'Absent';

        if (member.attendance) {
            presentCount++;
        } else {
            absentCount++;
        }
    });

    updateCounts(members.length, presentCount, absentCount);
}

/**
 * Updates the attendance counts displayed on the dashboard
 * @param {number} total - Total number of members
 * @param {number} present - Number of present members
 * @param {number} absent - Number of absent members
 */
function updateCounts(total, present, absent) {
    const totalCount = document.getElementById('totalCount');
    const presentCount = document.getElementById('presentCount');
    const absentCount = document.getElementById('absentCount');

    if (totalCount) totalCount.innerText = total;
    if (presentCount) presentCount.innerText = present;
    if (absentCount) absentCount.innerText = absent;
}

/**
 * Searches for members based on the query and updates the table
 */
function searchMembers() {
    const query = document.getElementById('searchInput').value.trim();
    const token = localStorage.getItem('token');

    fetch(`/api/members/search?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
        .then((res) => res.json())
        .then((members) => {
            populateTable(members);
        })
        .catch((err) => {
            console.error('Error searching members:', err);
        });
}

/**
 * Sets up the QR scanner on the scan attendance page
 */
function setupQRScanner() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        navigator.mediaDevices.enumerateDevices().then(devices => {
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
        });
    } catch (err) {
        console.error(err);
        alert("Camera access is blocked. Please enable camera permissions and refresh the page.");
    }
}

/**
 * Sends the decrypted QR code data to the server to mark attendance
 * @param {string} encryptedData - The decrypted encrypted data from the QR code
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