document.addEventListener("DOMContentLoaded", function () {
    const users = document.querySelectorAll(".user-list li");
    const modal = document.getElementById("modal");
    const closeModal = document.querySelector(".close");
    const transferBtn = document.getElementById("transfer-btn");
    const amountInput = document.getElementById("amount");
    const recipientName = document.getElementById("recipient-name");
    const alertBox = document.getElementById("alert-box");
    const alertText = document.getElementById("alert-text");
    const successBox = document.getElementById("success-box");

    let transactionHistory = {};

    users.forEach(user => {
        user.addEventListener("click", () => {
            modal.style.display = "flex";
            recipientName.innerText = `Send money to ${user.dataset.name}`;
            amountInput.value = "";
            amountInput.focus();
            transferBtn.dataset.recipient = user.dataset.name;
        });
    });

    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    transferBtn.addEventListener("click", () => {
        const recipient = transferBtn.dataset.recipient;
        const amount = parseFloat(amountInput.value);

        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        if (!transactionHistory[recipient]) {
            transactionHistory[recipient] = [];
        }

        // If there are at least two previous transactions, check for anomaly
        if (transactionHistory[recipient].length > 1) {
            const avg = transactionHistory[recipient].reduce((a, b) => a + b, 0) / transactionHistory[recipient].length;
            const threshold = avg * 2.5;

            if (amount > threshold) {
                showAlert(`Unusual transaction detected! Transaction failed.`);
                modal.style.display = "none";
                return; // STOP the transaction from being logged
            }
        }

        // If no anomaly, log the transaction
        transactionHistory[recipient].push(amount);
        modal.style.display = "none";
        showSuccess();
        updateTransactions(recipient);
    });

    function showAlert(message) {
        alertText.innerText = message;
        alertBox.style.display = "block";
        setTimeout(() => alertBox.style.display = "none", 3000);
    }

    function showSuccess() {
        successBox.style.display = "block";
        setTimeout(() => successBox.style.display = "none", 2000);
    }

    function updateTransactions(recipient) {
        document.querySelector(`[data-name="${recipient}"] .transactions`).innerHTML =
            transactionHistory[recipient].map(a => `₹${a}`).join(", ");
    }
});
