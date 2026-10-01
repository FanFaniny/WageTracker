class EarningsCalculator {
    constructor() {
        this.isRunning = false;
        this.startTime = null;
        this.totalEarnings = 0;
        this.earningsPerSecond = 0;
        this.lastSavedSecond = 0; // For throttling saveState calls
        
        // Fixed: separate base hours (saved) from current session hours
        this.baseWorkHours = 0; // Saved hours from localStorage
        this.currentSessionHours = 0; // Current running session
        this.totalWorkHours = 0; // Add this line to fix undefined hours

        this.storageKeys = {
            income: 'earningsCalc_income',
            frequency: 'earningsCalc_frequency',
            hoursPerWeek: 'earningsCalc_hoursPerWeek',
            timerState: 'earningsCalc_timerState',
            totalWorkHours: 'earningsCalc_totalWorkHours'
        };

        this.initializeElements();
        this.loadSavedState();
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
        this.resetEarningsBtn = document.getElementById('resetEarningsBtn'); // Fixed: add missing reset button initialization
        
        // New tracker elements
        this.trackerHours = document.getElementById('trackerHours');
        this.trackerMinutes = document.getElementById('trackerMinutes');
        this.trackerSeconds = document.getElementById('trackerSeconds');
        this.manualHoursInput = document.getElementById('manualHoursInput');
        this.addManualHoursBtn = document.getElementById('addManualHours');
        this.resetTrackerBtn = document.getElementById('resetTrackerBtn');
    }

    bindEvents() {
        this.startButton.addEventListener('click', () => this.toggleTimer());
        this.incomeInput.addEventListener('input', () => this.updateCalculations());
        this.frequencySelect.addEventListener('change', () => this.updateCalculations());
        this.hoursPerWeekInput.addEventListener('input', () => this.updateCalculations());
        
        // Fixed: add safety check for reset earnings button
        if (this.resetEarningsBtn) {
            this.resetEarningsBtn.addEventListener('click', () => this.resetEarnings());
        }
        
        this.resetTrackerBtn.addEventListener('click', () => this.resetWorkHoursTracker());
        
        // New: manual hours input handlers
        this.addManualHoursBtn.addEventListener('click', () => this.addManualHours());
        this.manualHoursInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addManualHours();
        });
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
        localStorage.setItem(this.storageKeys.totalWorkHours, this.baseWorkHours.toString()); // Fixed: save base hours, not total (avoids double counting)
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

        // Restore timer state (earnings are stored here)
        const savedTimerState = localStorage.getItem(this.storageKeys.timerState);
        if (savedTimerState) {
            const state = JSON.parse(savedTimerState);
            this.totalEarnings = state.totalEarnings || 0;
            this.mainCounter.textContent = `${this.totalEarnings.toLocaleString('de-DE', { minimumFractionDigits: 5, maximumFractionDigits: 5 })} €`;
            
            if (state.isRunning) {
                // Timer was running when page closed - stop it and save
                this.isRunning = false;
                this.saveState();
            }
        }

        // Restore saved work hours
        const savedWorkHours = localStorage.getItem(this.storageKeys.totalWorkHours);
        if (savedWorkHours !== null) {
            this.baseWorkHours = parseFloat(savedWorkHours);
            this.totalWorkHours = this.baseWorkHours;
            this.updateWorkHoursTracker();
        }
    }

    // New: Add manual hours to tracker
    addManualHours() {
        const hoursToAdd = parseFloat(this.manualHoursInput.value);
        if (hoursToAdd > 0) {
            this.baseWorkHours += hoursToAdd;
            this.totalWorkHours = this.baseWorkHours + this.currentSessionHours;
            this.updateWorkHoursTracker();
            this.saveState();
            this.manualHoursInput.value = '';
        }
    }

    // New: Update work hours tracker display (H:M:S format)
    updateWorkHoursTracker() {
        // Fixed: add safety check for tracker elements
        if (!this.trackerHours || !this.trackerMinutes || !this.trackerSeconds) return;
        
        const totalSeconds = Math.floor(this.totalWorkHours * 3600);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        this.trackerHours.textContent = hours.toString().padStart(2, '0');
        this.trackerMinutes.textContent = minutes.toString().padStart(2, '0');
        this.trackerSeconds.textContent = seconds.toString().padStart(2, '0');
    }

    // New: Reset work hours tracker to 0
    resetWorkHoursTracker() {
        this.baseWorkHours = 0;
        this.currentSessionHours = 0;
        this.totalWorkHours = 0;
        this.updateWorkHoursTracker();
        localStorage.setItem(this.storageKeys.totalWorkHours, '0');
        this.saveState();
    }

    // New: Reset earnings counter
    resetEarnings() {
        this.totalEarnings = 0;
        this.mainCounter.textContent = '0,00000 €';
        this.saveState(); // This now saves earnings in timerState
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
            case 'hourly': // New: hourly rate calculation
                annualIncome = income * hoursPerWeek * 52;
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
            this.currentSessionHours = 0; // Reset current session
        }
        
        this.startButton.innerHTML = '<span class="play-icon">⏸</span> STOP TIMER';
        this.startButton.classList.add('stop');
        
        this.timer = setInterval(() => this.updateEarnings(), 100);
    }

    stopTimer() {
        this.isRunning = false;
        clearInterval(this.timer);
        
        // Save current session to base before stopping
        this.baseWorkHours = this.totalWorkHours;
        localStorage.setItem(this.storageKeys.totalWorkHours, this.baseWorkHours.toString());
        
        this.startButton.innerHTML = '<span class="play-icon">▶</span> START TIMER';
        this.startButton.classList.remove('stop');
        
        this.saveState();
    }

    updateEarnings() {
        if (!this.isRunning) return;

        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - this.startTime) / 1000;
        
        // Calculate current earnings
        this.totalEarnings = this.earningsPerSecond * elapsedSeconds;
        
        // Update main counter
        this.mainCounter.textContent = `${this.totalEarnings.toLocaleString('de-DE', { minimumFractionDigits: 5, maximumFractionDigits: 5 })} €`;
        
        // Update work hours: base (saved) + current session
        this.currentSessionHours = elapsedSeconds / 3600;
        this.totalWorkHours = this.baseWorkHours + this.currentSessionHours;
        this.updateWorkHoursTracker();
        
        // Save state periodically (throttled to every second to avoid performance issues)
        if (Math.floor(elapsedSeconds) > this.lastSavedSecond) {
            this.saveState();
            this.lastSavedSecond = Math.floor(elapsedSeconds);
        }
    }
}

// Initialize the calculator when the page loads
let calculatorInstance;
document.addEventListener('DOMContentLoaded', () => {
    calculatorInstance = new EarningsCalculator();
});

// Save state when page is closed/refreshed
window.addEventListener('beforeunload', () => calculatorInstance.saveState());
