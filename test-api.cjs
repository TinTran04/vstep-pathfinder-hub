const jwt = require('jsonwebtoken');

const token = jwt.sign(
    {
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "2",
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "user"
    },
    "YOUR_SUPER_SECRET_KEY_AT_LEAST_32_CHARACTERS",
    {
        issuer: "VAIApplication",
        audience: "VAIApplicationUsers",
        expiresIn: "1h"
    }
);

async function testApi() {
    try {
        const historyRes = await fetch('http://localhost:5177/api/attempts/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const historyText = await historyRes.text();
        console.log("History Body:", historyText);
        
        const history = JSON.parse(historyText);
        if (history.data && history.data.items && history.data.items.length > 0) {
            const latestAttempt = history.data.items[0];
            console.log("Fetching debug-review for attempt:", latestAttempt.attemptId);
            
            const reviewRes = await fetch(`http://localhost:5177/api/attempts/debug-review/${latestAttempt.attemptId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Debug-Review Status:", reviewRes.status);
            const reviewText = await reviewRes.text();
            console.log("Debug-Review Body:", reviewText);
        }
    } catch (e) {
        console.error(e);
    }
}

testApi();
