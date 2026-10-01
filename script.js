class EarningsCalculator {
    constructor() {
        this.isRunning = false;
        this.startTime = null;
        this.totalEarnings = 0;
        this.earningsPerSecond = 0;
        this.bezosEarningsPerSecond = 3174; // Approximate earnings per second for Jeff Bezos
        
        this.initializeElements();
        this.bindEvents();
        this.updateCalculations();
    }

    initializeElements() {
        this.mainCounter = document.getElementById('mainCounter');
        this.workHours = document.getElementById('workHours');
        this.perHour = document.getElementById('perHour');
        this.incomeInput = document.getElementById('income');
        this.frequencySelect = document.getElementById('frequency');
        this.hoursPerWeekInput = document.getElementById('hoursPerWeek');
        this.startButton = document.getElementById('startButton');
        this.userEarnings = document.getElementById('userEarnings');
        this.bezosEarnings = document.getElementById('bezosEarnings');
    }

    bindEvents() {
        this.startButton.addEventListener('click', () => this.toggleTimer());
        this.incomeInput.addEventListener('input', () => this.updateCalculations());
        this.frequencySelect.addEventListener('change', () => this.updateCalculations());
        this.hoursPerWeekInput.addEventListener('input', () => this.updateCalculations());
    }

    updateCalculations() {
        const income = parseFloat(this.incomeInput.value) || 0;
        const frequency = this.frequencySelect.value;
        const hoursPerWeek = parseFloat(this.hoursPerWeekInput.value) || 40;

        // Calculate annual income
        let annualIncome = income;
        switch (frequency) {
            case 'monthly':
                annualIncome = income * 12;
                break;
            case 'weekly':
                annualIncome = income * 52;
                break;
            case 'daily':
                annualIncome = income * 5 * 52; // Assuming 5 work days per week
                break;
            case 'yearly':
                annualIncome = income;
                break;
        }

        // Calculate work hours per year
        const workHoursPerYear = hoursPerWeek * 52;
        this.workHours.textContent = workHoursPerYear.toLocaleString('de-DE');

        // Calculate hourly rate
        const hourlyRate = annualIncome / workHoursPerYear;
        this.perHour.textContent = `${hourlyRate.toFixed(2)}€`;

        // Calculate earnings per second (only during work hours)
        this.earningsPerSecond = hourlyRate / 3600; // 3600 seconds in an hour
    }

    toggleTimer() {
        if (this.isRunning) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        this.isRunning = true;
        this.startTime = Date.now();
        this.totalEarnings = 0;
        
        this.startButton.innerHTML = '<span class="play-icon">⏸</span> STOP TIMER';
        this.startButton.classList.add('stop');
        
        this.timer = setInterval(() => this.updateEarnings(), 100); // Update every 100ms for smooth animation
    }

    stopTimer() {
        this.isRunning = false;
        clearInterval(this.timer);
        
        this.startButton.innerHTML = '<span class="play-icon">▶</span> START TIMER';
        this.startButton.classList.remove('stop');
    }

    updateEarnings() {
        if (!this.isRunning) return;

        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - this.startTime) / 1000;
        
        // Calculate current earnings
        this.totalEarnings = this.earningsPerSecond * elapsedSeconds;
        
        // Update main counter
        this.mainCounter.textContent = `${this.totalEarnings.toFixed(5)} €`;
        
        // Update comparison earnings
        this.userEarnings.textContent = `${this.totalEarnings.toFixed(2)}€`;
        
        const bezosTotal = this.bezosEarningsPerSecond * elapsedSeconds;
        this.bezosEarnings.textContent = `${bezosTotal.toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}€`;
    }

    formatNumber(num) {
        return num.toLocaleString('de-DE', {
            minimumFractionDigits: 5,
            maximumFractionDigits: 5
        });
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new EarningsCalculator();
});
