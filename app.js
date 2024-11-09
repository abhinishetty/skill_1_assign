const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());

class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(element, priority) {
        const complaint = { ...element, priority };
        let added = false;

        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].priority > complaint.priority) {
                this.items.splice(i, 0, complaint);
                added = true;
                break;
            }
        }

        if (!added) {
            this.items.push(complaint);
        }
    }

    dequeue() {
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }

    toArray() {
        return this.items;
    }
}

class Stack {
    constructor() {
        this.items = [];
    }

    push(element) {
        this.items.push(element);
    }

    pop() {
        return this.items.pop();
    }

    isEmpty() {
        return this.items.length === 0;
    }

    toArray() {
        return this.items;
    }
}

const priorityQueue = new PriorityQueue();
const resolvedStack = new Stack();

// Route to submit a complaint
app.post('/complaints', (req, res) => {
    const { description, priority, location } = req.body;
    const id = Date.now().toString();
    const timestamp = new Date().toISOString();
    const complaint = { id, description, location, timestamp };

    priorityQueue.enqueue(complaint, priority);
    res.status(201).json({ message: 'Complaint submitted successfully', complaint });
});

// Route to resolve a complaint
app.delete('/complaints', (req, res) => {
    if (priorityQueue.isEmpty()) {
        return res.status(400).json({ message: 'No complaints to resolve' });
    }
    const resolvedComplaint = priorityQueue.dequeue();
    resolvedStack.push(resolvedComplaint);
    res.status(200).json({ message: 'Complaint resolved', resolvedComplaint });
});

// Route to view unresolved complaints
app.get('/complaints', (req, res) => {
    res.status(200).json({ unresolvedComplaints: priorityQueue.toArray() });
});

// Route to undo the last resolved complaint
app.post('/complaints/undo', (req, res) => {
    if (resolvedStack.isEmpty()) {
        return res.status(400).json({ message: 'No complaints to undo' });
    }
    const undoneComplaint = resolvedStack.pop();
    priorityQueue.enqueue(undoneComplaint, undoneComplaint.priority);
    res.status(200).json({ message: 'Complaint resolution undone', undoneComplaint });
});

// Generate daily log file in CSV format
app.get('/generate-log', (req, res) => {
    const resolvedComplaints = resolvedStack.toArray();
    const headers = 'ID,Description,Priority,Location,Timestamp\n';
    const rows = resolvedComplaints.map(c =>
        `${c.id},${c.description},${c.priority},${c.location},${c.timestamp}`
    ).join('\n');
    const data = headers + rows;

    fs.writeFile('daily_log.csv', data, 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to generate log file', error: err });
        }
        res.status(200).json({ message: 'Daily log generated successfully', file: 'daily_log.csv' });
    });
});

module.exports = app;
