let interval = null;
let expected = Date.now();
const TICK_RATE = 100;

self.onmessage = (e) => {
    const action = e.data.action || e.data; // Handle both Object and String for safety

    if (action === 'START') {
        expected = Date.now();
        // Clear any existing to prevent double-speed
        if (interval) clearTimeout(interval); 
        interval = setTimeout(step, TICK_RATE);
    } 
    else if (action === 'STOP') {
        clearTimeout(interval);
    }
};

function step() {
    const dt = Date.now() - expected;
    if (dt > TICK_RATE) expected += dt;
    expected += TICK_RATE;
    
    // Post back
    self.postMessage({ type: 'TICK', dt: TICK_RATE });
    
    interval = setTimeout(step, Math.max(0, TICK_RATE - dt));
}