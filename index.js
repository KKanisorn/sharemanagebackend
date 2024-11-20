const express = require('express')
const app = express()
const cors = require('cors');
const port = 5000

const { connectDatabase, insertNewMember, checkDuplicate, verifyPassword, getName, insertStairGroup, getShareStairIfPayToday } = require('./database');

app.use(cors());
app.use(express.json());

const jwt = require('jsonwebtoken');
const SECRET = "your_secret_key";

try{
    connectDatabase();
}
catch(error){
    console.log(error)
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] // Expecting "Bearer <token>"

    // console.log(token);
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJrYW5pc29ybmtoZXRraHVlYW5AZ21haWwuY29tIiwiaWF0IjoxNzMwODE3MzAyLCJleHAiOjE3MzA4MjA5MDJ9.3Fp7mnMXrSFS-_M0Te4AI9ldm7R-ecT4bWdnxYFSHt0

    // Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJrYW5pc29ybmtoZXRraHVlYW5AZ21haWwuY29tIiwiaWF0IjoxNzMwODEyNjgxLCJleHAiOjE3MzA4MTYyODF9.Lx8NGQajj6beKFhbeHwGdffMUiL67n_jj06Eq40vfEs
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    jwt.verify(token, SECRET, { expiresIn: '24h' },(err, user) => {
        if (err) {
            console.log("Invaild Token")
            return res.status(403).json({message: 'Invalid Token'});
        }
        console.log("JWT PASSED")
        req.user = user; // Save decoded token data to request
        next(); // Pass control to the next handler
    });
}

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/login', async (req, res) => {
    const {emailOrUsername, password} = req.body

    console.log("Login Info Received: ", emailOrUsername, password)

    try {
        const { isDuplicate, results } = await checkDuplicate("member", "Email", emailOrUsername)
        if (isDuplicate) {
            if(verifyPassword(password, results[0]["Password"])) {
                const payload = {
                    sub: emailOrUsername,
                    iat: Math.floor(Date.now() / 1000),
                };
                const token = jwt.sign(payload, SECRET, { expiresIn: '24h' }); // Set an expiration as needed, e.g., 1 hour
                res.send({ token });
                // res.status(200).json({message: "Login Successful"})
           }
            else{
                res.status(200).json({message: "Login Failed"})
            }
        }else{
            res.status(200).json({message: "Login Failed"})
        }
    } catch (e) {
        console.error("Error checkDuplicate: ", e)
    }


})

app.post('/register', async (req, res) => {
    const {firstName, lastName, email, password, repassword} = req.body
    console.log("Register Info Received: ", firstName, lastName, email, password, repassword)

    try {
        const isDuplicate = await checkDuplicate("member", "Email", email)
        console.log("Duplicate is: ",isDuplicate)
        if (!isDuplicate) {
            insertNewMember(firstName, lastName, email, password)
            const payload = {
                sub: email,
                iat: Math.floor(Date.now() / 1000),
            };
            const token = jwt.sign(payload, SECRET, { expiresIn: '1h' }); // Set an expiration as needed, e.g., 1 hour
            res.send({ token });
            // res.status(200).json({message: "Register Successful"})
            // console.log("Register Successful")
        } else {
            res.status(200).json({message: "Login Failed Duplicated Email"})
        }
    }catch (e){
        console.error("Error checkDuplicate: ", e)
    }
})



app.get("/getname/:email", authenticateToken, async (req, res) => {
    const email = req.params.email; // Access email directly
    // console.log("Email is: ",email)

    try {
        // Assuming getName is asynchronous and returns an object like { Name: "User's Name" }
        const result = await getName("member", email);
        const name = result ? result.Name : null;

        if (name) {
            // console.log("Name is: ", name);
            return res.json({ name });
        } else {
            console.log("User not found: ")
            return res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Error during getName:", error);
        return res.status(500).json({ message: "Error retrieving name" });
    }
});

app.post("/addStairGroup", authenticateToken, async (req, res) => {
    const {
        houseName,
        groupName,
        principalAmount,
        handsReceived,
        totalHands,
        days,
        perHandAmount,
        handsDeducted,
        handsSent,
        maintenanceFee,
        startDate,
        email
    } = req.body;


    // console.log(houseName ? houseName.trim() : 'houseName is null or undefined');
    if (!houseName || !groupName || !principalAmount || !startDate) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    console.log(req.body);

    await insertStairGroup(houseName, groupName, principalAmount, handsReceived, totalHands, days, perHandAmount, handsDeducted, handsSent, maintenanceFee, startDate, email)


    // console.log(houseName)
    res.status(200).json({ message: "Group added successfully", data: req.body });
})

app.get("/getShareStairIfPay/:email", authenticateToken, async (req, res) =>{
    const email = req.params.email;
    console.log("Email is :", email)

    const result = await getShareStairIfPayToday(email)
    console.log("Result is:", result)

    res.json(result)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})