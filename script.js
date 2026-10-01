class EarningsCalculator {
    constructor() {
        this.isRunning = false;
        this.startTime = null;
        this.totalEarnings = 0;
        this.earningsPerSecond = 0;
        this.totalWorkHours = 0; // New: track total accumulated work hours

        // New: localStorage keys for saving state
        this.storageKeys = {
            income: 'earningsCalc_income',
            frequency: 'earningsCalc_frequency',
            hoursPerWeek: 'earningsCalc_hoursPerWeek',
            timerState: 'earningsCalc_timerState',
            totalWorkHours: 'earningsCalc_totalWorkHours'
        };

        this.initializeElements();
        this.loadSavedState(); // New: load saved data on page load
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
        // Removed old Bezos-related element references
        this.workHoursTracker = document.getElementById('workHoursTracker');
        this.resetTrackerBtn = document.getElementById('resetTrackerBtn');
    }

    bindEvents() {
        this.startButton.addEventListener('click', () => this.toggleTimer());
        this.incomeInput.addEventListener('input', () => this.updateCalculations());
        this.frequencySelect.addEventListener('change', () => this.updateCalculations());
        this.hoursPerWeekInput.addEventListener('input', () => this.updateCalculations());
        this.resetTrackerBtn.addEventListener('click', () => this.resetWorkHoursTracker()); // New: reset button listener
    }

    // New: Save all app state to browser localStorage
    saveState() {
        const timerState = {
            isRunning: this.isRunning,
            startTime: this.startTime,
            totalEarnings: this.totalEarnings
        };
        localStorage.setItem(this.storageKeys.timerState, JSON.stringify(timerState));
        localStorage.setItem(this.storageKeys.income, this.incomeInput.value);
        localStorage.setItem(this.storageKeys.frequency, this.frequencySelect.value);
        localStorage.setItem(this.storageKeys.hoursPerWeek, this.hoursPerWeekInput.value);
        localStorage.setItem(this.storageKeys.totalWorkHours, this.totalWorkHours.toString());
    }

    // New: Load saved state from localStorage on page load
    loadSavedState() {
        // Restore input values
        const savedIncome = localStorage.getItem(this.storageKeys.income);
        if (savedIncome !== null) this.incomeInput.value = savedIncome;

        const savedFrequency = localStorage.getItem(this.storageKeys.frequency);
        if (savedFrequency !== null) this.frequencySelect.value = savedFrequency;

        const savedHoursPerWeek = localStorage.getItem(this.storageKeys.hoursPerWeek);
        if (savedHoursPerWeek !== null) this.hoursPerWeekInput.value = savedHoursPerWeek;

        // Restore timer state (resume if it was running when page closed)
        const savedTimerState = localStorage.getItem(this.storageKeys.timerState);
        if (savedTimerState) {
            const state = JSON.parse(savedTimerState);
            if (state.isRunning) {
                this.isRunning = true;
                this.startTime = state.startTime;
                this.totalEarnings = state.totalEarnings;
                this.startTimer(false); // Don't reset start time when resuming
                this.updateEarnings();
            } else {
                this.totalEarnings = state.totalEarnings || 0;
                this.mainCounter.textContent = `${this.totalEarnings.toLocaleString('de-DE', { minimumFractionDigits: 5, maximumFractionDigits: 5 })} €`;
            }
        }

        // Restore saved work hours tracker value
        const savedWorkHours = localStorage.getItem(this.storageKeys.totalWorkHours);
        if (savedWorkHours !== null) {
            this.totalWorkHours = parseFloat(savedWorkHours);
            this.updateWorkHoursTracker();
        }
    }

    // New: Update work hours tracker display
    updateWorkHoursTracker() {
        this.workHoursTracker.textContent = this.totalWorkHours.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // New: Reset work hours tracker to 0
    resetWorkHoursTracker() {
        this.totalWorkHours = 0;
        this.updateWorkHoursTracker();
        localStorage.setItem(this.storageKeys.totalWorkHours, '0');
        this.saveState();
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
        this.perHour.textContent = `${hourlyRate.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;

        // Calculate earnings per second (only during work hours)
        this.earningsPerSecond = hourlyRate / 3600; // 3600 seconds in an hour

        this.saveState(); // New: save input changes to localStorage
    }

    toggleTimer() {
        if (this.isRunning) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer(resetStartTime = true) {
        this.isRunning = true;
        if (resetStartTime) {
            this.startTime = Date.now();
            this.totalEarnings = 0;
        }
        
        this.startButton.innerHTML = '<span class="play-icon">⏸</span> STOP TIMER';
        this.startButton.classList.add('stop');
        
        this.timer = setInterval(() => this.updateEarnings(), 100);
    }

    stopTimer() {
        this.isRunning = false;
        clearInterval(this.timer);
        
        // Save final work hours when stopping timer
        localStorage.setItem(this.storageKeys.totalWorkHours, this.totalWorkHours.toString());
        
        this.startButton.innerHTML = '<span class="play-icon">▶</span> START TIMER';
        this.startButton.classList.remove('stop');
        
        this.saveState(); // New: persist state on stop
    }

    updateEarnings() {
        if (!this.isRunning) return;

        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - this.startTime) / 1000;
        
        // Calculate current earnings
        this.totalEarnings = this.earningsPerSecond * elapsedSeconds;
        
        // Update main counter
        this.mainCounter.textContent = `${this.totalEarnings.toLocaleString('de-DE', { minimumFractionDigits: 5, maximumFractionDigits: 5 })} €`;
        
        // Update total work hours (add current session time to saved total)
        const currentSessionHours = elapsedSeconds / 3600;
        this.totalWorkHours = parseFloat(localStorage.getItem(this.storageKeys.totalWorkHours) || 0) + currentSessionHours;
        this.updateWorkHoursTracker();
        
        // Save state periodically
        this.saveState();
    }
}

// Initialize the calculator when the page loads
let calculatorInstance;
document.addEventListener('DOMContentLoaded', () => {
    calculatorInstance = new EarningsCalculator();
});

// Save state when page is closed/refreshed
window.addEventListener('beforeunload', () => calculatorInstance.saveState());
