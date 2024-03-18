// I ❤️ Chat GPT

export type Counter = {
    name: string;
    value: number;
};

export type CounterMap = Record<string, Counter>;

export class CounterManager {
    private counters: CounterMap = {};

    // Function to increment the value of a counter and return the current value
    incrementCounter(name: string, amount: number = 1): number {
        if (!this.counters[name]) {
            this.counters[name] = { name, value: 0 };
        }
        this.counters[name].value += amount;
        return this.counters[name].value;
    }

    // Function to decrement the value of a counter and return the current value
    decrementCounter(name: string, amount: number = 1): number {
        if (this.counters[name]) {
            this.counters[name].value -= amount;
            if (this.counters[name].value < 0) {
                this.counters[name].value = 0; // Ensure the counter doesn't go below zero
            }
            return this.counters[name].value;
        }
        return 0; // Counter doesn't exist, return 0
    }
}
